# Epics and Stories — Local Fish Species Recognition

**Date:** 2026-05-19  
**Scope:** Add local AI fish species recognition in catch-photo workflow without cloud processing.

## Epic E5 — Local Fish Species Recognition

**Goal:** Enable on-device species recognition from uploaded catch photos while preserving manual entry fallback.

### Story E5-S1 — Feasibility Gate and Model Profile Lock (Highest Priority)

**Description:** Validate candidate local runtimes/models and lock an approved deployable profile before coding feature logic.

**Acceptance Criteria:**
- Device-tier benchmark targets are defined (low/mid/high).
- Candidate runtimes are evaluated and compared with evidence.
- A selected model profile is approved and documented (version, memory budget, expected latency).
- Fallback policy for unsupported environments is documented.
- Story is marked complete only with attached benchmark artifact.

### Story E5-S2 — Local Fish Recognition Service Pipeline

**Description:** Build the local processing path (validate image, preprocess, infer, rank top 3 species).

**Acceptance Criteria:**
- Recognition is triggered from photo input and returns top 3 candidates with confidence.
- No network calls occur during recognition pipeline.
- Unsupported/malformed inputs return user-safe error states.
- Service exposes diagnostic fields needed by UI and persistence.

### Story E5-S3 — Catch Log UX Integration and Manual Override

**Description:** Integrate recognition states into Catch Log and prefill species while keeping full user control.

**Acceptance Criteria:**
- Species field auto-prefills with top prediction when available.
- User can select alternate suggestion or manually override.
- UI states are implemented: processing, success, low confidence, failed.
- Catch save is never blocked if recognition fails; manual path always works.

### Story E5-S4 — Persistence and Schema Extension

**Description:** Persist prediction metadata with catches while preserving backwards compatibility.

**Acceptance Criteria:**
- Catch model stores selected source (manual/AI), candidate predictions, confidence, model version, timestamp.
- Existing sessions remain readable without migration failures.
- Export/import paths preserve new fish-ID metadata.

### Story E5-S5 — Hardening, i18n, Offline/Privacy and Performance Validation

**Description:** Finalize production readiness for reliability, localisation, privacy, and performance.

**Acceptance Criteria:**
- Fish-ID strings are available in EN/DE/FR/IT/JA.
- E2E covers upload → prediction → override/save flow.
- Offline/no-network verification for local recognition is documented.
- Performance benchmarks match the approved feasibility profile targets.

## Sequencing and Dependencies

1. E5-S1 must complete before all other stories.
2. E5-S2 blocks E5-S3 and E5-S4.
3. E5-S3 and E5-S4 can proceed in parallel after E5-S2.
4. E5-S5 runs after E5-S3 and E5-S4 are functionally complete.

## Risks

- Runtime feasibility may fail on low-tier devices.
- Memory pressure from large photos can degrade UX.
- False confidence may bias user selection.

## Mitigations

- Hard feasibility gate and model profile lock first.
- Strict size/format validation and bounded preprocessing.
- Explicit low-confidence UX + required user confirmation path.
