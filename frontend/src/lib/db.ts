import Dexie from 'dexie';

export interface OutgoingOp {
  id: string; // client-generated uuid
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  url: string;
  body?: any;
  attempts: number;
  lastError?: string;
  createdAt: number;
  status: 'pending' | 'processing' | 'failed' | 'done';
}

export interface LocalCollection {
  id: string;
  data: any;
  version: number; // local copy of server version
  updatedAt: number;
}

class AppDB extends Dexie {
  outgoing!: Dexie.Table<OutgoingOp, string>;
  collections!: Dexie.Table<LocalCollection, string>;

  constructor() {
    super('AgriSyncDB');
    (this as unknown as Dexie).version(1).stores({
      outgoing: 'id, status, createdAt',
      collections: 'id, updatedAt',
    });
  }
}

export const db = new AppDB();