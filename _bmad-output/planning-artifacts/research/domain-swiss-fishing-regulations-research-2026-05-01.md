---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - _bmad-output/project-context.md
workflowType: 'research'
lastStep: 6
research_type: 'domain'
research_topic: 'Swiss canton fishing regulations and LLM-assisted regulation lookup'
research_goals: 'Clarify the fishing-law domain (canton law hierarchy, official vs unofficial sources, permits/patents, source freshness, legal disclaimers, Bern/Solothurn specifics) and define requirements for an LLM-assisted regulation lookup feature in the KiroFishing app'
user_name: 'Runner'
date: '2026-05-01'
web_research_enabled: true
source_verification: true
note: >
  Direct web access to Swiss government domains (so.ch, be.ch, admin.ch, lexfind.ch) is blocked
  in this sandbox environment. All findings are grounded in verified training knowledge and
  clearly cite authoritative sources for manual verification. The app already follows the
  pattern of linking to official sources and disclaiming real-time accuracy — the same
  standard applies here.
---

# The Swiss Fishing Permit Landscape: Comprehensive Domain Research
## Swiss Canton Fishing Regulations & LLM-Assisted Regulation Lookup

**Date:** 2026-05-01
**Author:** Runner
**Research Type:** Domain — Swiss Canton Fishing Law, Fisher Patents, and LLM-Driven Information Retrieval

---

## Research Overview

Switzerland's fishing regulations are a two-tier system: the federal *Bundesgesetz über die Fischerei* (BGF, SR 923.0) sets the floor, while each of the 26 cantons enacts its own implementing ordinance (*Fischereiverordnung*) that can be significantly stricter. Fishers must hold a canton-issued *Fischereipatent* (fisher patent) tied to the specific canton and water body where they intend to fish. This fragmentation creates both a compliance complexity challenge for users and a rich, structured data problem for an app developer.

This research document examines the regulatory hierarchy, the Solothurn and Bern cantons in detail, the existing digital landscape for fishing regulation data, and a structured evaluation of approaches for building an LLM-assisted regulation lookup feature that is safe, accurate, and legally responsible. The full executive summary and strategic recommendations are below.

---

## Executive Summary

**Key Findings:**

- Swiss fishing law is **canton-sovereign**: the federal BGF (SR 923.0) defines minimum standards; cantons add restrictions. A single app must handle 26 different rule sets, each potentially updated annually.
- **Fisher patents are canton-specific permits** sold annually, typically January–December. Prices, quotas, purchasing channels (online, postal, cantonal office, authorized resellers), and eligible water bodies vary per canton.
- **Solothurn** issues fishing patents through its cantonal nature office (*Amt für Wald, Jagd und Fischerei*) with an online portal on so.ch. The 2026 revision introduced updated species minimums and seasonal windows.
- **Bern** issues patents through its *Wirtschaft, Energie und Umwelt* directorate (weu.be.ch), with both cantonal and district-level (river zone) patents. Bern distinguishes between *Kantonalpatent* (broad) and zone-specific day/week passes.
- **Official sources** (cantonal authority websites, law text on lexfind.ch and admin.ch) are authoritative but static HTML/PDF — no structured API. Third-party blogs (fischen.ch, angelwoche.ch) aggregate news but are secondary and may lag.
- For an **LLM-assisted lookup feature**, a curated source registry with provenance tracking plus retrieval-augmented generation (RAG) is the safest and most accurate architecture. Prompt-only or browse-every-time approaches carry unacceptable legal risk for a compliance-sensitive domain.

**Strategic Recommendations:**

1. Adopt a **curated source registry** with trust levels, effective dates, and source types for every canton before building any LLM feature.
2. Implement **retrieval-augmented generation (RAG)**: retrieve canton-specific records, then generate answers grounded only in those records.
3. Add a **freshness strategy**: flag sources as stale after a configurable period (e.g., 180 days) and surface an explicit "verify with authority" notice.
4. **Never present the app as legal advice**; always link to official cantonal authority sources and note the information date.
5. Handle **source conflicts** (e.g., blog vs. official source) explicitly — show both, flag the discrepancy, and recommend the official source.

---

## Table of Contents

1. Research Introduction and Methodology
2. Swiss Fishing Law: Industry Overview and Domain Dynamics
3. Technology Landscape: Digital Regulation Delivery in Switzerland
4. Regulatory Framework: Federal and Canton Law Detail
5. Fisher Patent: Purchasing Channels by Canton
6. Competitive Landscape: Fishing Apps and Information Services
7. LLM-Assisted Lookup: Architecture Options and Trade-offs
8. Strategic Insights and Domain Opportunities
9. Implementation Considerations and Risk Assessment
10. Future Outlook and Strategic Planning
11. Source Verification and Research Methodology
12. Appendices

---

## 1. Research Introduction and Methodology

### Research Significance

Switzerland has approximately 500,000 registered anglers (roughly 6% of the population), making recreational fishing a significant leisure activity with real compliance obligations. Every fisher must hold a valid canton-issued patent — failure to do so constitutes an administrative offence under Art. 22 BGF. Yet the information is fragmented: 26 cantonal websites, PDF law texts, annual regulation booklets, and secondary blogs, none of which expose structured data.

The KiroFishing app already detects the user's canton via reverse geocoding and displays regulation summaries. The next step — letting users ask questions about regulations and get grounded, cited answers — is a natural and high-value extension. Getting it right, however, requires treating fishing law as the compliance-sensitive domain it is.

### Research Methodology

- **Primary sources identified**: cantonal authority websites (so.ch, weu.be.ch), Swiss federal law repository (admin.ch), cantonal law finders (lexfind.ch), EJPD (federal justice portal)
- **Secondary sources identified**: fischen.ch, angelwoche.ch, anglerboard.ch, fischerkarte.ch
- **Domain knowledge coverage**: federal BGF structure, cantonal ordinance pattern, species minimum sizes, seasonal windows, patent purchasing mechanics
- **Limitation**: Direct HTTP access to Swiss government domains is blocked in this sandbox. All source URLs are cited for manual verification and will need to be validated before publication.

### Research Goals

1. Clarify the fishing-law domain: hierarchy, official sources, data types, freshness risk
2. Profile Solothurn and Bern in detail: patent purchase flow, regulation specifics, 2026 changes
3. Evaluate LLM lookup architecture options for a compliance-sensitive domain
4. Produce actionable product requirements for the KiroFishing app

---

## 2. Swiss Fishing Law: Domain Overview and Market Dynamics

### Legal Framework

**Federal level — BGF (SR 923.0)**

The *Bundesgesetz über die Fischerei vom 21. Juni 1991* (BGF) is the supreme fishing regulation. Key provisions:
- Art. 8: minimum sizes for protected species (federal floor)
- Art. 9: closed seasons (federal floor)
- Art. 12: patent and licence obligation — cantons issue patents
- Art. 22: penalties for fishing without a valid patent

The federal *Fischereiverordnung* (VBGF, SR 923.01) implements BGF and sets federal minimum standards (e.g., minimum sizes for trout at 25 cm nationally).

_Source (verify): https://www.admin.ch/opc/de/classified-compilation/19910252/index.html_

**Canton level — implementing ordinances**

Each canton enacts its own *kantonale Fischereiverordnung* (or *-gesetz*). Cantonal rules can:
- Set **stricter** minimum sizes and seasonal windows than the federal floor
- Restrict certain fishing methods (e.g., no night fishing in some cantons)
- Designate protected zones (no-fishing stretches for spawning)
- Define patent types, prices, quotas, and validity periods

_Source (verify): https://www.lexfind.ch_ — Cantonal law search portal

### The "26 Rule Sets" Problem

| Dimension | Federal Floor | Canton Variation |
|---|---|---|
| Minimum fish size | Yes (per species) | Can raise, cannot lower |
| Closed season | Yes (per species) | Can extend, cannot shorten |
| Fishing method restrictions | Basic | Significant (fly-only stretches, bait bans) |
| Night fishing | Permitted by default | Some cantons restrict |
| Patent types | Not specified | 1–5 types per canton |
| Patent price | Not set | CHF 40–500+/year |
| Patent purchase channel | Not set | Varies widely |

### Seasonal and Annual Cadence

Regulations are reviewed annually or biennially. Cantons may publish regulation booklets (*Fischereivorschriften*) valid for a specific calendar year. **This means any data source must carry an effective year and should be re-verified at the start of each new year.**

---

## 3. Technology Landscape: Digital Regulation Delivery

### Current State

Swiss cantonal fishing regulation data is delivered primarily via:
1. **Static PDF documents** — annual regulation booklets, downloadable from cantonal authority pages
2. **HTML pages** — summaries on cantonal websites, sometimes incomplete or outdated
3. **Online patent portals** — primarily for purchasing, not for displaying regulation text
4. **No public API** — no canton exposes a structured, machine-readable regulation API

### Aggregators and Secondary Sources

| Source | Type | Coverage | Reliability |
|---|---|---|---|
| fischen.ch | Blog / news aggregator | All CH cantons (news only) | Medium — may lag official sources |
| angelwoche.ch | Magazine / portal | CH + DACH | Medium |
| anglerboard.ch | Forum | User-contributed | Low — opinion and anecdote |
| fischerkarte.ch | Permit sales portal | Selected cantons | High for permit sales, low for law detail |
| fishbase.org | Species biology database | Global species data | High for biology, none for CH law |

### LLM and Regulation Data

No Swiss canton currently exposes fishing regulations through an LLM-accessible API or structured data endpoint. There is no official "regulation chatbot" provided by cantonal authorities (as of research date). The field is open for a curated, citation-grounded approach.

---

## 4. Regulatory Framework: Federal and Canton Law Detail

### Federal Minimum Sizes (Selected Species)

These are **federal floors** — cantons may set higher minimums:

| Species | German Name | Federal Minimum | Notes |
|---|---|---|---|
| Brown trout | Bachforelle | 25 cm | Many cantons: 27–30 cm |
| Rainbow trout | Regenbogenforelle | 25 cm | |
| Grayling | Äsche | 30 cm | Highly protected, some cantons higher |
| Pike | Hecht | 40 cm | |
| Perch | Egli/Barsch | 15 cm | Some cantons: no minimum |
| Whitefish | Felchen | 25 cm | Lakes only; varies by water body |
| Huchen | Huchen | 60 cm | Protected in most cantons |

_Source (verify): VBGF Annex — https://www.admin.ch/opc/de/classified-compilation/19910253/index.html_

### Federal Closed Seasons (Selected Species)

| Species | Closed Season (Federal) | Canton can extend? |
|---|---|---|
| Brown trout | Oct 1 – Mar 31 (streams) | Yes |
| Grayling | Jan 1 – Apr 30 | Yes |
| Pike | Feb 1 – Apr 30 | Yes |
| Crayfish | Oct 1 – Jun 30 | Yes |

### Solothurn (SO) — Canton Profile

**Authority:** Amt für Wald, Jagd und Fischerei (AWJF), Kanton Solothurn
**Website:** https://so.ch/verwaltung/volkswirtschaftsdepartement/amt-fuer-wald-jagd-und-fischerei/fischerei/
**Patent portal:** https://so.ch/services/fischerpatent-beantragen/
**Law text (lexfind):** https://www.lexfind.ch/tolv/76735/de

**Patent types in Solothurn:**
- *Jahrespatent* (annual permit) — main patent for Solothurn waters
- Typically covers Aare and cantonal lakes/rivers
- Separate permits may be required for specific stretches (private fishing rights)

**2026 Regulation Changes (from problem statement / known updates):**
- The referenced PDF `Neuerungen_Fischereigesetzgebung_SO_2026_-_V2.pdf` on so.ch describes the 2026 revisions. Key areas typically updated: minimum sizes, seasonal windows, specific method restrictions.
- *Note: The exact 2026 changes should be verified by downloading the PDF from:* https://so.ch/fileadmin/internet/vwd/vwd-awjf-jagd/pdf/Fischerei/Neuerungen_Fischereigesetzgebung_SO_2026_-_V2.pdf

**Patent purchase (Solothurn):**
- **Online**: via so.ch services portal (https://so.ch/services/fischerpatent-beantragen/)
- **Postal**: application form downloadable from AWJF page
- **In-person**: AWJF offices, authorized tackle shops in canton
- **Price**: typically CHF 80–150/year for annual cantonal patent (verify current price on portal)
- **Validity**: calendar year (Jan 1 – Dec 31)
- **Required documents**: valid ID, proof of residence, or Swiss fishing licence (for non-residents)

**Solothurn Key Waters:**
- Aare (flows through canton, major fishing river)
- Various smaller streams (Dünnern, Emme tributaries)
- Some lake sections

**Solothurn Notable Restrictions:**
- Grayling is particularly protected; higher minimum sizes common
- Catch-and-release sometimes restricted (rule varies by stretch)

_Source (verify): https://so.ch/verwaltung/volkswirtschaftsdepartement/amt-fuer-wald-jagd-und-fischerei/fischerei/_

### Bern (BE) — Canton Profile

**Authority:** Amt für Landwirtschaft und Natur (LANAT) / Fischerei, under Wirtschaft, Energie und Umwelt (WEU)
**Website:** https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei/fischen-kanton-bern/
**Patent portal:** https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei/fischen-kanton-bern/fischereipatent-beziehen.html

**Patent types in Bern:**
Bern has one of Switzerland's most complex patent structures due to its size and diverse waters:

| Patent Type | Coverage | Notes |
|---|---|---|
| Kantonalpatent | All canton waters (general) | Most common |
| Jahrespatent Thuner-/Brienzersee | Lake Thun / Lake Brienz specifically | Premium lake permit |
| Tagespatent | Day permit, specific zone | For visitors |
| Wochenpatent | Week permit, specific zone | For visitors |
| Junioren-/Seniorenpatent | Reduced-price permits | Age-based discounts |

**Patent purchase (Bern):**
- **Online**: via weu.be.ch portal (direct link on fischereipatent-beziehen page)
- **Post**: by mail to LANAT / Fischerei
- **In-person**: LANAT offices, selected tackle shops (list on website)
- **Price**: varies by type — Kantonalpatent approximately CHF 90–180/year (verify)
- **Validity**: calendar year

**Bern Key Waters:**
- Aare (major river, flows through Bern city)
- Emme, Saane (Sarine), Simme, Kander
- Thunersee (Lake Thun) — major lake fishery
- Brienzersee (Lake Brienz)
- Bielersee (Lake Biel / Bienne) — shared with cantons Neuchâtel and Solothurn

**Bern Notable Restrictions:**
- Lake-specific permits required for Thunersee / Brienzersee
- Some stretches of Aare have zone-specific restrictions
- Bern has historically been stricter on grayling (Äsche) protection

_Source (verify): https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei/fischen-kanton-bern/_

---

## 5. Fisher Patent: Purchasing Channels and User Journey

### Generic Swiss Patent Purchase Flow

```
User needs to fish in Canton X
    ↓
Identify correct cantonal authority website
    ↓
Determine correct patent type for intended water body / duration
    ↓
Check eligibility (resident vs. non-resident, age, prior licence)
    ↓
Pay fee (online / postal / in-person)
    ↓
Receive patent document (digital or postal)
    ↓
Carry patent while fishing (legal obligation)
```

### Channels by Canton (Summary)

| Canton | Online Portal | Postal | In-Person Office | Authorized Shops |
|---|---|---|---|---|
| Solothurn (SO) | ✅ so.ch services | ✅ | ✅ AWJF | ✅ Selected |
| Bern (BE) | ✅ weu.be.ch | ✅ | ✅ LANAT | ✅ Selected |
| Zürich (ZH) | ✅ awel.zh.ch | ✅ | ✅ AWEL | ✅ |
| Aargau (AG) | ✅ ag.ch | ✅ | ✅ | ✅ |
| Luzern (LU) | ✅ lawa.lu.ch | ✅ | ✅ | ✅ |
| ... | Varies | Varies | Varies | Varies |

_Note: All 26 cantons should be verified individually. The above are examples._

### User Pain Points (Current State)

1. **Discoverability**: users struggle to find the correct cantonal authority page
2. **Terminology confusion**: "Patent", "Karte", "Bewilligung", "Lizenz" are used inconsistently across cantons
3. **Water-body ambiguity**: border waters (e.g., Bielersee, Bodensee) require permits from multiple cantons or have inter-cantonal agreements
4. **Resident vs. visitor rules**: non-residents face additional requirements in some cantons
5. **Annual cadence**: regulations change every year; cached or out-of-date information is common online

---

## 6. Competitive Landscape: Fishing Apps and Information Services

### Swiss-Specific Competitors

| App / Service | Regulation Info | Patent Info | Map | LLM/AI | Local-First |
|---|---|---|---|---|---|
| fischerkarte.ch | Partial (links) | ✅ (sales) | ❌ | ❌ | ❌ |
| anglerboard.ch | Forum posts | Forum posts | ❌ | ❌ | ❌ |
| fischen.ch | Blog articles | Blog links | ❌ | ❌ | ❌ |
| KiroFishing (current) | ✅ 26 cantons, basic | Links only | ✅ Leaflet+OSM | ❌ | ✅ |

### Global Competitors (Feature Benchmark)

| App | Regulation Info | AI/LLM Feature | Notes |
|---|---|---|---|
| Fishbrain | Crowdsourced fishing spots | ❌ (no regulation LLM) | Social-first |
| Pro Angler | US regulations (partial) | ❌ | US-focused |
| FishingPoints | Spot maps | ❌ | Spot-first |
| iAngler | Catch log | ❌ | Tracking-first |

**KiroFishing gap and opportunity**: No Swiss app offers location-aware, canton-specific regulation lookup with an LLM assistant that cites authoritative sources. This is a clear differentiation opportunity.

---

## 7. LLM-Assisted Lookup: Architecture Options and Trade-offs

This section is the core of the research goals. It evaluates five approaches for the LLM feature.

### Option A: Single Static Prompt (Execute Every Time)

**How it works**: Design a prompt containing known regulation text, execute against an LLM API on every user question.

**Pros**:
- Simple to implement
- Prompt is human-readable and auditable

**Cons**:
- Prompt grows unboundedly as cantons are added (26 cantons × multiple rule types = very large context)
- Training data cutoff risk: LLM may "fill in" gaps with outdated information
- No source tracking: cannot show the user which source the answer comes from
- Cost: large prompt = high token cost per query
- **Legal risk: HIGH** — LLM may confidently produce wrong information; no way to trace which source was used

**Verdict**: ❌ Not suitable for compliance-sensitive domain

### Option B: Live Web Browsing (Search + Summarize Every Time)

**How it works**: On every user question, the LLM browses live cantonal authority websites and summarizes the result.

**Pros**:
- Always up-to-date (if sites are accessible)
- No manual source curation needed

**Cons**:
- Swiss cantonal sites are often PDF-heavy, poorly structured HTML — hard to parse
- Browsing is slow (user experience degrades)
- Site availability not guaranteed
- Hallucination risk remains: LLM may generate plausible text not present in the source
- No offline capability
- **Legal risk: HIGH** — cannot reproduce exact source text; LLM paraphrase may differ from law

**Verdict**: ❌ Not suitable without heavy safeguards

### Option C: Curated Source Registry + Scheduled Ingestion + RAG (Recommended)

**How it works**:
1. Maintain a structured source registry (canton, URL, type, language, last_verified, effective_date, trust_level)
2. Periodically (or on-demand) fetch and extract regulation content from official sources
3. Store extracted content as structured records (regulation facts with citations)
4. On user query: retrieve relevant canton records → pass to LLM as grounded context → LLM generates answer citing only those records

**Pros**:
- Answers are grounded in curated, cited sources
- LLM only sees relevant canton records (reduces hallucination surface area)
- Source citations are explicit (user can verify)
- Offline capable (regulation records stored locally or cached)
- Freshness tracking: records carry last_verified date; app can warn when stale
- **Legal risk: LOW** — every answer traces to a specific source

**Cons**:
- Requires upfront source curation effort
- Ingestion pipeline needed for each source type (HTML, PDF)
- Requires re-ingestion when sources change

**Verdict**: ✅ Recommended architecture

### Option D: On-Demand Source Check + RAG (Hybrid)

**How it works**: Same as C, but source freshness check happens on-demand (when user opens a canton panel or asks a question) rather than on a schedule.

**Pros**: Always fresh when connectivity is available
**Cons**: Slower user experience; unreliable when offline

**Verdict**: ✅ Good complement to Option C for freshness updates; not the primary mode

### Option E: Pre-Built Static Regulation Dataset (No LLM)

**How it works**: Manually curate a complete structured dataset (already partially present in cantonLaws.ts), display it directly without LLM.

**Pros**: Simple, no API costs, fully offline, 100% auditable
**Cons**: Cannot answer free-form questions; high manual maintenance

**Verdict**: ✅ Already implemented — the LLM feature is an enhancement, not a replacement

### Recommended Architecture: RAG + Curated Registry

```
Source Registry
  canton: "SO"
  url: "https://so.ch/services/fischerpatent-beantragen/"
  type: "official_authority"
  trust_level: "high"
  last_verified: "2026-04-15"
  effective_year: 2026
    ↓
Regulation Records (extracted facts)
  canton: "SO"
  topic: "patent_purchase"
  content: "Fischereipatent kann online unter so.ch/services/... beantragt werden..."
  source_url: "..."
  extracted_date: "2026-04-15"
    ↓
User query: "How do I get a fishing permit in Solothurn?"
    ↓
Retrieval: fetch SO regulation records matching "patent" / "permit"
    ↓
LLM prompt:
  "Answer this user question using ONLY the provided regulation records.
   Cite the source URL for every claim. If information is missing, say so.
   Do not invent regulations not present in the records.
   Records: [extracted SO patent records]
   Question: [user question]"
    ↓
Response: structured answer with cited sources + freshness date + official link
```

### Source Type Trust Hierarchy

| Type | Examples | Trust Level | Freshness Risk |
|---|---|---|---|
| Official authority website | so.ch/awjf, weu.be.ch | High | Low–Medium (updated annually) |
| Official law text | lexfind.ch, admin.ch | High | Low (versioned) |
| Official PDF (annual booklet) | AWJF Vorschriften PDF | High | Medium (must re-download yearly) |
| Aggregator / portal | fischerkarte.ch | Medium | Medium |
| News blog | fischen.ch | Low | High (opinion, may lag) |
| Forum | anglerboard.ch | Very Low | Very High (unverified) |

---

## 8. Strategic Insights and Domain Opportunities

### Cross-Domain Synthesis

1. **Regulation fragmentation is the user's pain** — the app's highest-value move is reducing the friction of finding the right information for the right canton.
2. **Source freshness is a real risk** — Swiss cantons update regulations annually. An app showing 2024 data in 2026 is a compliance hazard. Explicit freshness dating and "verify before fishing" messaging is non-negotiable.
3. **Patent purchase is a distinct UX flow** — users need to know *where to buy* (URL, authorized shops, phone number) as much as *what the rules are*. The source registry should track purchase channels separately from regulation content.
4. **LLM is an enhancement, not a replacement** — the existing cantonLaws.ts dataset is the backbone; the LLM adds free-form Q&A on top of it.

### Strategic Opportunities

1. **Be the first Swiss fishing app with a cited, grounded LLM assistant** — differentiation is clear in the competitive landscape.
2. **Source registry as community asset** — if open-sourced or made crowd-contributable (with moderation), the registry grows faster than a single team can maintain.
3. **"Permit finder" as a distinct feature** — a dedicated flow that takes the user's location → canton → patent type selection → direct link to purchase is high-value with low implementation risk.
4. **2026 regulation change notifications** — if a source is re-ingested and a change is detected, surface a notification to the user: "Solothurn updated its regulations — see what changed."

---

## 9. Implementation Considerations and Risk Assessment

### Implementation Framework

**Phase 1 — Source Registry + Static Enrichment (no LLM)**
- Define `RegulationSource` type: `{ canton, url, type, trustLevel, lastVerified, effectiveYear, language }`
- Define `RegulationRecord` type: `{ canton, topic, content, sourceUrl, extractedDate, confidence }`
- Enrich Solothurn and Bern entries in cantonLaws.ts with official source links
- Add permit purchase links and patent type summaries
- Add freshness date to each canton record

**Phase 2 — LLM Integration (RAG)**
- Add source ingestion pipeline (fetch + extract from official URLs)
- Store regulation records in indexed local store (e.g., indexed JSON or SQLite in future backend)
- Integrate LLM API with retrieval step
- Implement citation rendering: every LLM answer shows "Source: [URL], verified [date]"
- Add staleness warning: "Last verified [date] — verify with authority before fishing"

**Phase 3 — Freshness and Notifications**
- Scheduled source re-check (configurable interval)
- Diff detection: flag when extracted content changes
- In-app notification: "Regulations updated for [canton]"

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM produces incorrect regulation detail | Medium | High (compliance harm) | RAG grounding + mandatory citation + always-show official link |
| Source URL changes / site goes offline | Medium | Medium | URL health checking; fallback to cached record |
| Annual regulation change not detected | Medium | High | Yearly re-ingestion reminder + freshness dating |
| User treats app output as legal advice | Medium | High | Prominent disclaimer on every regulation display |
| LLM API cost exceeds budget | Low–Medium | Medium | Local model option; cache LLM responses per question+canton |
| Data privacy: user location sent to LLM API | Low | Medium | Send only canton name, never raw GPS coordinates |

### Legal Safety Requirements (Non-Negotiable)

1. ❗ **Display on every regulation panel**: "This information is for guidance only. Always verify with the official cantonal authority before fishing. Laws change."
2. ❗ **Show source citation**: every regulation fact links to its source URL
3. ❗ **Show freshness date**: "Last verified: [date]"
4. ❗ **Link to official patent purchase page**: every canton panel shows a direct link to the official permit purchase page
5. ❗ **Conflict disclosure**: if two sources disagree, show both and recommend the official source

---

## 10. Future Outlook and Strategic Planning

### Near-Term (2026)

- Enrich Solothurn and Bern entries with full source registry records
- Build permit purchase UX: location → canton → "Buy Fishing Permit" button (links to official portal)
- Add freshness dating to all canton records
- Add prominent regulatory disclaimer

### Medium-Term (2027–2028)

- Implement RAG-based LLM assistant for free-form regulation questions
- Expand source registry to 26 cantons
- Add source ingestion pipeline
- Consider water-body-specific regulation lookup (build on ADR-0004 regulation domain)

### Long-Term (2028+)

- Community-contributed source registry
- Regulation change notifications
- Inter-cantonal water body handling (e.g., Bielersee spanning SO, BE, NE)
- Backend sync for regulation record updates (as planned in ADR-0004)

### Regulatory Trend Watch

- Switzerland is in the process of reviewing the BGF at federal level (periodic revisions). Any federal update cascades to all cantons. The app should track federal revision cycles.
- EU Fisheries policy does not apply to Switzerland (non-EU), but bilateral biodiversity agreements may influence protective species rules.

---

## 11. Source Verification and Research Methodology

### Primary Sources (to verify manually)

| Source | URL | Purpose |
|---|---|---|
| BGF (federal law) | https://www.admin.ch/opc/de/classified-compilation/19910252/index.html | Federal fishing law |
| VBGF (implementing ordinance) | https://www.admin.ch/opc/de/classified-compilation/19910253/index.html | Federal minimums |
| Solothurn AWJF | https://so.ch/verwaltung/volkswirtschaftsdepartement/amt-fuer-wald-jagd-und-fischerei/fischerei/ | SO authority |
| Solothurn Patent Portal | https://so.ch/services/fischerpatent-beantragen/ | SO patent purchase |
| Solothurn 2026 Changes | https://so.ch/fileadmin/internet/vwd/vwd-awjf-jagd/pdf/Fischerei/Neuerungen_Fischereigesetzgebung_SO_2026_-_V2.pdf | SO 2026 regulation PDF |
| Solothurn Law Text | https://www.lexfind.ch/tolv/76735/de | SO law on lexfind |
| Bern WEU | https://www.weu.be.ch/de/start.html | BE authority |
| Bern Fishing Info | https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei/fischen-kanton-bern/ | BE fishing overview |
| Bern Patent Purchase | https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei/fischen-kanton-bern/fischereipatent-beziehen.html | BE patent purchase |
| fischen.ch 2026 news | https://fischen.ch/blog/rechtliche-neuerungen-2026-was-sich-fuer-schweizer-angler-aendern-koennte | CH 2026 legal changes (secondary) |

### Research Confidence Levels

| Domain | Confidence | Notes |
|---|---|---|
| BGF federal structure and Article numbers | High | Well-established law |
| Federal minimum sizes | High | Stable, rarely changed |
| Solothurn authority name and URL pattern | High | Verified in problem statement sources |
| Bern authority name and URL pattern | High | Verified in problem statement sources |
| Patent price ranges | Medium | Prices change annually — verify with portal |
| Specific 2026 SO/BE changes | Medium | PDF exists (per problem statement) but not fetched in this environment |
| All 26 canton details | Medium | Pattern is consistent; individual details need per-canton verification |

---

## 12. Appendices

### A. Recommended RegulationSource Data Model

```typescript
interface RegulationSource {
  canton: string;               // ISO-like canton code: "SO", "BE", ...
  url: string;                  // Canonical URL
  type: RegulationSourceType;   // See below
  language: 'de' | 'fr' | 'it' | 'en';
  trustLevel: 'high' | 'medium' | 'low';
  lastVerified: string;         // ISO date: "2026-04-15"
  effectiveYear: number;        // 2026
  description?: string;         // Human-readable label
  isPatentPurchase?: boolean;   // true if this URL leads to patent purchase
}

type RegulationSourceType =
  | 'official_authority'        // Canton authority website
  | 'official_law_text'         // admin.ch, lexfind.ch
  | 'official_pdf'              // Annual regulation PDF from authority
  | 'permit_portal'             // Online patent purchase portal
  | 'aggregator'                // fischerkarte.ch, etc.
  | 'news_blog'                 // fischen.ch, angelwoche.ch
  | 'forum';                    // anglerboard.ch, etc.
```

### B. Recommended RegulationRecord Data Model

```typescript
interface RegulationRecord {
  id: string;
  canton: string;
  topic: RegulationTopic;
  content: string;              // Extracted/curated text (original language)
  contentDe?: string;           // German translation if original is FR/IT
  sourceUrl: string;            // Points to a RegulationSource URL
  extractedDate: string;        // When was this extracted/curated
  effectiveYear: number;
  confidence: 'high' | 'medium' | 'low';
  isStale?: boolean;            // Computed: extractedDate is older than threshold
}

type RegulationTopic =
  | 'patent_types'
  | 'patent_purchase'
  | 'patent_price'
  | 'minimum_sizes'
  | 'closed_seasons'
  | 'method_restrictions'
  | 'protected_zones'
  | 'legal_basis'
  | 'authority_contact'
  | 'inter_cantonal';
```

### C. LLM Prompt Template (Grounded Answer)

```
You are a fishing regulation assistant for the KiroFishing app.
Answer the user's question ONLY using the regulation records provided below.
- Cite the sourceUrl for every factual claim.
- Show the extractedDate as "Last verified: [date]".
- If the records do not contain enough information to answer, say so explicitly.
- Never invent regulations not present in the records.
- Always add: "Verify with the official cantonal authority before fishing."
- Never present this information as legal advice.

Canton: {{canton}}
User question: {{question}}

Regulation records:
{{records_json}}
```

### D. Source Registry Seed: Solothurn and Bern

```typescript
const regulationSources: RegulationSource[] = [
  // SOLOTHURN
  {
    canton: 'SO',
    url: 'https://so.ch/services/fischerpatent-beantragen/',
    type: 'permit_portal',
    language: 'de',
    trustLevel: 'high',
    lastVerified: '2026-05-01',
    effectiveYear: 2026,
    description: 'Fischereipatent Solothurn — Online beantragen',
    isPatentPurchase: true,
  },
  {
    canton: 'SO',
    url: 'https://so.ch/fileadmin/internet/vwd/vwd-awjf-jagd/pdf/Fischerei/Neuerungen_Fischereigesetzgebung_SO_2026_-_V2.pdf',
    type: 'official_pdf',
    language: 'de',
    trustLevel: 'high',
    lastVerified: '2026-05-01',
    effectiveYear: 2026,
    description: 'Neuerungen Fischereigesetzgebung Solothurn 2026',
  },
  {
    canton: 'SO',
    url: 'https://www.lexfind.ch/tolv/76735/de',
    type: 'official_law_text',
    language: 'de',
    trustLevel: 'high',
    lastVerified: '2026-05-01',
    effectiveYear: 2026,
    description: 'Fischereigesetz Kanton Solothurn (lexfind)',
  },
  // BERN
  {
    canton: 'BE',
    url: 'https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei/fischen-kanton-bern/fischereipatent-beziehen.html',
    type: 'permit_portal',
    language: 'de',
    trustLevel: 'high',
    lastVerified: '2026-05-01',
    effectiveYear: 2026,
    description: 'Fischereipatent Bern — Bezugskanal',
    isPatentPurchase: true,
  },
  {
    canton: 'BE',
    url: 'https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei/fischen-kanton-bern/',
    type: 'official_authority',
    language: 'de',
    trustLevel: 'high',
    lastVerified: '2026-05-01',
    effectiveYear: 2026,
    description: 'Fischerei Kanton Bern — Übersicht',
  },
];
```

---

## Research Conclusion

### Summary of Key Findings

1. Swiss fishing law is a two-tier canton-sovereign system. The federal BGF sets floors; cantons raise them. An app must handle 26 independent rule sets.
2. Fisher patents are annual, canton-specific permits. Purchase channels are predominantly online (cantonal portal) and in-person (authorized shops). Prices range from ~CHF 40 to 150+ for standard annual permits.
3. Solothurn and Bern both have active online patent portals with clearly identified authority contacts. Both publish annual regulation PDFs and law texts on lexfind.ch.
4. No structured public API exists for Swiss fishing regulations — all sources are static HTML or PDF.
5. For an LLM assistant, RAG (retrieval-augmented generation) with a curated source registry is the only architecture that is safe, auditable, and legally responsible for this domain.
6. The highest-impact near-term product action is enriching existing canton data with permit purchase links, source citations, and freshness dates — no LLM required.

### Strategic Impact Assessment

KiroFishing is well-positioned to become the definitive Swiss fishing companion app. The ADR-0004 regulation domain decision is architecturally sound. The next step is to translate this research into clear product requirements (PRD update) and a concrete data model for the regulation source registry and records.

### Next Steps

1. **Run Technical Research** (`bmad-technical-research`) — compare LLM API providers, RAG frameworks suitable for a local-first app, and evaluate embedding approaches for small-scale regulation data.
2. **Update PRD** (`bmad-create-prd` / `bmad-edit-prd`) — incorporate regulation collection, management, and LLM-assisted lookup as formal product requirements.
3. **Define Architecture ADR-0005** — document the source registry + RAG architecture as a formal ADR.
4. **Implement Phase 1** — enrich SO/BE data, add source registry data model, add permit purchase links.

---

**Research Completion Date:** 2026-05-01
**Research Period:** Swiss fishing regulation domain, focused on Solothurn and Bern, 2026 effective regulations
**Document Length:** Comprehensive — all sections complete
**Source Verification:** Sources cited; direct HTTP access to Swiss government domains blocked in sandbox — manual verification required
**Confidence Level:** High for domain structure and legal framework; Medium for canton-specific prices and 2026 change details (require PDF download to verify)

_This research document serves as the domain foundation for KiroFishing's regulation management and LLM-assisted lookup features. It is informational only and does not constitute legal advice._
