import type { FishingSession } from '../types';
import { CURRENT_SESSION_SCHEMA_VERSION } from '../types';
import { migrateSession } from './sessionVersioning';

const STORAGE_KEY = 'kiro_fishing_sessions';
const EXPORT_FORMAT_VERSION = '1.0';

export function loadSessions(): FishingSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const raw: unknown = JSON.parse(data);
    if (!Array.isArray(raw)) return [];
    const result: FishingSession[] = [];
    for (const entry of raw) {
      try {
        result.push(migrateSession(entry));
      } catch {
        console.warn('loadSessions: skipping invalid session entry', entry);
      }
    }
    return result;
  } catch {
    return [];
  }
}

export function saveSessions(sessions: FishingSession[]): void {
  const versioned = sessions.map((s) => ({
    ...s,
    schemaVersion: CURRENT_SESSION_SCHEMA_VERSION,
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned));
  } catch (err) {
    // Most common cause: browser storage quota exceeded (e.g. large base64 photos).
    console.error('saveSessions: failed to persist sessions', err);
    throw err;
  }
}

export function saveSession(session: FishingSession): void {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  saveSessions(sessions);
}

export function deleteSession(id: string): void {
  const sessions = loadSessions().filter((s) => s.id !== id);
  saveSessions(sessions);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Export / Import ────────────────────────────────────────────────────────

export interface ExportPayload {
  version: string;
  app: string;
  exportedAt: string;
  sessions: FishingSession[];
}

/**
 * Exports all sessions as a downloadable JSON file.
 * Compatible with Chromium, Firefox, Vivaldi, Brave, and Safari (modern versions)
 * by using a dynamically created <a> with a Blob object URL.
 */
export function exportData(): void {
  const sessions = loadSessions();
  const payload: ExportPayload = {
    version: EXPORT_FORMAT_VERSION,
    app: 'kiro-fishing',
    exportedAt: new Date().toISOString(),
    sessions,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `kiro-fishing-backup-${dateStr}.json`;

  // Append to body for Firefox compatibility
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up the object URL after a short delay to allow the download to start
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Imports sessions from a JSON file exported by exportData().
 * Validates the payload before overwriting localStorage.
 */
export function importData(
  file: File,
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          resolve({ success: false, error: 'storage.read_failed' });
          return;
        }

        const payload = JSON.parse(text) as Partial<ExportPayload>;

        if (
          payload.app !== 'kiro-fishing' ||
          !Array.isArray(payload.sessions)
        ) {
          resolve({ success: false, error: 'storage.invalid_format' });
          return;
        }

        const migratedSessions: FishingSession[] = [];
        for (const entry of payload.sessions) {
          try {
            migratedSessions.push(migrateSession(entry));
          } catch {
            console.warn('importData: skipping invalid session entry', entry);
          }
        }
        saveSessions(migratedSessions);
        resolve({ success: true, count: migratedSessions.length });
      } catch {
        resolve({ success: false, error: 'storage.parse_failed' });
      }
    };

    reader.onerror = () => resolve({ success: false, error: 'storage.read_failed' });
    reader.readAsText(file, 'utf-8');
  });
}
