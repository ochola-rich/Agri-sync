import { enqueueOp } from './syncQueue';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = 'http://localhost:8080';

export type CreateCollectionPayload = {
  farmerId: string;
  items: any[];
  metadata?: any;
};

export async function createCollection(payload: CreateCollectionPayload) {
  const op = {
    id: uuidv4(),
    method: 'POST' as const,
    url: `${API_BASE}/collections`,
    body: payload,
    attempts: 0,
    createdAt: Date.now(),
    status: 'pending' as const,
  };

  // optimistic local behavior: try network first, otherwise enqueue
  if (navigator.onLine) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(op.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(op.body),
      });
      if (res.ok) {
        return { ok: true, queued: false, result: await res.json().catch(() => ({})) };
      }
      // on conflict or server error, enqueue for durable processing
    } catch (_err) {
      // fallthrough - enqueue
    }
  }

  await enqueueOp(op);
  return { ok: true, queued: true, opId: op.id };
}

export async function updateCollectionStatus(id: string, status: string, version: number) {
  const op = {
    id: uuidv4(),
    method: 'PATCH' as const,
    url: `${API_BASE}/collections/${id}/status`,
    body: { status, version },
    attempts: 0,
    createdAt: Date.now(),
    status: 'pending' as const,
  };

  if (navigator.onLine) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(op.url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(op.body),
      });
      if (res.ok) {
        return { ok: true, queued: false, result: await res.json().catch(() => ({})) };
      }
      // if 409 or other error -> enqueue
    } catch (_err) {
      // enqueue
    }
  }

  await enqueueOp(op);
  return { ok: true, queued: true, opId: op.id };
}