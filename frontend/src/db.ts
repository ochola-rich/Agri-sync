import type { DBSchema, IDBPDatabase } from 'idb';
import type { Collection } from './types';

/**
 * Simple IndexedDB wrapper for collections used by the app.
 * Exposes: initDB, addCollection (upsert), getAllCollections, getCollectionsByStatus, updateCollectionStatus, estimateStorage
 */

export type CollectionRecord = {
  id: string;
  farmerId: string;
  collectorId?: string;
  cropType: string;
  weightKg: number;
  pricePerKg: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  status: 'pending' | 'synced' | 'error';
  // conflict metadata
  writerId?: string;
  lastWriterAt?: string;
};

const DB_NAME = 'agrisync';
const DB_VERSION = 1;
const STORE = 'collections';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('farmerId', 'farmerId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function initDB() {
  await openDB();
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => Promise<T> | T): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    Promise.resolve()
      .then(() => fn(store))
      .then((v) => {
        tx.oncomplete = () => resolve(v);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
      .catch((err) => {
        try { tx.abort(); } catch {}
        reject(err);
      });
  });
}

export async function addCollection(col: Partial<CollectionRecord>) {
  const now = new Date().toISOString();
  const record: CollectionRecord = {
    id: col.id || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    farmerId: col.farmerId || '',
    collectorId: col.collectorId || '',
    cropType: col.cropType || '',
    weightKg: Number(col.weightKg) || 0,
    pricePerKg: Number(col.pricePerKg) || 0,
    createdAt: col.createdAt || now,
    updatedAt: col.updatedAt || now,
    version: Number(col.version) || 1,
    status: (col.status as any) || 'pending',
    writerId: col.writerId || 'local',
    lastWriterAt: col.lastWriterAt || now,
  };
  await withStore('readwrite', async (store) => {
    store.put(record);
  });
  return record;
}

export async function getAllCollections(): Promise<CollectionRecord[]> {
  return withStore('readonly', (store) =>
    new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as CollectionRecord[]);
      req.onerror = () => reject(req.error);
    })
  );
}

export async function getCollectionsByStatus(status: string): Promise<CollectionRecord[]> {
  return withStore('readonly', (store) =>
    new Promise((resolve, reject) => {
      const idx = store.index('status');
      const req = idx.getAll(IDBKeyRange.only(status));
      req.onsuccess = () => resolve(req.result as CollectionRecord[]);
      req.onerror = () => reject(req.error);
    })
  );
}

export async function updateCollectionStatus(id: string, status: CollectionRecord['status']) {
  return withStore('readwrite', (store) =>
    new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const rec = getReq.result as CollectionRecord | undefined;
        if (!rec) {
          resolve(null);
          return;
        }
        rec.status = status;
        rec.updatedAt = new Date().toISOString();
        rec.version = (rec.version || 1) + 1;
        rec.lastWriterAt = rec.updatedAt;
        store.put(rec);
        resolve(rec);
      };
      getReq.onerror = () => reject(getReq.error);
    })
  );
}

export async function estimateStorage(): Promise<{ quota?: number; usage?: number }> {
  if ((navigator as any).storage && typeof (navigator as any).storage.estimate === 'function') {
    try {
      // @ts-ignore
      const est = await (navigator as any).storage.estimate();
      return { quota: est.quota, usage: est.usage };
    } catch {
      return {};
    }
  }
  return {};
}
