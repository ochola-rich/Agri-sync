import { db } from './db';
import type { OutgoingOp } from './db';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function sendOp(op: OutgoingOp) {
  try {
    const headers: any = { 'Content-Type': 'application/json' };
    // attach Authorization from local storage if present
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(op.url, {
      method: op.method,
      headers,
      body: op.body ? JSON.stringify(op.body) : undefined,
    });

    if (res.status === 409) {
      // conflict — keep op failed and surface details
      const payload = await res.json().catch(() => ({}));
      throw { type: 'conflict', payload };
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }

    return await res.json().catch(() => ({}));
  } catch (err: any) {
    throw err;
  }
}

export async function enqueueOp(op: OutgoingOp) {
  op.createdAt = Date.now();
  op.attempts = 0;
  op.status = 'pending';
  await db.outgoing.put(op);
}

let running = false;
export async function processQueueOnce() {
  if (running) return;
  running = true;
  try {
    const pending = await db.outgoing.where('status').equals('pending').limit(10).toArray();
    for (const op of pending) {
      await db.outgoing.update(op.id, { status: 'processing' });
      try {
        let attempt = op.attempts ?? 0;
        let success = false;
        while (attempt < MAX_RETRIES && !success) {
          try {
            await sendOp(op);
            success = true;
            await db.outgoing.update(op.id, { status: 'done' });
            await db.outgoing.delete(op.id);
          } catch (err: any) {
            attempt++;
            await db.outgoing.update(op.id, { attempts: attempt, lastError: String(err?.message || err) });
            if ((err?.type === 'conflict')) {
              // stop retrying and mark failed so UI can handle merge
              await db.outgoing.update(op.id, { status: 'failed' });
              break;
            }
            if (attempt >= MAX_RETRIES) {
              await db.outgoing.update(op.id, { status: 'failed' });
              break;
            }
            // exponential backoff
            const backoff = BASE_DELAY_MS * Math.pow(2, attempt - 1);
            await delay(backoff);
          }
        }
      } catch (err) {
        // err has unknown type here; cast to any to safely access .message
        await db.outgoing.update(op.id, { status: 'failed', lastError: String((err as any)?.message ?? err) });
      }
    }
  } finally {
    running = false;
  }
}

let processorInterval: number | undefined;
export function startQueueProcessor() {
  // run immediately and then on interval; also run when online event fires
  processQueueOnce();
  window.addEventListener('online', () => processQueueOnce());
  if (!processorInterval) {
    processorInterval = window.setInterval(() => processQueueOnce(), 10_000);
  }
}