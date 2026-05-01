---
title: 'Session Schema Versioning'
type: 'feature'
created: '2026-05-01'
status: 'in-progress'
baseline_commit: '8fc1bf5805756e2d186762bca6677909de62736c'
context:
  - '_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `FishingSession` objects are stored in localStorage without any schema version tag. When the session shape evolves, there is no safe way to read back old data — a shape mismatch causes silent data loss or runtime errors.

**Approach:** Add a `schemaVersion` discriminant to `FishingSession`, define V0 (legacy/unversioned) and V1 (current shape + version tag) typed schemas, create a migration pipeline that upgrades any raw stored value to the latest version, and wire it into every load/import path so the rest of the app always receives a fully-typed current session.

## Boundaries & Constraints

**Always:**
- `schemaVersion` is a required `number` field on `FishingSession` (V1 = 1).
- Legacy data (no `schemaVersion` field) is treated as V0 and migrated to V1 on first read.
- Every `loadSessions()` call migrates all entries before returning them.
- `saveSessions()` always persists sessions at the current schema version.
- `importData()` runs the same migration pipeline before saving.
- Migration is purely additive — no data is lost; missing fields receive safe defaults.
- All new types and migration logic live in `src/utils/sessionVersioning.ts`.
- `src/types/index.ts` remains the single source of truth for `FishingSession` (the latest version).

**Ask First:**
- If a future migration requires dropping a previously required field (breaking change), halt and confirm with the human before implementing.

**Never:**
- Do not add any UI changes — this is a pure data-layer concern.
- Do not change the `EXPORT_FORMAT_VERSION` string in `storage.ts`.
- Do not add a unit-test framework — the project has Playwright E2E only.
- Do not rename the localStorage key `kiro_fishing_sessions`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Fresh session created | App creates new session with no `schemaVersion` | `saveSessions` stamps `schemaVersion: 1` before writing | N/A |
| Legacy V0 data in storage | localStorage has sessions without `schemaVersion` | `loadSessions` migrates each to V1 and returns typed `FishingSession[]` | On parse error: skip the entry, log to console, return remaining sessions |
| V1 data in storage | localStorage has sessions with `schemaVersion: 1` | Returned unchanged (no-op migration) | N/A |
| Unknown/future version | `schemaVersion` is higher than `CURRENT_SESSION_SCHEMA_VERSION` | Log a warning, return as-is (forward-compat best-effort) | N/A |
| Import file with V0 sessions | `importData` receives JSON with unversioned sessions | Sessions migrated to V1 before saving | Existing `invalid_format` / `parse_failed` error paths unchanged |
| `null` / non-object entry | A storage entry is not a plain object | Skip and exclude that entry from the result | Console warning; rest of sessions unaffected |

</frozen-after-approval>

## Code Map

- `src/types/index.ts` -- Domain types; `FishingSession` gains required `schemaVersion: number` field; export `CURRENT_SESSION_SCHEMA_VERSION`
- `src/utils/sessionVersioning.ts` -- NEW: `FishingSessionV0` (legacy shape), `FishingSessionV1` (current + version), individual migration fns, `migrateSession(raw: unknown): FishingSession` pipeline
- `src/utils/storage.ts` -- `loadSessions` runs `migrateSession` on each raw entry; `saveSessions` ensures each session carries current `schemaVersion`; `importData` migrates before saving

## Tasks & Acceptance

**Execution:**
- [ ] `src/types/index.ts` -- add `schemaVersion: number` to `FishingSession`; add `export const CURRENT_SESSION_SCHEMA_VERSION = 1` -- establishes the versioning contract at the type layer
- [ ] `src/utils/sessionVersioning.ts` -- create new file with: `FishingSessionV0` (all current fields minus `schemaVersion`), `FishingSessionV1 = FishingSessionV0 & { schemaVersion: 1 }`, type guard `isFishingSessionV0(raw)`, migrator `migrateV0toV1(v0: FishingSessionV0): FishingSessionV1`, and top-level `migrateSession(raw: unknown): FishingSession` that detects version and runs the appropriate chain -- implements full migration pipeline
- [ ] `src/utils/storage.ts` -- update `loadSessions` to parse each array entry through `migrateSession`; update `saveSessions` to spread `schemaVersion: CURRENT_SESSION_SCHEMA_VERSION` onto every session before stringifying; update `importData` to call `migrateSession` on each session in the import payload before saving -- wires migration into all data ingestion paths
- [ ] Trace all sites in `src/` that construct a `FishingSession` literal (e.g. `NewSessionForm.tsx`, any test fixture) -- add `schemaVersion: CURRENT_SESSION_SCHEMA_VERSION` to each literal so TypeScript strict mode is satisfied

**Acceptance Criteria:**
- Given an empty localStorage, when a new session is created and saved, then `localStorage.getItem('kiro_fishing_sessions')` contains entries where every object has `schemaVersion: 1`.
- Given localStorage contains sessions without a `schemaVersion` field, when `loadSessions()` is called, then all returned sessions have `schemaVersion: 1` and all original data fields are preserved.
- Given localStorage contains a mix of V0 and V1 sessions, when `loadSessions()` is called, then all returned sessions are V1 with no data loss.
- Given an export file containing unversioned (V0) sessions, when `importData()` processes it, then all sessions are migrated to V1 before being saved.
- Given `npm run build`, when executed, then TypeScript compilation succeeds with zero errors.
- Given `npm run lint`, when executed, then ESLint reports zero new errors.

## Design Notes

**V0 → V1 migration** is a structural no-op: add `schemaVersion: 1`, copy all other fields. Future migrations (V1 → V2) follow the same single-responsibility pattern — one function per hop, chained in `migrateSession`.

**Type guard pattern** (example skeleton — do not copy verbatim, derive from actual types):
```ts
function isV0(raw: unknown): raw is FishingSessionV0 {
  return isPlainObject(raw) && typeof (raw as Record<string,unknown>).id === 'string'
    && !('schemaVersion' in raw);
}
```

**Forward compat:** A session with `schemaVersion > CURRENT_SESSION_SCHEMA_VERSION` is returned as-is with a `console.warn`. This prevents data loss if a newer app version writes data that an older one reads.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0, zero TypeScript errors
- `npm run lint` -- expected: exits 0, zero new ESLint errors
