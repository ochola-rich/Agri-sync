export type Role = 'farmer' | 'collector' | null;

// Based on server-side Go structs
export interface Farmer {
  id: string; // UUID
  name: string;
  phone: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  version: number;
  // passwordHash is omitted on the client
}

export interface Collector {
  id: string; // UUID
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  // passwordHash is omitted on the client
}

export type SyncStatus = 'pending' | 'synced' | 'error';

export interface Collection {
  id: string; // UUID generated on client
  farmerId: string;
  collectorId: string;
  cropType: string;
  weightKg: number;
  pricePerKg: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  // Frontend-only fields for local-first architecture
  status: SyncStatus;
}

export interface MarketPrice {
  current: number;
  color: string;
}