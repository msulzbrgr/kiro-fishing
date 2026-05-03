import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { FishingSession } from '../types';

export const LEGACY_STORAGE_KEY = 'kiro_fishing_sessions';
const DB_NAME = 'kiro-fishing';
const DB_VERSION = 1;

export interface PhotoRecord {
  id: string;
  sessionId: string;
  catchId: string;
  blob: Blob;
  mimeType: string;
  createdAt: string;
}

export interface MetaRecord {
  key: string;
  value: unknown;
}

export interface KiroFishingDbSchema extends DBSchema {
  sessions: {
    key: string;
    value: FishingSession;
  };
  photos: {
    key: string;
    value: PhotoRecord;
    indexes: {
      'by-session': string;
      'by-catch': string;
    };
  };
  meta: {
    key: string;
    value: MetaRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<KiroFishingDbSchema>> | null = null;

export function getDb(): Promise<IDBPDatabase<KiroFishingDbSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<KiroFishingDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('by-session', 'sessionId');
          photoStore.createIndex('by-catch', 'catchId');
        }

        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }

  return dbPromise;
}

export async function clearIndexedDb(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['sessions', 'photos', 'meta'], 'readwrite');
  await Promise.all([
    tx.objectStore('sessions').clear(),
    tx.objectStore('photos').clear(),
    tx.objectStore('meta').clear(),
  ]);
  await tx.done;
}
