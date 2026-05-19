# Sprint Change Proposal — Local AI Fish Species Recognition

**Date:** 2026-05-19  
**Project:** kiro-fishing  
**Prepared by:** Developer Agent (Correct Course)

## 1) Issue Summary

A new capability is requested: automatic fish species recognition from uploaded catch photos. This is outside the current PRD focus (regulation data + regulation assistant) and introduces new product, architecture, and backlog requirements.

**Trigger classification:** New requirement emerged from stakeholders.  
**Evidence:** Existing PRD phases and functional requirements focus on regulation lookup and regulation Q&A only; no fish-image inference workflow is currently specified.

## 2) Checklist Execution Summary

### Section 1 — Understand Trigger and Context
- [x] 1.1 Trigger identified: post-photo-upload fish species recognition requirement
- [x] 1.2 Core problem defined: feature scope change beyond current regulation-focused roadmap
- [x] 1.3 Evidence documented: PRD/architecture do not define local fish identification pipeline

### Section 2 — Epic Impact Assessment
- [x] 2.1 Current epic can continue (regulation roadmap remains valid)
- [x] 2.2 Epic-level changes required: add a new fish-ID epic and story set
- [x] 2.3 Future epics reviewed: no invalidation of regulation phases
- [x] 2.4 New epic required: yes (local fish identification)
- [x] 2.5 Priority/order adjustment: feasibility gate must be first story

### Section 3 — Artifact Conflict and Impact Analysis
- [x] 3.1 PRD conflicts identified: missing fish-ID requirements and feasibility gate
- [x] 3.2 Architecture conflicts identified: no local inference pipeline or model lifecycle described
- [x] 3.3 UI/UX impacts identified: upload flow now needs identify/loading/success/failure/override states
- [x] 3.4 Other artifacts impacted: sprint planning artifacts and status tracking

### Section 4 — Path Forward Evaluation
- [x] 4.1 Option 1 (Direct Adjustment): **Viable** (Medium effort, Medium risk)
- [ ] 4.2 Option 2 (Potential Rollback): **Not viable**
- [!] 4.3 Option 3 (PRD MVP Review): **Action-needed if feasibility fails**
- [x] 4.4 Recommended approach: **Hybrid of Option 1 + Feasibility Gate**

### Section 5 — Sprint Change Proposal Components
- [x] 5.1 Issue summary prepared
- [x] 5.2 Epic and artifact impact documented
- [x] 5.3 Recommended path with rationale documented
- [x] 5.4 MVP impact and action plan documented
- [x] 5.5 Agent handoff plan defined

### Section 6 — Final Review and Handoff Readiness
- [x] 6.1 Checklist reviewed for completeness
- [x] 6.2 Proposal validated for consistency/actionability
- [!] 6.3 User approval required before development story execution
- [x] 6.4 Sprint status update planned with new epic/story entries
- [x] 6.5 Next steps and handoff responsibilities defined

## 3) Impact Analysis

### Epic Impact
- Existing regulation epics remain in scope and unchanged.
- New capability requires a dedicated epic for local fish species recognition.
- Story sequencing must begin with a feasibility gate before implementation stories.

### Story Impact
- No rollback of completed implementation stories.
- New stories required for:
  1. Feasibility validation and model profile lock
  2. Local inference pipeline
  3. Catch Log UX integration + override flow
  4. Persistence/schema updates
  5. Hardening (safety, perf, i18n, offline/privacy tests)

### Artifact Conflicts
- **PRD:** Needs feature objective, FR/NFR, feasibility gate, acceptance criteria.
- **Architecture:** Needs local pipeline, storage impact, model lifecycle, error and fallback paths.
- **UX:** Needs explicit loading/error/manual override interaction states.
- **Sprint artifacts:** Need new epic/story entries and sequencing.

### Technical Impact
- Local-only inference requirement must stay consistent with local-first ADR and no-cloud rule.
- Existing catch flow must remain functional if AI recognition fails or is disabled.
- Data model must support prediction metadata while preserving manual species entry.

## 4) Recommended Approach

**Selected path:** Direct adjustment with a mandatory feasibility gate.

**Why this path:**
- Preserves current roadmap and avoids rework on delivered regulation capabilities.
- Adds the new capability as an additive epic with clear boundaries.
- De-risks unrealistic constraints early by validating deployable local model/runtime before coding.

**Effort/Risk/Timeline impact:**
- Effort: Medium
- Risk: Medium (runtime/model feasibility, mobile/browser constraints)
- Timeline impact: Adds one new epic, sequenced after feasibility confirmation

## 5) Detailed Change Proposals (Old → New)

### 5.1 PRD

**Section:** Product Scope

**OLD:**
- Phase 1: Regulation Data Layer
- Phase 2: AI Regulation Assistant
- Phase 3/4: Proxy + notifications

**NEW:**
- Add new phase for local fish species recognition from catch photos
- Add feasibility gate requirement to validate local model/runtime profile before implementation
- Add explicit local-only privacy and offline constraints for fish-ID workflow

**Rationale:** New capability is outside current feature contract and needs formal scope inclusion.

---

**Section:** Functional Requirements

**OLD:**
- FR1–FR31 focus on regulation records and regulation assistant

**NEW:**
- Add fish-ID functional requirements for:
  - Auto-run on photo upload
  - Top-3 species + confidence output
  - Prefill + user override
  - Persist prediction metadata (species/confidence/model version)
  - File validation and error handling for malformed images and low-memory conditions

**Rationale:** Ensures implementation can be tested against clear acceptance outcomes.

---

**Section:** Non-Functional Requirements

**OLD:**
- Performance/security/reliability focus on regulation and cloud LLM path

**NEW:**
- Add fish-ID NFRs for:
  - Device-tier benchmark targets (cold/warm inference)
  - Strict local processing (no network during recognition)
  - Mobile memory budget controls and graceful degradation
  - Localisation requirements for all fish-ID UI in en/de/fr/it/ja

**Rationale:** Current NFRs do not cover image-inference behavior.

### 5.2 Architecture

**OLD:**
- Regulation domain boundary and future backend readiness

**NEW:**
- Define local fish-ID module architecture:
  - capture → normalize → embed/infer → rank top 3 → persist metadata
  - runtime abstraction for local model backends
  - strict no-network guard during inference
  - storage/schema versioning strategy and fallback behavior
  - observability counters for confidence/error/perf without leaking image payloads

**Rationale:** Architecture must prevent ad-hoc inference integration in UI components.

### 5.3 Epics and Stories

**OLD:**
- No dedicated epic/story plan for fish-ID

**NEW:**
- Add new fish-ID epic with implementation stories sequenced by risk:
  1) Feasibility gate
  2) Inference pipeline
  3) Catch-log UX integration
  4) Persistence/schema updates
  5) Hardening/tests/perf/i18n

**Rationale:** Enables controlled implementation and review cadence.

## 6) MVP Impact and Action Plan

### MVP Impact
- Regulation MVP remains intact.
- Fish-ID is added as a new capability stream with explicit dependency on feasibility approval.

### High-Level Action Plan
1. Update PRD with fish-ID scope and acceptance criteria.
2. Update architecture with local inference pipeline and model lifecycle decisions.
3. Generate epics/stories for implementation sequencing.
4. Update sprint status tracking with new backlog entries.
5. Execute stories only after feasibility gate is marked complete.

## 7) Implementation Handoff

**Scope classification:** Moderate (backlog reorganization + implementation)

### Handoff recipients and responsibilities
- **Product Owner / PM**
  - Approve fish-ID scope change and feasibility gate criteria.
- **Architect**
  - Confirm runtime/model profile and memory/performance constraints.
- **Developer agent**
  - Implement stories in sequence after feasibility approval.
- **QA**
  - Validate offline/no-network behavior, i18n coverage, and performance targets.

### Success criteria
- Approved PRD + architecture updates merged.
- New fish-ID epic/stories in backlog and tracked in sprint status.
- Feasibility gate accepted before coding stories proceed.

---

**Approval status:** Pending explicit user approval.
