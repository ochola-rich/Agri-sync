import { getAllCollections } from './db';
import { API_BASE, authHeader, getToken } from './auth';

const COLLECTIONS_ENDPOINT = `${API_BASE}/collections`;

/**
 * Post with per-item exponential backoff retries.
 * Treat 4xx (except 429) as permanent. Treat 5xx and network errors as transient.
 */
async function postWithRetry(item: any, maxAttempts = 5) {
  let attempt = 0;
  let delay = 500;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      const res = await fetch(COLLECTIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({
          farmer_id: item.farmerId,
          crop_type: item.cropType,
          weight_kg: Number(item.weightKg) || 0,
          price_per_kg: Number(item.pricePerKg) || 0,
          // minimal conflict metadata to help server
          client_written_at: item.updatedAt,
          writer_id: item.writerId,
        }),
      });
      if (res.ok) return { ok: true, res };
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return { ok: false, res, permanent: true };
      }
      // transient (5xx or 429) -> retry
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(10000, delay * 2);
    } catch (err) {
      // network error -> retry
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(10000, delay * 2);
    }
  }
  return { ok: false, res: null, permanent: false };
}

export function startSyncProcess(intervalMs = 30000) {
  let stopped = false;

  const syncOnce = async () => {
    if (stopped) return;
    const token = getToken();
    if (!token) {
      console.debug('[sync] no auth token, skipping sync');
      return;
    }

    try {
      const all = await getAllCollections();
      const pending = all.filter((x: any) => x.status === 'pending' || x.status === 'error');
      if (!pending.length) return;

      for (const item of pending) {
        try {
          const result = await postWithRetry(item, 5);
          if (result.ok) {
            try {
              const db = await import('./db');
              if (typeof db.updateCollectionStatus === 'function') {
                await db.updateCollectionStatus(item.id, 'synced');
              }
            } catch {}
          } else if (result.permanent) {
            try {
              const db = await import('./db');
              if (typeof db.updateCollectionStatus === 'function') {
                await db.updateCollectionStatus(item.id, 'error');
              }
            } catch {}
          } else {
            console.debug('[sync] transient failure, will retry later for', item.id);
          }
        } catch (err) {
          console.error('[sync] item failed', item.id, err);
        }
      }
    } catch (err) {
      console.error('[sync] top-level failure', err);
    }
  };

  syncOnce();
  const id = setInterval(syncOnce, intervalMs);
  window.addEventListener('online', syncOnce);

  return () => {
    stopped = true;
    clearInterval(id);
    window.removeEventListener('online', syncOnce);
  };
}
