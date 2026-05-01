---
title: "Product Brief Distillate: KiroFishing — Regulation Management & AI Regulation Assistant"
type: llm-distillate
source: "product-brief-kiro-fishing.md"
created: "2026-05-01T20:00:00Z"
purpose: "Token-efficient context for downstream PRD creation"
---

# Product Brief Distillate: KiroFishing Regulation Management & AI Assistant

## Core Concept
- KiroFishing is a local-first, no-backend Swiss fishing companion (React 19 + TypeScript + Vite)
- Currently: 26-canton regulation summaries + map detection via Nominatim + session/catch logging
- This brief covers 2 new capabilities: (1) Regulation Data Layer and (2) AI Regulation Assistant
- Both capabilities feed each other — Phase 1 data is the safety foundation for Phase 2 LLM

## Domain Facts (Swiss Fishing Law)
- Swiss fishing law = 2-tier: federal BGF (SR 923.0) sets floor; 26 cantons enact stricter ordinances
- Every angler must hold a valid canton-specific **Fischereipatent** — no patent = administrative offence (Art. 22 BGF)
- Regulations reviewed annually; effective year must be tracked on every record
- Federal minimums: Brown trout 25cm, Grayling 30cm, Pike 40cm (cantons can raise, not lower)
- No Swiss canton exposes a structured API for fishing regulations — all data is static HTML or PDF
- Border waters (Bielersee, Bodensee, Aare) may require permits from multiple cantons

## Solothurn Sources (verified by user)
- Patent portal: https://so.ch/services/fischerpatent-beantragen/
- 2026 regulation changes PDF: https://so.ch/fileadmin/internet/vwd/vwd-awjf-jagd/pdf/Fischerei/Neuerungen_Fischereigesetzgebung_SO_2026_-_V2.pdf
- Law text: https://www.lexfind.ch/tolv/76735/de
- Authority: Amt für Wald, Jagd und Fischerei (AWJF), Kanton Solothurn

## Bern Sources (verified by user)
- Authority overview: https://www.weu.be.ch/de/start.html
- Fishing info: https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei/fischen-kanton-bern/
- Patent purchase: https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei/fischen-kanton-bern/fischereipatent-beziehen.html
- Authority: Amt für Landwirtschaft und Natur (LANAT) / Fischerei, under WEU
- Bern complexity: multiple patent types (Kantonalpatent, Jahrespatent Thunersee/Brienzersee, Tagespatent, Wochenpatent, Junioren/Senioren)

## Secondary Sources (lower trust)
- fischen.ch/blog — 2026 legal changes aggregator (secondary, may lag): provided by user
- (removed — unsecure) — forum, very low trust
- (removed — unsecure) — permit sales aggregator (medium trust for purchase info, low for law detail)

## Source Trust Hierarchy (for data model)
1. official_authority (canton website): HIGH
2. official_law_text (lexfind.ch, admin.ch): HIGH
3. official_pdf (annual regulation PDF from authority): HIGH
4. permit_portal (online purchase portal): HIGH, isPatentPurchase: true
5. aggregator ((removed — unsecure)): MEDIUM
6. news_blog (fischen.ch): LOW
7. forum ((removed — unsecure)): VERY LOW

## Data Model Requirements (derived from domain + technical research)
- `RegulationSource`: canton, url, type (enum above), language, trustLevel, lastVerified (ISO date), effectiveYear, description, isPatentPurchase?
- `RegulationRecord`: id, canton, topic (enum), content (text), contentDe? (translation), sourceUrl, extractedDate, effectiveYear, confidence, isStale?
- `RegulationTopic` enum: patent_types, patent_purchase, patent_price, minimum_sizes, closed_seasons, method_restrictions, protected_zones, legal_basis, authority_contact, inter_cantonal
- Stale threshold: configurable, default 180 days
- Records live in static JSON/TS initially; designed to move to backend without UI changes (ADR-0004)

## LLM Architecture Decision
- CHOSEN: Nano-RAG (JSON filter by canton → LLM with grounded context)
- REJECTED: Static prompt every time — scales poorly, hallucination risk, no source tracking
- REJECTED: Live web browsing every time — slow, unreliable, Swiss gov sites block sandboxes
- REJECTED: Full vector/semantic RAG — overkill for 260-record dataset, adds deps
- Phase 1 (data layer) delivers value WITHOUT any LLM feature
- Phase 2 adds LLM on top of Phase 1 data

## LLM Provider Choices
- Primary: OpenAI gpt-4o-mini — $0.15/$0.60 per 1M tokens, JSON mode, 128k ctx
- Fallback: Anthropic claude-haiku-3.5 — $0.80/$4.00 per 1M tokens, 200k ctx
- SDK: Vercel AI SDK (`ai` npm package) — provider-agnostic, stream support
- Cost per query: ~$0.0006 (single canton, 2500 input + 400 output tokens)
- Monthly cost at 500 DAU, 2 queries/day, 60% cache hit: ~$7.50/month

## API Key Security Decision
- Phase 2a: User-provided API key stored in localStorage — no backend needed
- Phase 2b (future): Cloudflare Worker stateless proxy — free tier 100k req/day, API key in Worker secret
- NEVER: Vite VITE_OPENAI_KEY in env — embeds key in browser bundle (security anti-pattern)
- Data minimization: send only canton CODE (e.g. "SO"), never raw GPS coordinates to LLM

## System Prompt Non-Negotiables
- Answer ONLY from provided regulation records
- Cite sourceUrl for every factual claim
- If information is missing, say so explicitly — never invent regulations
- Never give legal advice; always add: "Verify with official cantonal authority before fishing"
- Reject off-topic questions (prompt injection mitigation)
- Output must be JSON: { answer, citations: [{text, sourceUrl, lastVerified}], confidence, freshnessWarning, disclaimer }

## LLM Answer Caching
- Cache key: canton + SHA-256 hash of normalized question (first 8 chars)
- Storage: localStorage, key prefix: `kiro_llm_cache_`
- TTL: 7 days (regulations don't change daily)
- Invalidation: when regulation records for that canton are updated

## Existing Architecture Constraints (must not break)
- NO backend — localStorage only for persistence
- Leaflet must be dynamically imported in useEffect
- Every UI string goes through i18next (en/de/fr/it) — NO hardcoded strings
- TypeScript strict mode: noUnusedLocals, noUnusedParameters, erasableSyntaxOnly
- No new CSS framework — plain CSS, mobile-first, kebab-case classes
- No new icon library — only lucide-react
- Playwright E2E only (no Jest/Vitest unit tests)
- react-leaflet NOT used — raw Leaflet via useRef
- Type-only imports must use `import type {}`

## Phased Implementation Roadmap
- Phase 1 (Foundation — no LLM): RegulationSource + RegulationRecord types; seed SO+BE sources & records; enrich cantonLaws.ts for SO+BE; "Buy Permit" button; freshness dates; disclaimer; canton overview in Laws tab; i18n
- Phase 2 (LLM / user key): llmService.ts; useRegulationAssistant hook; RegulationAssistant component; settings screen for API key; answer caching
- Phase 3 (proxy): Cloudflare Worker; proxy mode in llmService; rate limiting
- Phase 4 (refresh): "Refresh from source" button; diff detection; in-app notifications when regulations change

## Rejected Ideas (do not re-propose)
- Automated scraping of cantonal websites on a schedule — blocked in sandbox, no backend for scheduling
- Claiming legal completeness or real-time accuracy
- Expanding enriched records to all 26 cantons simultaneously in Phase 1 (scope risk — start with SO+BE)
- WebLLM in-browser (WASM) — requires WebGPU, 3-5GB download, too slow for mobile users now (track for future)
- LangChain.js — overkill for 260-record dataset, large bundle
- react-leaflet — already rejected in project ADRs
- Any backend server or database

## Legal Safety Non-Negotiables (every regulation display)
1. Source citation with URL
2. Freshness date ("Last verified: [date]")
3. Disclaimer: "This information is for guidance only. Verify with the official cantonal authority before fishing."
4. If two sources conflict: show BOTH, flag discrepancy, recommend official source
5. LLM answer: if information not in records, say so — never hallucinate

## Compliance & Regulatory Context
- Swiss revised Data Protection Act (nDSG / revFADP, in force Sep 2023) applies if personal data is processed
- User questions about fishing regulations are NOT personal data
- GPS coordinates ARE personal data — do not send to LLM API (send only canton code)
- If shared proxy deployed: log only anonymised metadata (canton code + timestamp)

## Competitive Differentiation
- No Swiss fishing app has location-aware, canton-specific, grounded LLM regulation assistant
- (removed — unsecure) is the closest competitor — focuses on permit sales, not regulation Q&A
- Fishbrain has no regulation assistant (social/catch-log focus)
- KiroFishing gap: only app combining map detection + structured regulation data + cited LLM Q&A

## Open Questions for PRD
- Should the AI Regulation Assistant support all 4 app languages (EN/DE/FR/IT) in the first version, or only DE (primary official language of most cantons)?
- What is the target staleness threshold for the freshness warning? (Suggested default: 180 days)
- Should API key setup be a mandatory onboarding step or strictly optional (feature-gated)?
- How should the app handle inter-cantonal waters (e.g. Bielersee)? Flag them explicitly or show multiple canton records?
- Should the LLM assistant appear in both the map panel AND the Laws tab, or only in one initially?

## Files Already in Repo (do not duplicate)
- `_bmad-output/planning-artifacts/architecture.md` — ADR-0004 regulation domain decision
- `_bmad-output/implementation-artifacts/spec-canton-regulations-overview.md` — existing SO+BE spec (pre-LLM)
- `_bmad-output/project-context.md` — tech stack, critical rules, code organisation
- `docs/adr/0004-dedicated-regulation-domain.md` — regulation domain boundary ADR
