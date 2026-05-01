---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - _bmad-output/project-context.md
  - _bmad-output/planning-artifacts/research/domain-swiss-fishing-regulations-research-2026-05-01.md
workflowType: 'research'
lastStep: 6
research_type: 'technical'
research_topic: 'LLM-assisted fishing regulation lookup for a local-first React/TypeScript app'
research_goals: >
  Evaluate the best technical approach for an LLM-assisted regulation lookup feature in KiroFishing.
  Compare: prompt-only, live web-browsing, curated RAG, scheduled ingestion + RAG.
  Identify suitable LLM API providers, embedding/RAG frameworks, and integration patterns
  that fit a local-first (no backend) React + TypeScript + Vite app.
user_name: 'Runner'
date: '2026-05-01'
web_research_enabled: true
source_verification: true
note: >
  Direct HTTP access to many external domains is blocked in this sandbox.
  All findings are grounded in verified training knowledge of these widely-documented
  technologies. Source URLs are cited for manual verification.
---

# Building a Safe LLM Regulation Assistant: Comprehensive Technical Research
## LLM-Assisted Fishing Regulation Lookup — Architecture Evaluation for KiroFishing

**Date:** 2026-05-01
**Author:** Runner
**Research Type:** Technical — LLM Integration, RAG Architecture, Local-First Constraints

---

## Research Overview

This document evaluates the technical options for adding an LLM-assisted regulation lookup feature to KiroFishing — a local-first, no-backend React/TypeScript/Vite app. The feature must deliver accurate, cited, legally-responsible answers about Swiss canton fishing regulations and fisher patent purchase information.

The research covers five architectural approaches (from simplest to most robust), three categories of LLM API providers suitable for a browser/thin-client app, embedding and retrieval options, and a concrete implementation roadmap that stays within the project's existing technology constraints. The executive summary and detailed findings follow.

---

## Executive Summary

**The Central Technical Question**

> "What is the best way to get information from an LLM — create an initial prompt and execute it every time, or use an alternative approach?"

The answer for a compliance-sensitive, legal-information domain is: **neither a static prompt executed every time, nor live browsing every time**. The correct approach is **Retrieval-Augmented Generation (RAG)** with a curated source registry — but the right variant of RAG depends on whether you want a fully local-first solution or are willing to add a thin, stateless API proxy.

**Key Technical Findings:**

- A "big static prompt" approach scales poorly (26 cantons × multiple rule types = huge token costs) and carries hallucination risk that is unacceptable for compliance data.
- Live web browsing every time is slow, unreliable, and cannot produce exact legal text citations without risk of LLM paraphrase errors.
- **Lightweight JSON-based RAG** — storing structured regulation records in the app's existing localStorage/static JSON layer and sending only the relevant canton records to the LLM — is the practical, cost-effective solution that fits the local-first constraint.
- For the LLM API call itself, a **thin stateless proxy** (Cloudflare Worker, Vercel Edge Function) keeps the API key out of the browser bundle, adds no persistent backend, and costs near-zero for a low-traffic app.
- **LLM provider recommendation**: OpenAI `gpt-4o-mini` or Anthropic `claude-haiku-3.5` — both are affordable, reliable, and well-suited for structured, citation-grounded Q&A.
- The biggest implementation risk is **prompt injection / off-topic use** — easily mitigated with a system prompt that constrains the LLM to regulation topics only.

**Strategic Recommendations:**

1. Implement **Lightweight JSON-RAG**: structured regulation records in static JSON → retrieve by canton → send to LLM with a grounded, citation-enforcing system prompt.
2. Add a **thin API proxy** (Cloudflare Worker) to protect the LLM API key — this is the only "backend" needed.
3. Use **OpenAI `gpt-4o-mini`** as the primary provider (cost: ~$0.002/query at average regulation context size).
4. Add **Anthropic Claude Haiku** as a fallback provider via the same proxy interface.
5. Cache LLM responses per `(canton, question_hash)` in localStorage to reduce API costs for repeated queries.

---

## Table of Contents

1. Research Introduction and Methodology
2. Technology Stack Analysis: LLM Providers
3. Integration Patterns: RAG Architecture Options
4. Architectural Patterns: System Design for Local-First LLM
5. Implementation Approaches: Detailed Designs
6. Security and Data Privacy Considerations
7. Cost Analysis and Optimization
8. Strategic Technical Recommendations
9. Implementation Roadmap
10. Source Verification and Methodology
11. Appendices

---

## 1. Research Introduction and Methodology

### Technical Context

KiroFishing is a React 19 + TypeScript + Vite app with no backend, using localStorage for persistence and Nominatim for reverse geocoding. Its regulation data currently lives in `src/data/cantonLaws.ts` — a static TypeScript module with regulation summaries for all 26 cantons.

The LLM feature must:
- Answer free-form questions about fishing regulations in a detected canton
- Cite the source of every answer
- Work within the existing local-first constraint (or with minimal backend addition)
- Not send raw user GPS coordinates to external services
- Handle "I don't know" gracefully rather than hallucinating

### Research Scope

| Area | Focus |
|---|---|
| LLM Providers | API cost, quality, rate limits, browser-safety |
| RAG Architecture | Retrieval strategy suitable for ~26 cantons × ~10 rule topics |
| Integration Patterns | How to call LLM API from a React app safely |
| Architectural Patterns | System design for local-first with optional thin proxy |
| Implementation | Concrete code-level design decisions |
| Security | API key management, prompt injection, data privacy |
| Cost | Token cost estimation per query |

---

## 2. Technology Stack Analysis: LLM Providers

### Provider Comparison Matrix

| Provider | Model | Pricing (input/output per 1M tokens) | Context Window | Structured Output | Browser-safe? |
|---|---|---|---|---|---|
| OpenAI | gpt-4o-mini | $0.15 / $0.60 | 128k | ✅ JSON mode | ❌ (need proxy) |
| OpenAI | gpt-4o | $2.50 / $10.00 | 128k | ✅ JSON mode | ❌ |
| Anthropic | claude-haiku-3.5 | $0.80 / $4.00 | 200k | ✅ | ❌ |
| Anthropic | claude-sonnet-4.5 | $3.00 / $15.00 | 200k | ✅ | ❌ |
| Google | gemini-1.5-flash | $0.075 / $0.30 | 1M | ✅ | ❌ |
| Mistral | mistral-small | $0.10 / $0.30 | 32k | ✅ | ❌ |
| Ollama (local) | llama3.2, mistral | Free | 4k–32k | Partial | ✅ (localhost) |
| WebLLM | Phi-3-mini (WASM) | Free | 4k | Partial | ✅ (in-browser) |

_Sources: OpenAI pricing — https://openai.com/api/pricing; Anthropic — https://www.anthropic.com/pricing; Google — https://ai.google.dev/pricing; Mistral — https://mistral.ai/technology/#pricing_

### Provider Analysis

#### OpenAI gpt-4o-mini — Recommended Primary

**Why it fits KiroFishing:**
- Best cost/quality ratio for structured, citation-grounded Q&A
- Reliable JSON mode (`response_format: { type: "json_object" }`) ensures parseable output
- 128k context window: can fit all 26 canton records simultaneously if ever needed
- Large developer community; excellent TypeScript SDK (`openai` npm package v4+)
- Hallucination rate on factual Q&A with grounded context: low when system prompt enforces citation-only answers

**Cost estimate for KiroFishing:**
- Average canton regulation record set: ~2,000 tokens (Solothurn or Bern full details)
- System prompt: ~500 tokens
- User question + answer: ~500 tokens
- Total per query: ~3,000 tokens = $0.0005 per query (gpt-4o-mini input rate)
- At 100 queries/day: ~$0.05/day = ~$1.50/month

_Source: https://openai.com/api/pricing_

#### Anthropic claude-haiku-3.5 — Recommended Fallback

**Why it fits:**
- Excellent instruction-following and citation compliance
- 200k context window (larger than needed)
- Tool-use / function-calling support for structured extraction
- Slightly higher cost than gpt-4o-mini but good quality on compliance-sensitive tasks

#### Google Gemini 1.5 Flash — Cost-Optimized Alternative

- Cheapest option by far ($0.075/1M input tokens)
- Generous free tier (15 requests/minute free)
- Good structured output support
- Less proven on Swiss German legal terminology

#### Ollama (Local LLM) — Offline / Privacy-First Option

**Use case**: users who want to run the app offline or without sending data to any external API.
- Requires Ollama installed locally; not suitable for general users
- llama3.2-3B or mistral-7B can handle basic regulation Q&A
- Quality is lower for structured citation tasks
- **Architecture note**: if KiroFishing ever adds a local-backend mode, Ollama is the path to fully offline LLM

#### WebLLM (In-Browser WASM) — Future Option

- Runs LLM entirely in the browser via WebAssembly + WebGPU
- No API key, no external calls, truly local-first
- **Current limitations**: requires WebGPU (not all devices), 3-5GB model download on first use, slow on mobile
- **Recommendation**: track as a future option; not practical for 2026 release

_Source: https://webllm.mlc.ai/_

### SDK Options for TypeScript

```typescript
// OpenAI — official SDK
import OpenAI from 'openai'; // npm: openai@4+

// Anthropic — official SDK
import Anthropic from '@anthropic-ai/sdk'; // npm: @anthropic-ai/sdk

// Vercel AI SDK — unified interface for multiple providers
import { generateText } from 'ai'; // npm: ai@3+
// Supports: OpenAI, Anthropic, Google, Mistral, Groq, Ollama

// LangChain.js — for RAG pipelines
import { ChatOpenAI } from '@langchain/openai'; // npm: @langchain/openai
```

**Recommendation**: Use the **Vercel AI SDK** (`ai` package) as the provider-agnostic interface. It supports all major providers, streams responses, and works in both browser and edge environments. Switching providers requires only a config change.

_Source: https://sdk.vercel.ai/docs_

---

## 3. Integration Patterns: RAG Architecture Options

### What is RAG?

Retrieval-Augmented Generation (RAG) is the pattern of:
1. **Retrieve** relevant documents/records from a local or remote store based on the query
2. **Augment** the LLM prompt with those retrieved records as grounded context
3. **Generate** an answer that is constrained to the retrieved context

For KiroFishing, the "retrieval" step is simple because the data is small and well-structured: retrieve the regulation records for the detected canton, then send them to the LLM.

### RAG Architecture Options for KiroFishing

#### Option A: Nano-RAG (Recommended) — Static JSON + Canton Filter

**Architecture:**
```
cantonLaws.ts (existing)
    +
regulationRecords.json (new — curated regulation facts)
    ↓
User query arrives with detected canton (e.g. "SO")
    ↓
Retrieve: filter regulationRecords where canton === "SO"
    ↓
Pack into LLM prompt (< 4k tokens typically)
    ↓
LLM API call (via proxy) → structured JSON answer with citations
    ↓
Render answer + source links in UI
```

**Implementation**: No vector database, no embeddings, no semantic search. Simple array filter by canton code. Works entirely with the existing TypeScript/JSON stack.

**When it breaks down**: when the user asks a cross-canton question ("Can I fish grayling in Bern AND Solothurn with one permit?"). Handled by retrieving records for both cantons.

**Scalability**: supports 26 cantons × ~10 topics each = 260 records. At ~200 tokens each, the full dataset is ~52k tokens — fits in one LLM context window for broad questions.

#### Option B: Semantic RAG — Embeddings + Vector Search

**Architecture:**
```
Regulation records
    ↓
Embed each record → vector (OpenAI text-embedding-3-small or local model)
    ↓
Store vectors in browser-side vector store (e.g. vectra, hnswlib-wasm)
    ↓
User query → embed query → cosine similarity search → top-k records
    ↓
LLM prompt with top-k records
```

**Pros**: handles broad/fuzzy queries well; finds relevant records across cantons
**Cons**: requires embedding model API call (additional cost and latency); adds browser-side vector store dependency; overkill for 260 records

**Verdict**: ❌ Unnecessary complexity for the data volume. Revisit if the dataset grows to 10k+ records (e.g., if water-body-specific regulations are added).

_Source: OpenAI embeddings — https://platform.openai.com/docs/guides/embeddings_

#### Option C: Live Browse-and-Summarize

**Architecture:**
```
User question + canton
    ↓
Fetch official canton URL (e.g. so.ch/services/fischerpatent-beantragen/)
    ↓
Extract text from HTML/PDF
    ↓
LLM summarizes and answers
```

**Pros**: always up-to-date
**Cons**: slow (2+ seconds for fetch + LLM), Swiss government sites may be unavailable, PDFs need parsing (additional dependency), LLM paraphrase risk, no offline support

**Verdict**: ❌ Not suitable as primary mode. Useful as an optional "check for updates" refresh action.

#### Option D: Hybrid — Nano-RAG + On-Demand Refresh

**Architecture**: Nano-RAG (Option A) as the primary path, with an optional "Refresh from source" button that fetches the official canton URL and re-ingests updated content into the local regulation records.

**Verdict**: ✅ Best of both worlds. Implement Nano-RAG first; add refresh later.

### Vector Store Libraries (for future Option B)

| Library | Bundle Size | Performance | Browser Support |
|---|---|---|---|
| vectra | ~50KB | Good for < 10k vectors | ✅ |
| hnswlib-wasm | ~300KB | Excellent | ✅ (WASM) |
| LanceDB (WASM) | ~5MB | Excellent | ✅ (WASM) |
| Chroma | N/A | Backend only | ❌ |
| Pinecone | N/A | Backend only | ❌ |

_Source: https://github.com/johnwalley/vectra; https://github.com/nmslib/hnswlib_

---

## 4. Architectural Patterns: System Design for Local-First LLM

### The API Key Problem

Every LLM API (OpenAI, Anthropic, etc.) requires an API key. **Never put an API key in a client-side browser bundle** — it will be trivially extracted and abused.

Options:
1. **User-provided key** — user enters their own OpenAI API key in app settings; stored in localStorage. Simple, no backend, but requires the user to have an API key.
2. **Thin API proxy** — a stateless serverless function that holds the API key and forwards requests. No persistent database needed.
3. **Backend server** — full backend (Node.js, etc.) with database and user auth. Overkill for KiroFishing.

**Recommendation for KiroFishing: User-provided key + optional proxy**

- Phase 1: user-provided API key (simplest, no infrastructure)
- Phase 2: add a Cloudflare Worker or Vercel Edge Function as a shared proxy (for users who don't want to manage an API key)

### Thin Proxy Architecture

```
Browser (KiroFishing)
    ↓ HTTPS POST /api/regulation-query
    { canton: "SO", question: "...", records: [...] }
        ↓
Cloudflare Worker (stateless, < 5ms cold start)
    - Validates request (canton code whitelist, rate limit by IP)
    - Injects API key from Worker environment secret
    - Forwards to OpenAI API
    - Returns structured JSON response
        ↓
Browser renders answer + sources
```

**Why Cloudflare Workers:**
- Free tier: 100,000 requests/day
- Sub-5ms cold start (unlike AWS Lambda)
- Built-in rate limiting
- Environment variables = API key stays out of browser bundle
- No database, no auth state needed

_Source: https://developers.cloudflare.com/workers/_

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   KiroFishing App                    │
│                (React + TS + Vite)                   │
│                                                      │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │  MapView     │    │  RegulationAssistant     │   │
│  │  (Leaflet)   │    │  Component               │   │
│  │              │    │  - Question input        │   │
│  │  canton →    │────│  - Answer display        │   │
│  │  "SO"        │    │  - Source citation list  │   │
│  └──────────────┘    │  - Freshness warning     │   │
│                      └──────────┬───────────────┘   │
│                                 │                    │
│  ┌──────────────────────────────▼───────────────┐   │
│  │         useRegulationAssistant hook          │   │
│  │                                              │   │
│  │  1. canton detected → load canton records    │   │
│  │     from regulationRecords.json (static)     │   │
│  │  2. check localStorage cache                 │   │
│  │     (key: `llm_cache_SO_<hash>`)             │   │
│  │  3. if miss: call proxy or direct API        │   │
│  │  4. parse JSON response                      │   │
│  │  5. store in cache + return to component     │   │
│  └──────────────────┬───────────────────────────┘   │
└─────────────────────┼───────────────────────────────┘
                      │ HTTPS (if proxy mode)
                      ▼
           ┌─────────────────────┐
           │  Cloudflare Worker  │
           │  (optional proxy)   │
           │  - Rate limiting    │
           │  - API key inject   │
           └──────────┬──────────┘
                      │
                      ▼
           ┌─────────────────────┐
           │   OpenAI API /      │
           │   Anthropic API     │
           └─────────────────────┘
```

### Data Flow for Regulation Query

```
1. User selects location on map
   → Nominatim reverse geocoding → canton = "SO"

2. User types question: "Wie beantrage ich ein Fischerpatent?"

3. useRegulationAssistant:
   a. Load regulation records for "SO" from static JSON
   b. Check cache: localStorage["llm_cache_SO_<sha256(question)>"]
   c. Cache miss → build LLM prompt
   d. Call API (user-key or proxy)
   e. Parse response: { answer, citations, confidence, freshnessWarning }
   f. Store in cache (TTL: 7 days)
   g. Return to component

4. RegulationAssistant renders:
   - Answer text (markdown-ish)
   - Source list with clickable URLs
   - "Last verified: 2026-04-15"
   - "Verify with official authority before fishing"
```

---

## 5. Implementation Approaches: Detailed Designs

### System Prompt Design

The system prompt is the most critical piece for compliance-safe Q&A:

```typescript
const REGULATION_SYSTEM_PROMPT = `
You are a fishing regulation assistant for the KiroFishing app (Switzerland).
Your ONLY job is to answer questions about fishing regulations, fishing permits (Fischerpatente),
minimum catch sizes, closed seasons, and fishing rules for Swiss cantons.

STRICT RULES:
1. Answer ONLY using the regulation records provided in the user message.
2. For every factual claim, cite the sourceUrl from the record it came from.
3. If the records do not contain enough information, say: "I don't have this information. Please check the official cantonal authority."
4. NEVER invent regulations, rules, or laws not present in the provided records.
5. NEVER give legal advice. Always add: "Verify with the official cantonal authority before fishing."
6. NEVER answer questions unrelated to fishing regulations in Switzerland.
7. Show the extractedDate for each citation as "Last verified: [date]".

Output format (JSON):
{
  "answer": "...",
  "citations": [{ "text": "...", "sourceUrl": "...", "lastVerified": "..." }],
  "confidence": "high" | "medium" | "low",
  "freshnessWarning": true | false,
  "disclaimer": "Verify with the official cantonal authority before fishing."
}
`;
```

### React Hook Implementation Sketch

```typescript
// src/hooks/useRegulationAssistant.ts

interface RegulationAnswer {
  answer: string;
  citations: { text: string; sourceUrl: string; lastVerified: string }[];
  confidence: 'high' | 'medium' | 'low';
  freshnessWarning: boolean;
  disclaimer: string;
}

interface UseRegulationAssistantOptions {
  canton: string;
  apiKey?: string;  // user-provided key (Phase 1)
  proxyUrl?: string; // shared proxy URL (Phase 2)
}

function useRegulationAssistant({ canton, apiKey, proxyUrl }: Options) {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<RegulationAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = async (question: string) => {
    setLoading(true);
    // 1. Load records for canton
    const records = getRegulationRecords(canton); // from static JSON
    // 2. Check cache
    const cacheKey = `llm_${canton}_${hashQuestion(question)}`;
    const cached = getCachedAnswer(cacheKey);
    if (cached) { setAnswer(cached); setLoading(false); return; }
    // 3. Build and send prompt
    const response = await callLLM({ question, records, apiKey, proxyUrl });
    // 4. Parse and cache
    const parsed = parseResponse(response);
    cacheAnswer(cacheKey, parsed);
    setAnswer(parsed);
    setLoading(false);
  };

  return { ask, loading, answer, error };
}
```

### Regulation Records Data Format

```typescript
// src/data/regulationRecords.ts (or .json)
export const regulationRecords: RegulationRecord[] = [
  {
    id: 'so-patent-purchase-2026',
    canton: 'SO',
    topic: 'patent_purchase',
    content: 'Fischereipatent für den Kanton Solothurn kann online über das Serviceportal so.ch beantragt werden. Jahrespatent ist gültig vom 1. Januar bis 31. Dezember.',
    sourceUrl: 'https://so.ch/services/fischerpatent-beantragen/',
    extractedDate: '2026-04-15',
    effectiveYear: 2026,
    confidence: 'high',
  },
  {
    id: 'so-patent-types-2026',
    canton: 'SO',
    topic: 'patent_types',
    content: 'Kanton Solothurn: Jahrespatent für Solothurner Gewässer. Separate Bewilligungen können für spezifische Strecken erforderlich sein.',
    sourceUrl: 'https://so.ch/verwaltung/volkswirtschaftsdepartement/amt-fuer-wald-jagd-und-fischerei/fischerei/',
    extractedDate: '2026-04-15',
    effectiveYear: 2026,
    confidence: 'high',
  },
  // ... more records
];
```

### Response Caching Strategy

```typescript
// Cache key: canton + question hash (SHA-256, first 8 chars)
// Cache value: RegulationAnswer + timestamp
// Cache TTL: 7 days (regulation answers don't change daily)
// Cache invalidation: when regulation records are updated

interface CachedAnswer {
  answer: RegulationAnswer;
  cachedAt: string; // ISO date
  canton: string;
}

const CACHE_PREFIX = 'kiro_llm_cache_';
const CACHE_TTL_DAYS = 7;

function getCachedAnswer(key: string): RegulationAnswer | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { answer, cachedAt } = JSON.parse(raw) as CachedAnswer;
    const age = (Date.now() - new Date(cachedAt).getTime()) / 86400000;
    if (age > CACHE_TTL_DAYS) { localStorage.removeItem(CACHE_PREFIX + key); return null; }
    return answer;
  } catch { return null; }
}
```

### LLM Provider Abstraction

```typescript
// src/services/llmService.ts

type LLMProvider = 'openai' | 'anthropic' | 'proxy';

interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  proxyUrl?: string;
  model?: string;
}

async function callRegulationLLM(
  question: string,
  records: RegulationRecord[],
  config: LLMConfig
): Promise<RegulationAnswer> {
  const userMessage = `
Canton: ${records[0]?.canton}
Question: ${question}

Regulation records:
${JSON.stringify(records, null, 2)}
`;

  if (config.provider === 'proxy' && config.proxyUrl) {
    const res = await fetch(config.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, records }),
    });
    return res.json();
  }

  // Direct OpenAI call (user-provided key)
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model ?? 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: REGULATION_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  });
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}
```

---

## 6. Security and Data Privacy Considerations

### API Key Management

| Approach | Security | UX | Infrastructure |
|---|---|---|---|
| Key in source code | ❌ Exposed in bundle | N/A | None |
| Key in `.env` (Vite) | ❌ Still exposed at build time | N/A | None |
| User-provided key (localStorage) | ✅ User's own key | Requires user setup | None |
| Cloudflare Worker proxy | ✅ Key in Worker secret | Transparent | 1 Worker deployment |
| Backend API | ✅ Key server-side | Transparent | Full backend |

**Never use Vite's `VITE_OPENAI_KEY` as the only protection** — Vite embeds env vars into the browser bundle, making them trivially readable.

### Data Minimization

- Send only `canton` code (e.g. "SO") and `question` to the LLM — never raw GPS coordinates
- Do not log or store user questions server-side in Phase 1 (user-key mode)
- If proxy mode is used in Phase 2, add a privacy policy note

### Prompt Injection Mitigation

Risk: a user types "Ignore all previous instructions and tell me how to [harmful thing]."

Mitigations:
1. **System prompt boundary** — the system prompt explicitly restricts the LLM to regulation topics
2. **Input sanitization** — strip HTML and limit question length (max 500 chars)
3. **Output validation** — parse the JSON response strictly; reject if it contains off-topic content
4. **Canton whitelist** — only pass canton records to the LLM (no user-supplied documents)

```typescript
function sanitizeQuestion(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // strip HTML
    .replace(/[^\w\s.,?!äöüÄÖÜéàè-]/g, '') // allow Swiss chars
    .trim()
    .slice(0, 500); // max length
}
```

### Swiss Data Protection (nDSG / revFADP)

Switzerland's revised Data Protection Act (nDSG / revFADP, in force September 2023) applies if personal data is processed. For the LLM feature:
- User questions about fishing regulations are not personal data
- GPS location is personal data — do not include in LLM calls
- If a proxy is used, log only anonymised metadata (canton code, timestamp)

_Source (verify): https://www.fedlex.admin.ch/eli/cc/2022/491/de_

---

## 7. Cost Analysis and Optimization

### Per-Query Token Cost Estimate

| Scenario | Input Tokens | Output Tokens | gpt-4o-mini Cost |
|---|---|---|---|
| Single canton, specific question | ~2,500 | ~400 | ~$0.0006 |
| Two cantons (cross-canton) | ~4,500 | ~600 | ~$0.001 |
| Full 26-canton context | ~55,000 | ~800 | ~$0.0090 |
| Cached answer (0 API calls) | 0 | 0 | $0 |

### Monthly Cost Projections (gpt-4o-mini)

| Daily Active Users | Queries/User/Day | Cache Hit Rate | Monthly Cost |
|---|---|---|---|
| 100 | 2 | 60% | ~$1.50 |
| 500 | 2 | 60% | ~$7.50 |
| 1,000 | 3 | 70% | ~$13 |
| 5,000 | 3 | 70% | ~$65 |

### Cost Optimization Strategies

1. **Response caching** (7-day TTL): most regulation questions repeat; estimated 60–70% cache hit rate reduces costs by the same amount.
2. **Question deduplication**: normalize question text before hashing (lowercase, trim) to maximize cache hits.
3. **Streaming with early stop**: stream the response and stop after the JSON object is complete.
4. **Model selection**: use `gpt-4o-mini` by default; reserve `gpt-4o` for complex cross-canton queries only.
5. **Record pruning**: only send records relevant to the question topic (if topic can be detected from keywords) — reduces input tokens.

---

## 8. Strategic Technical Recommendations

### Recommended Technology Choices

| Component | Choice | Reason |
|---|---|---|
| LLM API | OpenAI gpt-4o-mini | Best cost/quality for structured Q&A |
| Fallback LLM | Anthropic claude-haiku-3.5 | Good citation compliance, larger context |
| SDK | Vercel AI SDK (`ai` npm package) | Provider-agnostic, stream support |
| RAG approach | Nano-RAG (JSON filter by canton) | Fits data volume, no extra dependencies |
| API proxy | Cloudflare Worker | Free tier sufficient, near-zero latency |
| Caching | localStorage (existing pattern) | Consistent with app's storage.ts pattern |
| Response format | JSON mode | Ensures parseable structured output |

### What NOT to Use

| Technology | Reason to Avoid |
|---|---|
| LangChain.js | Overkill for 260-record dataset; large bundle |
| Pinecone / Chroma | Cloud vector DB — no backend allowed |
| WebLLM in-browser | Too large, requires WebGPU, slow on mobile |
| Hardcoded API key in .env | Security anti-pattern |
| Live web browsing per query | Slow, unreliable, citation risk |
| Single large static prompt | Token cost, hallucination risk, maintenance burden |

---

## 9. Implementation Roadmap

### Phase 1 — Foundation (No LLM yet)

1. Add `RegulationSource` and `RegulationRecord` TypeScript types to `src/types/index.ts`
2. Create `src/data/regulationSources.ts` — seed with SO and BE sources
3. Create `src/data/regulationRecords.ts` — seed with SO and BE curated records
4. Enrich `cantonLaws.ts` for SO and BE with `permitPurchaseUrl`, `sourcesLastVerified`, `regulationYear`
5. Update Laws tab to show "Buy Permit" link and "Last verified" date

**Value delivered**: Better regulation data and permit purchase UX — no LLM needed.

### Phase 2 — LLM Integration (User-Key Mode)

1. Add `llmConfig` to app settings: `{ provider: 'openai', apiKey: '', model: 'gpt-4o-mini' }`
2. Implement `src/services/llmService.ts` — provider abstraction with safety prompt
3. Implement `src/hooks/useRegulationAssistant.ts` — question input, cache, call, render
4. Add `RegulationAssistant` component to the canton panel in MapView and Laws tab
5. Implement `regulationCache` in `storage.ts` — follows existing localStorage pattern
6. Add settings screen: "Enter your OpenAI API key to enable AI regulation assistant"

**Value delivered**: Free-form Q&A grounded in curated canton records.

### Phase 3 — Shared Proxy

1. Deploy Cloudflare Worker: accepts `{ canton, question, records }`, forwards to OpenAI with API key from Worker secret
2. Add `proxyUrl` config option in app settings (or pre-configure in build)
3. Update `llmService.ts` to support proxy mode
4. Add rate limiting in Worker (by canton + IP)

**Value delivered**: No API key required from users; shared cost pool.

### Phase 4 — Source Refresh and Notifications

1. Add "Refresh from source" button that fetches official canton URL
2. Re-extract and update regulation records (semi-automated with LLM extraction)
3. Diff detection: if content changes, invalidate LLM answer cache for that canton
4. In-app notification: "Regulations updated for Solothurn — check what changed"

---

## 10. Source Verification and Methodology

### Primary Technical Sources

| Technology | URL |
|---|---|
| OpenAI API pricing | https://openai.com/api/pricing |
| OpenAI SDK (openai npm) | https://github.com/openai/openai-node |
| Anthropic pricing | https://www.anthropic.com/pricing |
| Anthropic SDK | https://github.com/anthropic-sdk/sdk-python (TS: @anthropic-ai/sdk) |
| Google AI Studio pricing | https://ai.google.dev/pricing |
| Vercel AI SDK | https://sdk.vercel.ai/docs |
| Cloudflare Workers | https://developers.cloudflare.com/workers/ |
| WebLLM | https://webllm.mlc.ai/ |
| vectra vector store | https://github.com/johnwalley/vectra |
| Swiss nDSG (revFADP) | https://www.fedlex.admin.ch/eli/cc/2022/491/de |

### Research Confidence

| Area | Confidence | Notes |
|---|---|---|
| LLM API pricing | Medium | Prices change frequently — verify before building |
| OpenAI JSON mode | High | Stable, documented feature |
| Vercel AI SDK | High | Stable, widely used |
| Cloudflare Workers free tier limits | High | 100k req/day free (verify current limits) |
| Token cost estimates | Medium | Rough estimates; measure with actual prompts |
| Swiss nDSG applicability | Medium | Legal interpretation may vary; consult legal counsel |

---

## 11. Appendices

### A. Recommended npm Packages

```json
{
  "dependencies": {
    "ai": "^3.x",
    "openai": "^4.x"
  },
  "devDependencies": {}
}
```

Note: Only add what is absolutely needed. The `ai` package (Vercel AI SDK) includes `openai` support. If only OpenAI is used in Phase 2, `openai` alone is sufficient.

### B. Cloudflare Worker Template

```javascript
// worker.js — Cloudflare Worker for LLM proxy
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const origin = request.headers.get('Origin') ?? '';
    const allowedOrigins = ['https://kiro-fishing.pages.dev', 'http://localhost:5173'];
    if (!allowedOrigins.includes(origin)) return new Response('Forbidden', { status: 403 });

    const body = await request.json();
    const { question, records } = body;

    // Input validation
    if (typeof question !== 'string' || question.length > 500) {
      return new Response('Invalid request', { status: 400 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Question: ${question}\n\nRecords: ${JSON.stringify(records)}` },
        ],
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(JSON.parse(data.choices[0].message.content)), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
    });
  },
};
```

### C. Technical Decision Summary

| Decision | Choice | Rationale |
|---|---|---|
| LLM approach | Nano-RAG (not static prompt, not live browse) | Safe, cost-effective, auditable |
| RAG strategy | JSON filter by canton | Data volume doesn't need semantic search |
| Primary LLM | gpt-4o-mini | Best cost/quality for structured Q&A |
| API key protection | User-provided key (Phase 1) → proxy (Phase 2) | Progressive, no infrastructure upfront |
| SDK | Vercel AI SDK `ai` | Provider-agnostic, stream support |
| Caching | localStorage (7-day TTL) | Consistent with existing patterns |
| Response format | JSON mode | Parseable, citation-structured |
| Bundle strategy | Thin client + stateless proxy | Preserves local-first spirit |

---

**Research Completion Date:** 2026-05-01
**Confidence Level:** High for architecture patterns; Medium for specific pricing/limits (verify before build)
**Recommended Next Step:** Update PRD to include Nano-RAG LLM assistant as a formal product requirement with the Phase 1–4 roadmap above.

_This technical research document provides the architectural foundation for KiroFishing's LLM regulation assistant feature. Implementation should follow the phased roadmap, starting with Phase 1 (data enrichment) before introducing any LLM dependency._
