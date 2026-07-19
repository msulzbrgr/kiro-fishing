import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { FishingSession } from '../types';

export const LEGACY_STORAGE_KEY = 'kiro_fishing_sessions';
const DB_NAME = 'kiro-fishing';
const DB_VERSION = 2;

export interface PhotoRecord {
  id: string;
  sessionId: string;
  catchId: string;
  blob: Blob;
  mimeType: string;
  createdAt: string;
}

export interface ProfileRecord {
  id: string;
  nickname: string;
  photoBlob?: Blob;
  photoMimeType?: string;
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
  profiles: {
    key: string;
    value: ProfileRecord;
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
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('sessions', { keyPath: 'id' });
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('by-session', 'sessionId');
          photoStore.createIndex('by-catch', 'catchId');
          db.createObjectStore('meta', { keyPath: 'key' });
        }

        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('profiles')) {
            db.createObjectStore('profiles', { keyPath: 'id' });
          }
        }
      },
    });
  }

  return dbPromise;
}

export async function clearIndexedDb(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['sessions', 'photos', 'meta', 'profiles'], 'readwrite');
  await Promise.all([
    tx.objectStore('sessions').clear(),
    tx.objectStore('photos').clear(),
    tx.objectStore('meta').clear(),
    tx.objectStore('profiles').clear(),
  ]);
  await tx.done;
}
