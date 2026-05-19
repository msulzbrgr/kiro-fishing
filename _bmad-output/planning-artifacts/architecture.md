---
stepsCompleted: [1]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/project-context.md
workflowType: 'architecture'
project_name: 'kiro-fishing'
user_name: 'Runner'
date: '2026-04-29'
requestedStructure: 'arc42'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. The final architecture content will use the arc42 document structure and cover frontend modularization plus backend-ready modularization for user management, live updates/notifications, weather and water service adapters, and a dedicated regulation/law bounded context with versioned persistence, provenance, and adapters for canton, water-body, and species-specific regulatory sources._

## Accepted Architecture Context Refinement

- **Regulation & Law Domain:** Canton fishing laws, minimum sizes, permits, closed seasons, species restrictions, and water-body-specific rules are a dedicated domain. They must be encapsulated separately from map rendering and session tracking.
- **Temporal Persistence:** Regulations change over time, so the architecture must support versioned regulation records with validity periods, source URLs, retrieval/update timestamps, and historical lookup.
- **Domain Boundary:** UI components such as `MapView` should not directly own regulation lookup rules. They should ask a regulation/law service or module for applicable rules based on canton, water body, species, date, and location.
- **Future Backend Readiness:** The regulation domain should be designed so it can start as local/static data but later move to persisted storage or backend synchronization without rewriting UI components.
- **Legal Data Provenance:** Since regulation data can affect real-world compliance, each rule should preserve its source, jurisdiction, effective period, and confidence/update status.

## Scope Extension: Local Fish Species Recognition

### Architectural Goals

- Add photo-based fish species recognition to catch logging without breaking existing manual entry flow
- Keep the full fish-ID execution path local-only and offline-capable
- Preserve local-first ADR constraints: no backend APIs, no remote storage, no cloud inference
- Ensure low-risk rollout through a mandatory feasibility gate and model profile locking

### Feasibility Gate (Must Pass Before Coding)

The fish-ID capability is blocked until the team validates and approves:

- deployable local runtime choice (WebAssembly/WebGPU/TF.js path) for this browser-first app
- realistic benchmark targets for low/mid/high device tiers
- memory and model-size profile that does not degrade app stability
- fallback behavior for unsupported runtimes

Output artifact: selected model profile and benchmark report (checked into planning/implementation artifacts).

### Logical Components

1. **Catch Photo Intake (UI Layer)**
   - Existing `CatchLog` photo upload remains entry point
   - Emits normalized photo references to fish recognition service
   - Maintains user override and manual species control

2. **Fish Recognition Service (Application Layer)**
   - New service abstraction (`fishRecognitionService`) with runtime-independent API:
     - `initialize(profile)`
     - `classify(photoInput)`
     - `getDiagnostics()`
   - Returns ranked predictions and confidence values
   - Enforces no-network policy in recognition path

3. **Preprocessing and Inference (Local Runtime Layer)**
   - Image validation, decode, resize/normalize, tensor preparation
   - Embedding/inference using approved local runtime profile
   - Top-k ranking (k=3) for species candidates

4. **Persistence Adapter (Data Layer)**
   - Stores prediction metadata alongside catch records
   - Maintains compatibility with existing `Catch` model and manual workflows
   - Uses existing IndexedDB-backed persistence path

### End-to-End Flow

1. User attaches one or more photos in Catch Log
2. Photo validator checks format and size constraints
3. Recognition service performs local preprocessing and inference
4. Service returns top 3 candidates + confidences
5. UI pre-fills species with top candidate and shows alternatives
6. User confirms or overrides species
7. Save operation persists catch + recognition metadata
8. Any recognition failure degrades to manual entry (non-blocking)

### Data Model & Schema Impact

`Catch` requires additive metadata fields (backward compatible), for example:

- recognition status/source (`manual` or `ai`)
- predicted candidate list with confidence values
- selected candidate confidence
- model profile/version identifier
- recognition timestamp and optional error code

Migration strategy:

- additive optional fields only
- no destructive migration
- existing sessions remain valid without fish-ID metadata

### UX State Contract

Catch form must support explicit states:

- `idle` (no recognition started)
- `processing` (recognition running)
- `success` (predictions available)
- `low_confidence` (requires explicit user confirmation)
- `failed` (user-friendly reason, manual entry fallback)

### Security & Privacy Design

- No cloud/network dependency for fish-ID pipeline
- No transmission of image bytes, embeddings, or prediction metadata
- Model assets bundled or preloaded locally only
- Diagnostics must avoid storing raw image payloads

### Performance and Resource Strategy

- Benchmark by device tier (low/mid/high) and runtime profile
- Track:
  - model init (cold start)
  - warm inference latency
  - memory usage during processing
- Apply bounded image preprocessing to avoid memory spikes
- Add guardrails for low-memory devices and recover gracefully

### Testing and Validation Strategy

- **Unit:** input validation, ranking logic, fallback behavior, metadata mapping
- **Integration:** CatchLog + recognition service + persistence roundtrip
- **E2E:** attach photo → prediction shown → override/save → persisted metadata visible
- **Offline/Privacy:** verify recognition runs without network activity
- **Performance:** benchmark suite for selected model profile and target devices

### Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Runtime/model profile not viable on target devices | Feasibility gate blocks implementation until approved profile is locked |
| Inference latency degrades UX | Tiered benchmarks + warm-path optimization + non-blocking UI states |
| Memory pressure on large photos | strict file-size limits + bounded resize pipeline + graceful failure fallback |
| False confidence leads to wrong species save | low-confidence UX state + explicit user confirmation + manual override always available |
