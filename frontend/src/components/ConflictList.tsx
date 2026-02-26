import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';

export default function ConflictList() {
  const [failedOps, setFailedOps] = useState<any[]>([]);

  async function loadFailed() {
    const items = await db.outgoing.where('status').equals('failed').toArray();
    setFailedOps(items);
  }

  useEffect(() => {
    loadFailed();
    const iv = window.setInterval(loadFailed, 2000);
    // also refresh on online event
    window.addEventListener('online', loadFailed);
    return () => {
      window.clearInterval(iv);
      window.removeEventListener('online', loadFailed);
    };
  }, []);

  async function retry(op: any) {
    await db.outgoing.update(op.id, { status: 'pending', attempts: 0, lastError: null });
    // main queue processor will pick this up automatically
    loadFailed();
  }

  async function viewServer(op: any) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(op.url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await res.json().catch(() => null);
      // quick inspector - replace with better UI if desired
      // eslint-disable-next-line no-alert
      alert(JSON.stringify(payload, null, 2));
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Failed to fetch server resource');
    }
  }

  if (failedOps.length === 0) return null;

  return (
    <div style={{ position: 'fixed', right: 8, bottom: 8, zIndex: 1000, width: 360, background: '#fff', border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <strong>Pending Conflicts / Failed Ops</strong>
      <div style={{ maxHeight: 240, overflow: 'auto', marginTop: 8 }}>
        {failedOps.map((op) => (
          <div key={op.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{op.method} {op.url}</div>
            <pre style={{ fontSize: 11, maxHeight: 120, overflow: 'auto' }}>{JSON.stringify(op.body, null, 2)}</pre>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => retry(op)}>Retry</button>
              <button onClick={() => viewServer(op)}>View server</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}