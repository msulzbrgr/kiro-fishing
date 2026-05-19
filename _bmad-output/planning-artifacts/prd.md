---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - _bmad-output/project-context.md
  - _bmad-output/planning-artifacts/product-brief-kiro-fishing.md
  - _bmad-output/planning-artifacts/product-brief-kiro-fishing-distillate.md
  - _bmad-output/planning-artifacts/research/domain-swiss-fishing-regulations-research-2026-05-01.md
  - _bmad-output/planning-artifacts/research/technical-llm-regulation-lookup-research-2026-05-01.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/implementation-artifacts/spec-canton-regulations-overview.md
workflowType: 'prd'
classification:
  projectType: 'consumer_mobile_pwa'
  domain: 'legalinfo_outdoors_leisure'
  complexity: 'high'
  projectContext: 'brownfield'
releaseMode: 'phased'
---

# Product Requirements Document — KiroFishing

**Author:** Runner
**Date:** 2026-05-01

---

## Executive Summary

KiroFishing is a local-first Swiss fishing companion app (React 19 + TypeScript + Vite) that detects the user's canton from their map location and displays fishing regulation summaries for all 26 Swiss cantons. The app has a working Maps view with Leaflet integration, a Laws tab with regulation summaries, a Catch logging feature, and full EN/DE/FR/IT internationalisation.

The next major capability phase delivers two closely coupled features: a **Regulation Data Layer** (structured, source-tracked, freshness-dated regulation records) and an **AI Regulation Assistant** (a retrieval-augmented LLM Q&A feature grounded exclusively in the curated regulation data). A newly approved scope extension adds **Local Fish Species Recognition** in the catch-photo workflow, running fully on-device with no cloud processing. Together these transform the app from a map-with-links into the most trusted, legally-responsible Swiss fishing compliance companion available.

Switzerland's 500,000+ anglers must hold a valid canton-specific *Fischereipatent* before fishing — failure to do so is an administrative offence under Art. 22 BGF. Yet the information they need is scattered across 26 cantonal websites, annual PDF booklets, and secondary blogs with no shared schema, no API, and no structured Q&A. KiroFishing is uniquely positioned to solve this: it already knows the user's canton, and it already holds a regulation dataset. The missing pieces are (1) structured source provenance with permit purchase links and freshness dates, and (2) the ability to answer free-form questions responsibly.

Every design decision in this PRD is constrained by legal responsibility: the app provides informational guidance, never legal advice. Every answer must cite its source, show its verification date, and link to the official cantonal authority.

### What Makes This Special

No Swiss fishing app today offers location-aware, canton-specific regulation lookup with a grounded, cited AI assistant. KiroFishing's differentiation is not the LLM feature alone — it is the **responsible, provenance-tracked design**: every answer cites its source and date, the LLM is grounded in curated records (not live-browsing or hallucination), and the app is transparent when information is stale or missing. The data layer (Phase 1) delivers real value before any LLM feature is deployed, and the Phase 1 foundation is what makes Phase 2 safe.

## Project Classification

- **Project Type:** Consumer PWA / mobile-first web app
- **Domain:** Swiss fishing law + legal information + outdoor leisure
- **Complexity:** High — compliance-sensitive legal domain, multi-canton regulatory fragmentation, LLM integration with hallucination risk, local-first architecture constraints
- **Project Context:** Brownfield — adding two major capabilities to an existing, working app

---

## Success Criteria

### User Success

- An angler in Solothurn or Bern can open the app, tap their map location, and find:
  - A "Buy Permit" button that links directly to the official canton patent purchase portal
  - A freshness date and source citation for every regulation displayed
  - The ability to ask "How do I get a fishing permit here?" and receive a cited, responsible answer in under 5 seconds
- Users who ask a question outside the fishing domain receive a clear refusal, not an off-topic answer
- Users who ask about a regulation that is not yet in the system receive "I don't have this information — verify with the cantonal authority" rather than a hallucinated answer
- Multi-canton anglers (e.g., Aare spanning SO, BE, AG) can see which permits apply to border waters

### Business Success

- Phase 1 deployed: all 26 canton panels show `lastVerified` date and permit purchase link
- Phase 2 deployed: > 50% of LLM answer cache hit rate by week 2 (indicating repeated use)
- Permit purchase link click-through measurable in app analytics (user reaches official portal)
- Zero confirmed instances of a user receiving a hallucinated regulation fact
- App is usable offline for regulation browsing (no LLM dependency for read-only regulation display)

### Technical Success

- `RegulationSource` and `RegulationRecord` types implemented, fully typed (TypeScript strict mode)
- LLM answer JSON always validates against the `RegulationAnswer` interface (no parse errors)
- API key never appears in the browser bundle (user-provided key in localStorage or proxy)
- Answer cache TTL enforced; stale entries auto-purged
- All new UI strings available in EN/DE/FR/IT via i18next
- No raw GPS coordinates sent to any LLM API endpoint

### Measurable Outcomes

| Metric | Target | Phase |
|---|---|---|
| Canton panels with permit purchase link | 26/26 | Phase 1 |
| Canton records with `lastVerified` date | 26/26 | Phase 1 |
| LLM answer citation compliance | 100% | Phase 2 |
| Hallucinated regulation facts | 0 | Phase 2 |
| LLM cache hit rate (week 2) | > 50% | Phase 2 |
| Off-topic question refusal rate | 100% | Phase 2 |
| i18n coverage for new strings | 100% | Phase 1+2 |

## Product Scope

### Phase 1 — Regulation Data Layer (No LLM)

**What ships:**
- `RegulationSource` and `RegulationRecord` TypeScript types
- Curated source registry for Solothurn and Bern (2026 records)
- Permit purchase links on all canton panels (direct to official portal)
- Freshness dates (`lastVerified`, `effectiveYear`) on all canton records
- Canton regulations overview accessible from Laws tab without map selection
- "Verify with official authority before fishing" disclaimer on every regulation panel
- Full i18n for all new UI strings (EN/DE/FR/IT)

**What does NOT ship in Phase 1:**
- LLM integration, API key settings, or any external AI calls
- Enriched records for cantons beyond Solothurn and Bern (remaining 24 get basic source links)
- Source ingestion pipeline or automated PDF parsing

### Phase 2 — AI Regulation Assistant (User-Key Mode)

**What ships:**
- `useRegulationAssistant` React hook
- `RegulationAssistant` component (question input, answer display, citation list, freshness warning)
- `llmService.ts` — provider abstraction supporting OpenAI (primary) and Anthropic (fallback)
- App settings screen: API key entry (stored in localStorage)
- Answer caching in localStorage (7-day TTL, per canton + question hash)
- Strict grounding system prompt: citation-only, off-topic refusal, "verify with authority" footer
- JSON-mode output enforcement and response validation

**What does NOT ship in Phase 2:**
- Shared API proxy (Phase 3)
- Source change notifications (Phase 4)
- Enriched LLM records beyond SO/BE

### Phase 3 — Shared Proxy (Post-MVP)

- Cloudflare Worker stateless proxy (API key in Worker secret, rate limiting)
- No API key required from users in shared mode
- Per-IP rate limiting, CORS whitelist

### Phase 4 — Freshness and Notifications (Post-MVP)

- "Refresh from source" button on canton panel
- Source diff detection: when official source content changes, invalidate LLM cache
- In-app notification: "Regulations updated for Solothurn — check what changed"
- Annual regulation update reminder workflow

### Phase 5 — Local Fish Species Recognition (Scope Extension)

**What ships:**
- Automatic fish recognition starts after users add a photo in Catch Log
- Top-3 species suggestions with confidence scores from local inference
- Species field prefilled with top prediction; user can override before saving
- Prediction metadata persisted per catch (`predictedSpecies`, `confidence`, `modelVersion`, timestamp)
- Strict local-only inference path with no cloud/network calls
- Error handling for unsupported format, malformed image, and low-memory conditions
- Fish-ID UX strings localised in EN/DE/FR/IT/JA

**What does NOT ship in Phase 5:**
- Server-side model inference
- Cloud vector storage
- Any mandatory replacement of manual species entry

**Explicitly out of scope (all phases):**
- Legal advice or completeness guarantees
- Backend server, database, or user authentication
- Automated scraping scheduler
- WebLLM in-browser (GPU requirement, 3–5 GB download)
- LangChain.js or vector database

---

## User Journeys

### Journey 1: The Aare Angler Buying Her First Permit (Primary — Happy Path)

**Persona:** Martina, 34, Solothurn. She grew up fishing with her father and just moved back to canton Solothurn after years in Zürich. She wants to fish the Aare this spring but hasn't had a Solothurn patent for years. She opens KiroFishing.

**Opening:** Martina taps the map near the Aare in Solothurn. The app detects her canton: Solothurn (SO). The canton panel slides up.

**Rising action:** She sees a regulation summary — minimum sizes, closed seasons — and a new "Buy Permit" button labelled "Fischereipatent Solothurn kaufen." She taps it. She's taken directly to the official so.ch services portal where she completes the purchase. Beneath the summary, she reads: "Source: so.ch/awjf — Last verified: 2026-04-15 — Verify with cantonal authority before fishing."

**Climax:** Back in the app, she types into the AI Regulation Assistant: "Welche Mindestlänge gilt für Äschen in Solothurn?" The app responds: "In Solothurn gilt eine Mindestlänge von [X] cm für Äschen (Schonmass). *Quelle: Neuerungen Fischereigesetzgebung SO 2026, letzte Prüfung: 2026-04-15.* Bitte vor dem Angeln bei der offiziellen Behörde prüfen."

**Resolution:** Martina has her permit, knows the minimum size, and knows where the information came from. She fishes the Aare that Saturday, legally, confidently.

**Capabilities revealed:** Patent purchase link, regulation record display, AI Regulation Assistant Q&A, citation display, freshness date.

---

### Journey 2: The Multi-Canton Weekend Fisher (Primary — Edge Case)

**Persona:** Beat, 52, Biel/Bienne. He fishes both banks of the Bielersee on weekends, which spans Bern, Solothurn, and Neuchâtel. He's never been sure which permits he actually needs.

**Opening:** Beat taps the lake on the map. The app detects Bern (BE) as the primary canton. He asks the AI assistant: "Brauche ich für den Bielersee ein Patent aus Bern oder Solothurn?"

**Rising action:** The assistant retrieves records for both BE and SO. It responds: "Der Bielersee liegt auf den Kantonen Bern, Solothurn und Neuenburg. Für den Kanton Bern erhalten Sie das Patent hier: [weu.be.ch link]. Für Solothurn: [so.ch link]. Es ist empfehlenswert, beide kantonalen Behörden direkt zu kontaktieren, da für Gewässer an Kantonsgrenzen besondere Regelungen gelten können." It cites both sources and adds a freshness warning because the SO record is > 180 days old.

**Climax:** Beat sees the stale-data warning for Solothurn and taps "Verify with authority" — this opens the official so.ch page in his browser.

**Resolution:** Beat understands he may need permits from multiple cantons and knows exactly where to check. The app did not pretend certainty it did not have.

**Capabilities revealed:** Cross-canton record retrieval, staleness warning, off-topic/incomplete answer handling, official source deep-link.

---

### Journey 3: The New Angler Who Asks Something Out of Scope

**Persona:** Kevin, 22, Bern. He just got into fishing and thinks the AI assistant can answer anything.

**Opening:** Kevin types: "Was ist der beste Köder für Hecht?" (What is the best lure for pike?)

**Rising action:** The AI assistant responds: "Ich bin spezialisiert auf Fischereivorschriften und Fischereipatente in der Schweiz. Für Angelratschläge zu Ködern empfehle ich ein lokales Angelgeschäft oder vertrauenswürdige, offizielle Informationsquellen."

**Resolution:** Kevin is redirected appropriately. The app does not produce fishing advice outside its regulatory scope. He then asks: "Wie kaufe ich ein Fischerpatent in Bern?" and gets a proper cited answer.

**Capabilities revealed:** Off-topic refusal, LLM scope enforcement, graceful redirection.

---

### Journey 4: The App User Without an API Key

**Persona:** Lisa, 45, Thun. She uses KiroFishing for the regulation summaries but hasn't set up an API key.

**Opening:** Lisa taps on Thun area (Bern). The canton panel shows the regulation summary, permit purchase link, and freshness date. She sees the AI assistant section but it shows: "Enable AI Regulation Assistant — enter your OpenAI API key in Settings."

**Rising action:** Lisa decides not to set up an API key. She uses the regulation summary and permit purchase link directly — both work perfectly without the AI feature.

**Resolution:** The core regulation data experience works fully without the AI assistant. The AI feature is an enhancement, not a gate.

**Capabilities revealed:** Graceful degradation, AI feature as optional enhancement, core regulation display without LLM.

---

### Journey Requirements Summary

| Capability | Journeys |
|---|---|
| Patent purchase link (canton-specific) | J1, J2, J4 |
| Regulation record display with freshness date | J1, J2, J4 |
| AI Regulation Assistant Q&A | J1, J2, J3 |
| Citation display with source URL | J1, J2 |
| Staleness warning | J2 |
| Cross-canton record retrieval | J2 |
| Off-topic refusal | J3 |
| Graceful degradation (no API key) | J4 |
| Direct link to official cantonal authority | J1, J2, J3 |

---

## Domain-Specific Requirements

### Swiss Fishing Law Compliance

Swiss fishing regulation data is legally sensitive. The following requirements are non-negotiable across all phases:

- **Informational guidance only:** The app must never present itself as a legal reference or substitute for official cantonal authority guidance.
- **Mandatory disclaimer:** Every regulation panel and every LLM answer must display: "This information is for guidance only. Verify with the official cantonal authority before fishing." (localised in all 4 app languages)
- **Source citation required:** Every regulation fact displayed (structured or LLM-generated) must link to its source URL.
- **Freshness date required:** Every regulation record must show its `lastVerified` date and `effectiveYear`.
- **Source conflict disclosure:** If two sources conflict (e.g., secondary blog vs. official authority), show both and recommend the official source. Never silently resolve conflicts.
- **Missing information handling:** If the regulation record does not contain enough information to answer a question, the app must say so explicitly and link to the official authority — never hallucinate.

### Swiss Data Protection (nDSG / revFADP)

- GPS coordinates are personal data under Swiss nDSG — they must never be sent to any LLM API. Only the canton code (e.g., "SO") is transmitted.
- User questions about fishing regulations are not personal data and may be processed.
- If a shared proxy is deployed, only anonymised metadata (canton code, timestamp) may be logged.

### Regulatory Data Freshness

- Swiss cantons update fishing regulations annually (typically for the new calendar year).
- All regulation records must carry `lastVerified` and `effectiveYear`.
- Records older than 180 days (configurable) must display a staleness warning.
- The 2026 Solothurn regulation changes PDF must be used as the source for all SO 2026 records.

### Federal Law Hierarchy

- The federal BGF (SR 923.0) sets minimum standards; cantonal ordinances can only be stricter.
- The app must not imply that federal minimum sizes / closed seasons override cantonal rules when the canton is stricter.
- Source trust hierarchy for regulation records (descending): official_authority → official_law_text → official_pdf → permit_portal → aggregator → news_blog → forum.

---

## Innovation and Novel Patterns

### Detected Innovation Areas

1. **Responsible RAG for legal information:** Applying retrieval-augmented generation to a compliance-sensitive domain (Swiss fishing law) where hallucination has real legal consequences. The novel approach: the LLM is strictly constrained to curated, source-tracked regulation records and must cite every claim. If a claim cannot be cited, it must not be made.

2. **Legal data provenance as a UX concept:** Treating `lastVerified`, `effectiveYear`, `sourceUrl`, and `trustLevel` as user-visible, first-class UI elements — not backend metadata. Users see exactly where information came from and how fresh it is.

3. **Local-first LLM integration:** Adding LLM-powered Q&A to a local-first, no-backend app without compromising the offline-capable architecture. The regulation records live in the app bundle; the LLM call is the only optional external dependency.

### Competitive Landscape

No Swiss fishing app offers this combination. The closest competitor focuses on permit sales, not regulation Q&A. Global fishing apps (Fishbrain, Fishingpoints) have no regulation assistant. KiroFishing enters a clear blue ocean for this specific capability.

### Validation Approach

- Phase 1 validates user demand for structured regulation data + permit purchase links (no LLM risk).
- Phase 2 validates LLM answer quality with the grounding prompt before expanding to more cantons.
- Answer citations are verifiable by users — this is the built-in quality gate.

### Risk Mitigation

- Primary LLM risk: hallucinated regulation facts → mitigated by JSON-mode output, strict grounding prompt, and self-validation test suite for system prompt compliance.
- Secondary risk: API cost overrun → mitigated by answer caching (7-day TTL), question deduplication, and gpt-4o-mini as default (lowest cost at acceptable quality).

---

## Project-Type Requirements: Consumer PWA with LLM Integration

### Architecture Context (Brownfield)

KiroFishing has these hard constraints that all new features must respect:
- **No backend** — localStorage only for persistence; no server-side database
- **Local-first** — all regulation display works offline; LLM call is optional
- **TypeScript strict mode** — `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`
- **Leaflet dynamically imported** in useEffect (not react-leaflet)
- **i18next** for all user-visible strings — no hardcoded strings
- **Plain CSS** — mobile-first, kebab-case classes; no new CSS framework
- **lucide-react** — only icon library
- **Playwright E2E only** — no Jest/Vitest unit tests
- **Type-only imports** must use `import type {}`

### LLM Integration Requirements

- LLM API call must be optional and feature-gated (requires API key in settings)
- Primary provider: OpenAI `gpt-4o-mini` with JSON mode (`response_format: { type: "json_object" }`)
- Fallback provider: Anthropic `claude-haiku-3.5`
- Provider abstraction via Vercel AI SDK (`ai` npm package) — switching providers must require only a config change
- API key stored in localStorage (user-provided); never embedded in app bundle
- Answer response structure: `{ answer: string, citations: [{text, sourceUrl, lastVerified}], confidence: 'high'|'medium'|'low', freshnessWarning: boolean, disclaimer: string }`

### Data Model Requirements

```typescript
// RegulationSource — per official source URL
interface RegulationSource {
  canton: string;           // e.g. "SO"
  url: string;
  type: RegulationSourceType;
  language: 'de' | 'fr' | 'it' | 'en';
  trustLevel: 'high' | 'medium' | 'low';
  lastVerified: string;     // ISO date
  effectiveYear: number;
  description?: string;
  isPatentPurchase?: boolean;
}

// RegulationRecord — per extracted regulation fact
interface RegulationRecord {
  id: string;
  canton: string;
  topic: RegulationTopic;
  content: string;
  sourceUrl: string;
  extractedDate: string;
  effectiveYear: number;
  confidence: 'high' | 'medium' | 'low';
  isStale?: boolean;        // computed: age > staleness threshold
}

type RegulationTopic =
  | 'patent_types' | 'patent_purchase' | 'patent_price'
  | 'minimum_sizes' | 'closed_seasons' | 'method_restrictions'
  | 'protected_zones' | 'legal_basis' | 'authority_contact'
  | 'inter_cantonal';
```

### Mobile-First Requirements

- All new UI components are touch-friendly (minimum 44×44px tap targets)
- AI assistant question input works on mobile keyboard without layout overflow
- Citation links open in the user's native browser (target="_blank" with rel="noopener noreferrer")
- Staleness warning is visually distinct but not disruptive (icon + text, not a blocking modal)

---

## Project Scoping & Phased Development

### Phase Strategy

Delivery is explicitly phased because the data layer (Phase 1) delivers standalone user value and is the safety prerequisite for the LLM feature (Phase 2). The phases are not MVP-trimming — they are sequenced by dependency and risk.

### Phase 1 — Regulation Data Layer

**Core journeys supported:** J1 (permit purchase), J4 (no-API-key experience)
**Resource requirements:** 1 developer, ~2 sprints

**Must-have capabilities:**
- `RegulationSource` + `RegulationRecord` types in `src/types/`
- Source registry seeded for Solothurn and Bern (all high-trust sources)
- `regulationRecords.ts` seeded with SO + BE regulation facts (patent_purchase, patent_types, minimum_sizes, closed_seasons, authority_contact)
- `cantonLaws.ts` entries for SO + BE enriched with `permitPurchaseUrl`, `lastVerified`, `regulationYear`
- "Buy Permit" action button on canton panel → opens official portal URL
- "Last verified" date displayed on all canton panels
- Staleness warning (configurable threshold, default 180 days)
- "Verify with authority" disclaimer on every regulation display
- Canton regulations overview on Laws tab (no map selection required)
- All strings via i18next (EN/DE/FR/IT)

### Phase 2 — AI Regulation Assistant

**Core journeys supported:** J1, J2, J3
**Resource requirements:** 1 developer, ~3 sprints
**Prerequisite:** Phase 1 complete

**Must-have capabilities:**
- `src/services/llmService.ts` — provider abstraction (OpenAI + Anthropic)
- `src/hooks/useRegulationAssistant.ts` — question → records retrieval → LLM call → cache → render
- `RegulationAssistant` component — question input, answer render, citation list, freshness warning
- LLM answer caching in localStorage (7-day TTL, key: canton + question hash)
- API key settings screen (user-provided key, localStorage storage)
- System prompt: grounding-only, citation-required, off-topic refusal, JSON-mode output
- Response validation: parse and reject malformed LLM output
- Input sanitization: strip HTML, limit to 500 chars, Swiss character set
- Feature gate: AI assistant section hidden/disabled when no API key is configured
- "Verify with authority" footer on every LLM answer

### Phase 3 — Shared Proxy (Post-MVP)

- Cloudflare Worker: accepts `{canton, question, records}`, forwards to OpenAI with API key from Worker secret
- Per-IP rate limiting; CORS whitelist for app domain
- `proxyUrl` config in app settings (Phase 2 users can optionally switch to proxy)

### Phase 4 — Source Refresh and Notifications

- "Refresh from source" button on canton panel (fetches official URL, re-extracts records)
- Diff detection: if extracted content changes, invalidate LLM answer cache for that canton
- In-app notification: "Regulations updated for [canton] — what changed"

### Phase 5 — Local Fish Species Recognition

**Core journeys supported:** Catch logging with photo evidence and assisted species entry  
**Resource requirements:** 1 developer, ~2-3 sprints  
**Prerequisite:** Feasibility Gate complete (deployable local model profile approved)

**Must-have capabilities:**
- Feasibility Gate: validate candidate local model/runtime profiles against realistic device tiers before implementation
- `src/services/fishRecognitionService.ts` runtime abstraction for local inference
- Catch-photo pipeline: capture → normalization → embedding/inference → top-3 ranking
- Catch form integration: loading, success, low-confidence, failure, and manual-override states
- Local persistence of fish-ID prediction metadata and model version
- Offline-first behavior: fish recognition remains local and does not require connectivity
- Fish-ID UI strings in EN/DE/FR/IT/JA

### Risk Mitigation

| Risk | Mitigation |
|---|---|
| LLM hallucination | Grounding prompt + JSON mode + response validation + mandatory citation |
| Stale regulation data | Freshness dates + staleness warning + explicit "verify with authority" |
| API key leaked | User-key in localStorage only; never in bundle; proxy option in Phase 3 |
| GPS data sent to LLM | Send only canton code, never coordinates |
| Annual regulation change missed | `lastVerified` dates visible to user; staleness threshold warning |
| Phase 2 without Phase 1 | Phase 1 data layer is a hard prerequisite — no LLM feature without it |

---

## Functional Requirements

### Regulation Data Management

- FR1: The app displays a regulation summary panel for the user's detected canton when they tap a map location
- FR2: The app displays permit purchase information, including a direct link to the official patent purchase portal, for each canton
- FR3: The app displays the `lastVerified` date and `effectiveYear` for every regulation record shown to the user
- FR4: The app displays a staleness warning when a regulation record has not been verified within the configured threshold (default 180 days)
- FR5: The app displays a "Verify with official cantonal authority before fishing" disclaimer on every regulation panel
- FR6: The app displays a canton regulations overview from the Laws tab without requiring a map location selection
- FR7: The app stores regulation records as structured `RegulationRecord` objects with canton, topic, content, sourceUrl, extractedDate, effectiveYear, and confidence fields
- FR8: The app stores regulation sources as structured `RegulationSource` objects with trust levels and patent-purchase flags
- FR9: The app provides curated regulation records for Solothurn and Bern covering: patent types, patent purchase, minimum sizes, closed seasons, and authority contact
- FR10: The app provides permit purchase links for all 26 cantons (official portal URL per canton)

### AI Regulation Assistant — Core

- FR11: Users can ask free-form natural language questions about fishing regulations for their detected canton
- FR12: The AI assistant returns answers grounded exclusively in the curated regulation records for the relevant canton(s)
- FR13: Every AI-generated answer includes citations: source URL and last-verified date for each factual claim
- FR14: Every AI-generated answer includes the disclaimer "Verify with the official cantonal authority before fishing"
- FR15: The AI assistant refuses to answer questions unrelated to Swiss fishing regulations and redirects the user
- FR16: The AI assistant explicitly states when it does not have enough information to answer, and links to the official cantonal authority
- FR17: The AI assistant returns answers in structured JSON format: `{ answer, citations, confidence, freshnessWarning, disclaimer }`
- FR18: When a regulation record referenced in an AI answer is stale, the answer includes a freshness warning visible to the user

### AI Regulation Assistant — Data Retrieval

- FR19: The AI assistant retrieves only the regulation records relevant to the user's detected canton before calling the LLM API
- FR20: For border waters and inter-cantonal questions, the AI assistant retrieves records for all relevant cantons
- FR21: The app caches AI-generated answers by canton and question hash with a 7-day TTL
- FR22: Cached answers are served without an LLM API call when the cache entry is valid

### AI Regulation Assistant — Configuration

- FR23: Users can enter their LLM API key in app settings and have it stored in localStorage
- FR24: The AI assistant feature is hidden or disabled when no API key is configured
- FR25: Users can select their preferred LLM provider (OpenAI or Anthropic) in app settings
- FR26: The app supports a proxy URL configuration as an alternative to a user-provided API key (Phase 3)

### Local Fish Species Recognition

- FR32: After at least one photo is attached in Catch Log, the app automatically starts local fish recognition before catch save
- FR33: The app returns up to three candidate species and confidence scores for each recognition attempt
- FR34: The app pre-fills the species field with the top prediction while allowing full manual override
- FR35: If confidence is below the configured threshold, the app keeps suggestions visible and explicitly asks the user to confirm species manually
- FR36: Recognition accepts only supported image formats and size limits; unsupported files are rejected with a user-friendly error
- FR37: The app stores fish-ID metadata with each catch: predicted species list, selected species source (AI/manual), confidence, model version, and recognition timestamp
- FR38: Recognition must execute fully on-device; no network calls are permitted during image processing, embedding, ranking, or metadata persistence
- FR39: If recognition fails (format, corruption, memory, runtime), catch logging still works with manual species selection
- FR40: The app records feasibility-gate-selected model profile metadata and exposes it in diagnostics/settings for supportability
- FR41: Fish-ID UI strings (loading, error, low-confidence, suggestions, override guidance) are localised in EN/DE/FR/IT/JA

### Internationalisation

- FR27: All regulation panel UI strings (permit purchase labels, disclaimer, staleness warning, freshness date label) are available in EN, DE, FR, and IT via i18next
- FR28: All AI Regulation Assistant UI strings (question input placeholder, answer header, citation label, error messages) are available in EN, DE, FR, and IT

### Source Provenance and Safety

- FR29: The app never sends user GPS coordinates to any LLM API; only canton codes are transmitted
- FR30: The app displays source conflict information when two sources for the same regulation topic disagree, and recommends the official authority source
- FR31: The app links to the official cantonal authority website from every regulation panel

---

## Non-Functional Requirements

### Performance

- Regulation panel display (structured records, no LLM): < 200ms after canton detection
- AI assistant response (from API call initiation to rendered answer): < 8 seconds on a standard mobile connection
- LLM answer cache lookup: < 50ms (localStorage read)
- App startup with regulation records loaded: no measurable increase from baseline (static JSON is bundled)
- Fish recognition feasibility gate must define and lock tiered targets (low/mid/high devices) for cold start, warm inference, and memory footprint before implementation begins
- Fish recognition benchmark evidence must be captured and stored with the selected model profile before release

### Security and Privacy

- LLM API key must not appear in the JavaScript bundle, network requests visible in browser devtools, or any log output
- API key stored in localStorage with key prefix `kiro_settings_`; no third-party transmission
- User question input sanitized before LLM call: HTML stripped, length capped at 500 characters, control characters removed
- Only canton code transmitted to LLM API — no GPS coordinates, no user identifiers
- If proxy mode is used, the proxy must not log question content; only canton code and timestamp may be logged
- LLM response JSON parsed strictly; malformed responses must be rejected and error surfaced to user
- Fish recognition image bytes, embeddings, and prediction metadata must remain on-device only
- Fish recognition flow must block network activity for inference-related processing paths

### Reliability

- LLM API call failures must surface a user-friendly error with a link to the official cantonal authority — never a raw error message
- If LLM API is unavailable, the structured regulation records (Phase 1) remain fully functional and accessible
- App must work fully offline for regulation browsing (structured records, permit purchase links, freshness dates) — only the AI assistant requires connectivity
- If fish recognition is unavailable on a device/runtime, users must retain the full manual catch logging flow without data loss

### Accessibility

- All new interactive elements (question input, answer display, citation links, permit purchase button) must be keyboard-navigable and have appropriate ARIA labels
- Staleness warnings must be distinguishable by colour-blind users (icon + text, not colour alone)
- Minimum contrast ratio of 4.5:1 for all regulation text

### Localisation

- All user-visible strings related to regulation display and AI assistant feature must be localised in EN, DE, FR, IT
- Regulation record content (sourced from German-language official documents) is displayed in German by default; the `contentDe` field provides German-language fallback for FR/IT records if available
- All user-visible fish-recognition strings must be localised in EN, DE, FR, IT, and JA

---

*This PRD is the capability contract for KiroFishing's Regulation Management and AI Regulation Assistant features. All design, architecture, and development work must trace back to the functional and non-functional requirements documented here. Update this document as requirements evolve — especially before beginning Phase 2.*
