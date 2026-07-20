import JSZip from 'jszip';
import type { Catch, FishingSession, Profile } from '../types';
import { CURRENT_SESSION_SCHEMA_VERSION } from '../types';
import { getDb, LEGACY_STORAGE_KEY, type PhotoRecord, type ProfileRecord } from './indexedDb';
import { migrateSession } from './sessionVersioning';

const EXPORT_FORMAT_VERSION_V2 = '2.0';
const LEGACY_MIGRATION_META_KEY = 'legacy_localstorage_migration_v1_done';
let idFallbackCounter = 0;
let persistentStorageRequest: Promise<boolean> | null = null;

export interface ExportPayloadV1 {
  version: string;
  app: string;
  exportedAt: string;
  sessions: FishingSession[];
}

interface ExportPhotoManifestEntry {
  id: string;
  fileName: string;
  mimeType: string;
  sessionId: string;
  catchId: string;
}

interface ExportProfileManifestEntry {
  id: string;
  nickname: string;
  photoFileName?: string;
  photoMimeType?: string;
  createdAt: string;
}

interface ExportPayloadV2 {
  version: string;
  app: string;
  exportedAt: string;
  sessions: FishingSession[];
  photos: ExportPhotoManifestEntry[];
  profiles?: ExportProfileManifestEntry[];
}

interface SaveSessionResult {
  storedSession: FishingSession;
  newPhotoRecords: PhotoRecord[];
  obsoletePhotoIds: string[];
}

function isDataUrl(value: string): boolean {
  return value.startsWith('data:');
}

function getMimeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match?.[1] ?? 'application/octet-stream';
}

function dataUrlToBlob(dataUrl: string): Blob {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex < 0) {
    throw new Error('Invalid data URL');
  }

  const mimeType = getMimeFromDataUrl(dataUrl);
  const base64 = dataUrl.slice(commaIndex + 1);
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i += 1) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }

  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

function stripInlinePhotos(session: FishingSession): FishingSession {
  return {
    ...session,
    schemaVersion: CURRENT_SESSION_SCHEMA_VERSION,
    catches: session.catches.map((catchEntry) => ({
      ...catchEntry,
      photos: undefined,
    })),
  };
}

function cloneSessionForUi(session: FishingSession): FishingSession {
  return {
    ...session,
    catches: session.catches.map((catchEntry) => ({ ...catchEntry })),
  };
}

function sortSessions(sessions: FishingSession[]): FishingSession[] {
  return [...sessions].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    if (a.startTime !== b.startTime) return b.startTime.localeCompare(a.startTime);
    return b.id.localeCompare(a.id);
  });
}

async function hydrateSessionPhotos(session: FishingSession): Promise<FishingSession> {
  const db = await getDb();
  const hydrated = cloneSessionForUi(session);

  for (const catchEntry of hydrated.catches) {
    if (!catchEntry.photoIds || catchEntry.photoIds.length === 0) {
      catchEntry.photos = undefined;
      continue;
    }

    const photoRecords = await Promise.all(
      catchEntry.photoIds.map((id) => db.get('photos', id)),
    );

    const validPairs = photoRecords
      .map((record, i) => ({ record, photoId: catchEntry.photoIds![i] }))
      .filter((pair): pair is { record: PhotoRecord; photoId: string } => Boolean(pair.record));

    catchEntry.photoIds = validPairs.map((pair) => pair.photoId);
    catchEntry.photos = validPairs.map((pair) => URL.createObjectURL(pair.record.blob));
  }

  return hydrated;
}

function collectPhotoIds(session: FishingSession): Set<string> {
  const ids = new Set<string>();
  for (const catchEntry of session.catches) {
    for (const photoId of catchEntry.photoIds ?? []) {
      ids.add(photoId);
    }
  }
  return ids;
}

async function buildStoredSession(
  next: FishingSession,
  previous: FishingSession | undefined,
): Promise<SaveSessionResult> {
  const oldPhotoIds = previous ? collectPhotoIds(previous) : new Set<string>();
  const nextPhotoIds = new Set<string>();
  const newPhotoRecords: PhotoRecord[] = [];

  const catches: Catch[] = [];

  for (const catchEntry of next.catches) {
    const currentPhotoIds = [...(catchEntry.photoIds ?? [])];
    const inputPhotos = catchEntry.photos ?? [];

    if (inputPhotos.length > 0) {
      for (const photo of inputPhotos) {
        if (!isDataUrl(photo)) continue;
        const id = generateId();
        currentPhotoIds.push(id);
        newPhotoRecords.push({
          id,
          sessionId: next.id,
          catchId: catchEntry.id,
          blob: dataUrlToBlob(photo),
          mimeType: getMimeFromDataUrl(photo),
          createdAt: new Date().toISOString(),
        });
      }
    }

    for (const id of currentPhotoIds) {
      nextPhotoIds.add(id);
    }

    catches.push({
      ...catchEntry,
      photoIds: currentPhotoIds.length > 0 ? currentPhotoIds : undefined,
      photos: undefined,
    });
  }

  const obsoletePhotoIds = [...oldPhotoIds].filter((id) => !nextPhotoIds.has(id));

  return {
    storedSession: {
      ...next,
      schemaVersion: CURRENT_SESSION_SCHEMA_VERSION,
      catches,
    },
    newPhotoRecords,
    obsoletePhotoIds,
  };
}

async function setMetaValue(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put('meta', { key, value });
}

async function getMetaValue<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  const value = await db.get('meta', key);
  return value?.value as T | undefined;
}

async function ensureLegacyMigration(): Promise<void> {
  const migrationDone = await getMetaValue<boolean>(LEGACY_MIGRATION_META_KEY);
  if (migrationDone) return;

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) {
    await setMetaValue(LEGACY_MIGRATION_META_KEY, true);
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(legacy);
  } catch {
    await setMetaValue(LEGACY_MIGRATION_META_KEY, true);
    return;
  }

  if (!Array.isArray(parsed)) {
    await setMetaValue(LEGACY_MIGRATION_META_KEY, true);
    return;
  }

  const migratedSessions: FishingSession[] = [];
  for (const raw of parsed) {
    try {
      migratedSessions.push(migrateSession(raw));
    } catch {
      console.warn('ensureLegacyMigration: skipping invalid legacy session entry', raw);
    }
  }

  await saveSessions(migratedSessions);
  await setMetaValue(LEGACY_MIGRATION_META_KEY, true);
}

async function ensureBestEffortPersistentStorage(): Promise<boolean> {
  return runPersistentStorageRequest();
}

/**
 * When force=false, reuse the last successful/failed result while a request is still relevant.
 * When force=true, retry after a previous false result, but still wait for any in-flight request first.
 */
async function runPersistentStorageRequest(force = false): Promise<boolean> {
  if (!('storage' in navigator) || !navigator.storage?.persist) {
    return false;
  }

  if (persistentStorageRequest) {
    const pending = await persistentStorageRequest;
    if (!force) {
      return pending;
    }
    if (pending === true) {
      return pending;
    }
  }

  persistentStorageRequest = (async () => {
    try {
      const alreadyPersistent = navigator.storage.persisted
        ? await navigator.storage.persisted()
        : false;
      if (alreadyPersistent) {
        return true;
      }

      return await navigator.storage.persist();
    } catch {
      return false;
    }
  })();

  const result = await persistentStorageRequest;
  if (!result) {
    persistentStorageRequest = null;
  }
  return result;
}

async function replaceAllSessions(sessions: FishingSession[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['sessions', 'photos'], 'readwrite');
  const sessionStore = tx.objectStore('sessions');
  const photoStore = tx.objectStore('photos');

  await Promise.all([sessionStore.clear(), photoStore.clear()]);

  for (const rawSession of sessions) {
    const session = migrateSession(rawSession);
    const { storedSession, newPhotoRecords } = await buildStoredSession(session, undefined);
    await sessionStore.put(stripInlinePhotos(storedSession));
    for (const photo of newPhotoRecords) {
      await photoStore.put(photo);
    }
  }

  await tx.done;
}

export async function loadSessions(): Promise<FishingSession[]> {
  await ensureLegacyMigration();
  const db = await getDb();
  const sessions = await db.getAll('sessions');
  const hydrated = await Promise.all(sessions.map((session) => hydrateSessionPhotos(migrateSession(session))));
  return sortSessions(hydrated);
}

export async function saveSessions(sessions: FishingSession[]): Promise<void> {
  await ensureBestEffortPersistentStorage();
  await replaceAllSessions(sessions);
}

export async function saveSession(session: FishingSession): Promise<FishingSession> {
  await ensureLegacyMigration();
  await ensureBestEffortPersistentStorage();
  const db = await getDb();
  const existing = await db.get('sessions', session.id);
  const previous = existing ? migrateSession(existing) : undefined;

  const { storedSession, newPhotoRecords, obsoletePhotoIds } = await buildStoredSession(session, previous);

  const tx = db.transaction(['sessions', 'photos'], 'readwrite');
  await tx.objectStore('sessions').put(stripInlinePhotos(storedSession));

  for (const photoRecord of newPhotoRecords) {
    await tx.objectStore('photos').put(photoRecord);
  }

  for (const photoId of obsoletePhotoIds) {
    await tx.objectStore('photos').delete(photoId);
  }

  await tx.done;

  return hydrateSessionPhotos(storedSession);
}

export async function deleteSession(id: string): Promise<void> {
  await ensureLegacyMigration();
  const db = await getDb();
  const existing = await db.get('sessions', id);
  const tx = db.transaction(['sessions', 'photos'], 'readwrite');

  if (existing) {
    const session = migrateSession(existing);
    for (const photoId of collectPhotoIds(session)) {
      await tx.objectStore('photos').delete(photoId);
    }
  }

  await tx.objectStore('sessions').delete(id);
  await tx.done;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    return `${Date.now()}-${random}`;
  }

  idFallbackCounter += 1;
  return `${Date.now()}-${idFallbackCounter}`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportData(): Promise<void> {
  await ensureLegacyMigration();
  const db = await getDb();
  const [sessions, photos, profileRecords] = await Promise.all([
    db.getAll('sessions'),
    db.getAll('photos'),
    db.getAll('profiles'),
  ]);

  const payload: ExportPayloadV2 = {
    version: EXPORT_FORMAT_VERSION_V2,
    app: 'kiro-fishing',
    exportedAt: new Date().toISOString(),
    sessions: sessions.map((session) => stripInlinePhotos(migrateSession(session))),
    photos: photos.map((photo) => ({
      id: photo.id,
      fileName: `photos/${photo.id}`,
      mimeType: photo.mimeType,
      sessionId: photo.sessionId,
      catchId: photo.catchId,
    })),
    profiles: profileRecords.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      photoFileName: p.photoBlob ? `profile-photos/${p.id}` : undefined,
      photoMimeType: p.photoMimeType,
      createdAt: p.createdAt,
    })),
  };

  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(payload, null, 2));
  for (const photo of photos) {
    zip.file(`photos/${photo.id}`, await photo.blob.arrayBuffer());
  }
  for (const profile of profileRecords) {
    if (profile.photoBlob) {
      zip.file(`profile-photos/${profile.id}`, await profile.photoBlob.arrayBuffer());
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const dateStr = new Date().toISOString().split('T')[0];
  triggerDownload(content, `kiro-fishing-backup-${dateStr}.zip`);
}

export interface ExportPreview {
  sessionCount: number;
  photoCount: number;
  usage?: number;
  quota?: number;
  percentUsed?: number;
}

export async function getExportPreview(): Promise<ExportPreview> {
  await ensureLegacyMigration();
  const db = await getDb();
  const [sessions, photos, health] = await Promise.all([
    db.count('sessions'),
    db.count('photos'),
    getStorageHealth(),
  ]);

  return {
    sessionCount: sessions,
    photoCount: photos,
    usage: health.supported ? health.usage : undefined,
    quota: health.supported ? health.quota : undefined,
    percentUsed: health.supported ? health.percentUsed : undefined,
  };
}

async function importV1Json(payload: Partial<ExportPayloadV1>): Promise<number> {
  if (payload.app !== 'kiro-fishing' || !Array.isArray(payload.sessions)) {
    throw new Error('storage.invalid_format');
  }

  const sessions: FishingSession[] = [];
  for (const entry of payload.sessions) {
    try {
      sessions.push(migrateSession(entry));
    } catch {
      console.warn('importData: skipping invalid V1 session entry', entry);
    }
  }

  await saveSessions(sessions);
  await setMetaValue(LEGACY_MIGRATION_META_KEY, true);
  return sessions.length;
}

async function importV2Zip(file: File): Promise<number> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('storage.invalid_format');
  }

  const manifestText = await manifestFile.async('string');
  const payload = JSON.parse(manifestText) as Partial<ExportPayloadV2>;
  if (
    payload.app !== 'kiro-fishing'
    || payload.version !== EXPORT_FORMAT_VERSION_V2
    || !Array.isArray(payload.sessions)
    || !Array.isArray(payload.photos)
  ) {
    throw new Error('storage.invalid_format');
  }

  const sessions: FishingSession[] = [];
  for (const entry of payload.sessions) {
    try {
      sessions.push(migrateSession(entry));
    } catch {
      console.warn('importData: skipping invalid V2 session entry', entry);
    }
  }

  // Pre-fetch all photo blobs from the ZIP before opening the IDB transaction.
  // Calling zipFile.async('blob') inside a transaction would cause it to
  // auto-commit (IDB transactions commit when no IDB request is pending and
  // the engine yields to the event loop via non-IDB async work).
  interface ResolvedPhoto {
    entry: ExportPhotoManifestEntry;
    blob: Blob;
    mimeType: string;
  }
  const resolvedPhotos: ResolvedPhoto[] = [];
  for (const photoEntry of payload.photos) {
    const zipFile = zip.file(photoEntry.fileName);
    if (!zipFile) continue;

    const blob = await zipFile.async('blob');
    const manifestMimeType = photoEntry.mimeType?.trim();
    const mimeType = manifestMimeType || blob.type || 'application/octet-stream';
    if (!manifestMimeType && !blob.type) {
      console.warn('importData: missing photo mimeType, falling back to application/octet-stream', photoEntry.id);
    }
    resolvedPhotos.push({ entry: photoEntry, blob, mimeType });
  }

  // Pre-fetch profile photo blobs before the IDB transaction for the same reason.
  interface ResolvedProfilePhoto {
    id: string;
    blob: Blob;
    mimeType: string;
  }
  const resolvedProfilePhotos: ResolvedProfilePhoto[] = [];
  if (Array.isArray(payload.profiles)) {
    for (const profileEntry of payload.profiles) {
      if (!profileEntry.photoFileName) continue;
      const zipFile = zip.file(profileEntry.photoFileName);
      if (!zipFile) continue;
      const blob = await zipFile.async('blob');
      const mimeType = profileEntry.photoMimeType?.trim() || blob.type || 'application/octet-stream';
      resolvedProfilePhotos.push({ id: profileEntry.id, blob, mimeType });
    }
  }

  const db = await getDb();
  const tx = db.transaction(['sessions', 'photos', 'profiles'], 'readwrite');
  const clearOps: Promise<void>[] = [
    tx.objectStore('sessions').clear(),
    tx.objectStore('photos').clear(),
  ];
  // Only replace profiles when the backup explicitly includes a profiles array.
  // Old backups without profiles leave existing profiles intact.
  if (Array.isArray(payload.profiles)) {
    clearOps.push(tx.objectStore('profiles').clear());
  }
  await Promise.all(clearOps);

  for (const session of sessions) {
    await tx.objectStore('sessions').put(stripInlinePhotos(session));
  }

  for (const { entry: photoEntry, blob, mimeType } of resolvedPhotos) {
    await tx.objectStore('photos').put({
      id: photoEntry.id,
      sessionId: photoEntry.sessionId,
      catchId: photoEntry.catchId,
      mimeType,
      blob,
      createdAt: new Date().toISOString(),
    });
  }

  if (Array.isArray(payload.profiles)) {
    const profilePhotoMap = new Map(resolvedProfilePhotos.map((p) => [p.id, p]));
    for (const profileEntry of payload.profiles) {
      const photoResolved = profilePhotoMap.get(profileEntry.id);
      await tx.objectStore('profiles').put({
        id: profileEntry.id,
        nickname: profileEntry.nickname,
        photoBlob: photoResolved?.blob,
        photoMimeType: photoResolved?.mimeType,
        createdAt: profileEntry.createdAt ?? new Date().toISOString(),
      });
    }
  }

  await tx.done;
  await setMetaValue(LEGACY_MIGRATION_META_KEY, true);
  return sessions.length;
}

export async function importData(
  file: File,
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.zip') || file.type === 'application/zip') {
      const count = await importV2Zip(file);
      return { success: true, count };
    }

    const text = await file.text();
    const payload = JSON.parse(text) as Partial<ExportPayloadV1>;

    if (payload.version === EXPORT_FORMAT_VERSION_V2) {
      return { success: false, error: 'storage.v2_requires_zip' };
    }

    const count = await importV1Json(payload);
    return { success: true, count };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('storage.')) {
      return { success: false, error: err.message };
    }

    return { success: false, error: 'storage.parse_failed' };
  }
}

export interface StorageHealth {
  supported: boolean;
  usage?: number;
  quota?: number;
  percentUsed?: number;
  persistent?: boolean;
}

export async function getStorageHealth(): Promise<StorageHealth> {
  if (!('storage' in navigator) || !navigator.storage?.estimate) {
    return { supported: false };
  }

  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage ?? 0;
  const quota = estimate.quota ?? 0;
  const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : undefined;
  const persistent = navigator.storage.persisted ? await navigator.storage.persisted() : undefined;

  return {
    supported: true,
    usage,
    quota,
    percentUsed,
    persistent,
  };
}

export async function requestPersistentStorage(): Promise<boolean> {
  return runPersistentStorageRequest(true);
}

// ===== Profile CRUD =====

function hydrateProfile(record: ProfileRecord): Profile {
  const profile: Profile = {
    id: record.id,
    nickname: record.nickname,
  };
  if (record.photoBlob) {
    profile.photoId = record.id;
    profile.photo = URL.createObjectURL(record.photoBlob);
  }
  return profile;
}

export async function loadProfiles(): Promise<Profile[]> {
  const db = await getDb();
  const records = await db.getAll('profiles');
  return records.map(hydrateProfile);
}

export async function saveProfile(profile: Profile, photoDataUrl?: string | null): Promise<Profile> {
  await ensureBestEffortPersistentStorage();
  const db = await getDb();
  const existing = await db.get('profiles', profile.id);

  let photoBlob: Blob | undefined = existing?.photoBlob;
  let photoMimeType: string | undefined = existing?.photoMimeType;

  if (photoDataUrl) {
    photoBlob = dataUrlToBlob(photoDataUrl);
    photoMimeType = getMimeFromDataUrl(photoDataUrl);
  } else if (photoDataUrl === null) {
    photoBlob = undefined;
    photoMimeType = undefined;
  }

  const record: ProfileRecord = {
    id: profile.id,
    nickname: profile.nickname,
    photoBlob,
    photoMimeType,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  await db.put('profiles', record);
  return hydrateProfile(record);
}

export async function deleteProfile(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('profiles', id);
}
