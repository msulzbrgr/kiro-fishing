---
title: "Product Brief: KiroFishing — Regulation Management & AI Regulation Assistant"
status: "complete"
created: "2026-05-01T20:00:00Z"
updated: "2026-05-01T20:00:00Z"
inputs:
  - _bmad-output/project-context.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/research/domain-swiss-fishing-regulations-research-2026-05-01.md
  - _bmad-output/planning-artifacts/research/technical-llm-regulation-lookup-research-2026-05-01.md
  - _bmad-output/implementation-artifacts/spec-canton-regulations-overview.md
---

# Product Brief: KiroFishing — Regulation Management & AI Regulation Assistant

## Executive Summary

Every Swiss angler faces the same invisible obstacle before casting a line: navigating 26 different cantonal fishing laws, each with its own rules, its own permit types, and its own purchasing process. Today, finding that information means hunting across official cantonal websites written in bureaucratic German, downloading annual PDF booklets, and hoping nothing changed since last year. KiroFishing already detects the user's canton from their map location and shows basic regulation summaries — but it stops short of actually answering the questions anglers ask: *"How do I buy a permit here?" "What is the minimum size for grayling in Solothurn this year?" "Can I use both banks of the Aare with a Bern patent?"*

This product brief defines two closely related capabilities that transform KiroFishing from a map-with-regulation-links into a trusted Swiss fishing companion: (1) **Regulation Management** — a structured, source-tracked, freshness-dated regulation data layer covering all 26 cantons, beginning with Solothurn and Bern; and (2) an **AI Regulation Assistant** — a retrieval-grounded LLM feature that lets anglers ask free-form questions and receive cited, responsible answers drawn exclusively from the curated regulation data.

Both capabilities are designed to fit KiroFishing's existing local-first, no-backend architecture, to match Switzerland's legal sensitivity requirements (informational guidance, never legal advice), and to be built incrementally — the regulation data layer delivers standalone value the moment it is complete, before any LLM feature is introduced.

## The Problem

Swiss fishing regulation data is fragmented, stale, and inaccessible for the average angler:

- **26 independent rule sets.** Each canton implements its own ordinance on top of the federal BGF. Minimum sizes, closed seasons, fishing methods, and permit types differ canton by canton.
- **Information is static and hard to find.** Official data lives on cantonal government websites (so.ch, weu.be.ch, etc.) and annual PDF booklets — no structured API, no machine-readable format, no common schema.
- **Annual updates create staleness risk.** Regulations are reviewed each year. Cached or aggregated information online is frequently outdated. An angler acting on stale data risks a compliance violation.
- **Permit purchase is opaque.** Even anglers who know the rules struggle to find *where* and *how* to buy the right permit. Each canton has different channels (online portal, postal application, authorized tackle shops) and different price tiers.
- **The current app shows only summaries.** KiroFishing's existing regulation data in `cantonLaws.ts` covers all 26 cantons with basic summaries and links, but lacks: permit purchase URLs, structured source citations, freshness dates, or the ability to answer a natural-language question.

The cost of this status quo: anglers fish without the right permit (unknowingly) or don't fish at all because the friction of finding information is too high.

## The Solution

**Phase 1 — Regulation Data Layer (no LLM required)**

A structured `RegulationSource` and `RegulationRecord` data model replaces the current flat `cantonLaws.ts` structure. Starting with Solothurn and Bern, each canton record gains:
- Official source URLs with trust levels (official authority, law text, official PDF, permit portal)
- Permit purchase channels with direct links (online portal, postal, in-person offices, authorized shops)
- Structured regulation facts: patent types, prices (indicative), minimum sizes, closed seasons, method restrictions
- Freshness metadata: `lastVerified` date, `effectiveYear`, staleness flag
- A prominent "verify with official authority before fishing" disclaimer on every regulation panel

The Laws tab gains a **canton regulations overview** that users can browse without selecting a map location, and a **"Buy Permit" action** on every canton panel that links directly to the official purchase portal.

**Phase 2 — AI Regulation Assistant (Nano-RAG + LLM)**

A natural-language Q&A feature appears on canton panels, powered by retrieval-augmented generation (RAG). When a user asks "Wie beantrage ich ein Fischerpatent in Solothurn?", the app:
1. Retrieves the relevant regulation records for that canton from the local data layer
2. Sends only those records (not the full 26-canton dataset) to an LLM API with a strict grounding prompt
3. Returns a structured answer that cites the source URL and date for every factual claim
4. Always appends: "Verify with the official cantonal authority before fishing."

The feature works in user-provided API key mode (Phase 2a) and optionally via a shared stateless proxy (Phase 2b) for users who don't want to manage an API key.

## What Makes This Different

No Swiss fishing app today offers location-aware, canton-specific regulation lookup with a grounded, cited AI assistant. The differentiation is not just the LLM feature — it is the **responsible, legally-aware design** that sets it apart:

- **Every answer cites its source and date.** The app never presents regulation data without showing where it came from and when it was verified.
- **Curated sources, not live browsing.** Unlike a general-purpose AI that might hallucinate Swiss fishing law, KiroFishing's assistant answers only from its curated regulation records. If the record doesn't exist, it says so.
- **Staleness is a first-class concept.** When regulation records are older than a configurable threshold, a warning surfaces: "This information was last verified [date] — check with the cantonal authority before the 2027 season."
- **Local-first architecture preserved.** Regulation records live in the app bundle or localStorage. The LLM feature adds one optional external call; everything else works offline.
- **The data layer delivers value without the LLM.** Phase 1 (structured records + permit purchase links) is independently useful and builds the foundation that makes Phase 2 safe and accurate.

## Who This Serves

**Primary: The recreational Swiss angler**
Typically 30–60 years old, fishes the Aare, a canton lake, or a mountain stream, holds one or two cantonal permits per year. Comfortable with smartphones but not with navigating bureaucratic cantonal websites in German. Wants to know: "Can I fish here? Do I have the right permit? Where do I buy one?" The regulation assistant answers all three questions in under 10 seconds.

**Secondary: The visiting or multi-canton angler**
Fishes across canton boundaries — a common scenario near the Aare (which flows through Solothurn, Bern, and Aargau) or border lakes like the Bielersee (spanning Bern, Solothurn, and Neuchâtel). Needs to understand which permits apply to which water body and where to buy each one.

**Tertiary: The new angler**
Just getting into fishing and overwhelmed by the compliance complexity. The regulation assistant + permit purchase flow reduces the friction of starting — which is the single biggest drop-off point in angler onboarding.

## Success Criteria

**Phase 1 (Regulation Data Layer):**
- Solothurn and Bern regulation panels show permit purchase links, source citations, and freshness dates
- A canton overview is accessible without selecting a map location
- All regulation data carries an `effectiveYear` and `lastVerified` date
- The app correctly renders all 4 locales (EN/DE/FR/IT) for all new UI strings

**Phase 2 (AI Assistant):**
- A user can type a natural-language fishing regulation question in any of the 4 app languages and receive a cited answer in under 5 seconds
- Every LLM answer cites at least one `sourceUrl` from the curated regulation records
- The app refuses to answer questions outside the fishing regulation domain
- Zero hallucinated regulation facts (enforced by grounding prompt and JSON-mode output)
- API response caching achieves > 50% cache hit rate in week 2, reducing per-user API costs

**Long-term signals:** Reduction in user complaints about "outdated regulation info"; increase in "Laws tab" session depth; permit purchase click-through rate on official portals.

## Scope

**In for Phase 1:**
- `RegulationSource` and `RegulationRecord` TypeScript types
- Curated source registry for Solothurn and Bern (all other cantons retain existing summaries)
- Permit purchase links on canton panels
- Freshness dates on all canton records
- Canton regulations overview on Laws tab
- i18n for all new UI strings (EN/DE/FR/IT)
- "Verify with authority" disclaimer on every regulation panel

**In for Phase 2:**
- `useRegulationAssistant` React hook
- `RegulationAssistant` component (question input, answer display, citation list)
- LLM service abstraction supporting OpenAI (primary) and Anthropic (fallback)
- User-provided API key settings screen
- Answer caching in localStorage (7-day TTL)
- Strict grounding system prompt (citation-only, no hallucination)

**Explicitly out of Phase 1 & 2:**
- Real-time regulation scraping or automated PDF ingestion
- Legal advice or completeness claims
- Backend server or persistent database
- Expanding beyond Solothurn and Bern for enriched records (remaining 24 cantons get Phase 1 treatment in a later sprint)
- Shared API proxy (Phase 3)
- Source change notifications (Phase 4)

## Vision

If KiroFishing executes this well, it becomes the authoritative, trusted compliance companion for Swiss anglers — the app that canton fishing authorities might actually recommend to new permit holders. The regulation data layer scales to cover all 26 cantons with annual update cycles. The AI assistant evolves to handle water-body-specific rules, species-specific questions, and inter-cantonal edge cases. Source change detection notifies users when regulations update, before the season starts. In 2–3 years, the curated regulation registry — if opened to community contributions — becomes a public good for the Swiss fishing community, the way OpenStreetMap is for maps.

The technical foundation for all of this is built in Phase 1. Every step after it is an extension, not a rewrite.

---

## Compliance & Regulatory Note

Swiss fishing regulation data is legally sensitive. The app must never present itself as a legal reference or substitute for official cantonal authority guidance. Every regulation display must include: source citation, freshness date, and the disclaimer "Verify with the official cantonal authority before fishing." Source conflict (when two sources disagree) must be surfaced to the user, not resolved silently. Legal safety is a non-negotiable design constraint, not an afterthought.
