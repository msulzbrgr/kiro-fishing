import type { FishingSession } from '../types';
import { CURRENT_SESSION_SCHEMA_VERSION } from '../types';

/**
 * V0 — the legacy session shape that predates schema versioning.
 * Identical to FishingSession except it has no `schemaVersion` field.
 */
export type FishingSessionV0 = Omit<FishingSession, 'schemaVersion'>;

/**
 * V1 — current version. Adds the `schemaVersion: 1` discriminant.
 */
export type FishingSessionV1 = FishingSessionV0 & { schemaVersion: 1 };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFishingSessionV0(raw: unknown): raw is FishingSessionV0 {
  return (
    isPlainObject(raw) &&
    typeof (raw as Record<string, unknown>).id === 'string' &&
    !('schemaVersion' in raw)
  );
}

function migrateV0toV1(v0: FishingSessionV0): FishingSessionV1 {
  return { ...v0, schemaVersion: 1 };
}

/**
 * Accepts any raw value from storage and returns a fully-typed FishingSession
 * at the current schema version.
 *
 * - Missing schemaVersion → treated as V0, migrated to V1.
 * - schemaVersion === CURRENT_SESSION_SCHEMA_VERSION → returned as-is.
 * - schemaVersion > CURRENT_SESSION_SCHEMA_VERSION → returned as-is with a warning
 *   (forward-compat best-effort; prevents data loss with newer app versions).
 * - Non-object values → throws so the caller can skip the entry.
 */
export function migrateSession(raw: unknown): FishingSession {
  if (!isPlainObject(raw)) {
    console.warn('migrateSession: skipping non-object entry', raw);
    throw new Error('Invalid session entry: not a plain object');
  }

  if (isFishingSessionV0(raw)) {
    return migrateV0toV1(raw);
  }

  const schemaVersion = raw.schemaVersion;

  if (typeof schemaVersion !== 'number') {
    // Malformed schemaVersion — treat defensively as V0
    console.warn('migrateSession: non-numeric schemaVersion, treating as V0', raw);
    return migrateV0toV1(raw as FishingSessionV0);
  }

  if (schemaVersion > CURRENT_SESSION_SCHEMA_VERSION) {
    console.warn(
      `migrateSession: future schema version ${schemaVersion} encountered, returning as-is`,
    );
    return raw as FishingSession;
  }

  // schemaVersion === CURRENT_SESSION_SCHEMA_VERSION (or a known prior version
  // that future migration hops would handle — add migrateV1toV2 etc. here)
  return raw as FishingSession;
}
