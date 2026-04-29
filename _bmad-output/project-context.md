---
project_name: 'kiro-fishing'
user_name: 'Runner'
date: '2026-04-29'
sections_completed:
  - technology_stack
  - critical_implementation_rules
  - code_patterns
  - competitive_analysis
---

# Project Context for AI Agents — KiroFishing

_This file contains critical rules, patterns, and competitive insights that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Technology | Version | Notes |
|---|---|---|
| React | ^19.2.5 | Use new JSX transform (`react-jsx`), no `import React` needed |
| TypeScript | ~6.0.2 | Strict — `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` |
| Vite | ^8.0.10 | Dev server on 5173, preview on 4173 (used by Playwright) |
| Leaflet | ^1.9.4 | Loaded via **dynamic import** inside `useEffect` to avoid SSR issues |
| react-leaflet | ^5.0.0 | **NOT used** — raw Leaflet API is used via `useRef` and dynamic import |
| i18next | ^26.0.8 | 4 locales: `en`, `de`, `fr`, `it`; key stored as `kiro_fishing_lang` |
| react-i18next | ^17.0.6 | `useTranslation()` hook in every component; no hardcoded UI strings |
| lucide-react | ^1.12.0 | Only icon library — do not add others |
| Playwright | ^1.59.1 | E2E tests only; runs against built preview server on port 4173 |
| ESLint | ^10.2.1 | `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` |

---

## Critical Implementation Rules

### TypeScript
- **Strict mode is enforced**: every variable and parameter must be used; remove unused ones.
- Use `verbatimModuleSyntax`: always write `import type { Foo }` for type-only imports.
- `erasableSyntaxOnly` is enabled — no TypeScript-specific syntax that cannot be erased (no decorators, no `const enum` with `isolatedModules`).
- Target is `es2023` — use modern JS features freely (`at()`, structuredClone, etc.).
- Suppress unavoidable `any` with `// eslint-disable-next-line @typescript-eslint/no-explicit-any` (already done in MapView for raw Leaflet refs).

### Leaflet / Maps
- Leaflet **must be dynamically imported** inside `useEffect` to work in a browser-only context.
- Map container `<div>` must have an explicit `height` style before Leaflet initialises — never rely on CSS alone.
- Clean up the Leaflet map instance in the `useEffect` return: `map.remove(); leafletMapRef.current = null`.
- The `useEffect` that initialises the map must run **only once** (empty deps `[]`) — use refs for everything inside.
- Leaflet icon default paths must be patched (delete `_getIconUrl`, call `L.Icon.Default.mergeOptions`) or icons will be broken in the Vite build.
- Nominatim reverse geocoding: always send `Accept-Language` header; results in German (`de`) by default.
- Never use the `react-leaflet` package — the project uses raw Leaflet imperatively.

### State Management
- **No global state library** — all state is local React (`useState`) lifted to `App.tsx` as needed.
- Session data lives in `localStorage` under key `kiro_fishing_sessions`.
- Language preference stored under `kiro_fishing_lang`.
- All localStorage access is wrapped in `try/catch` (see `storage.ts` pattern).
- IDs are generated via `generateId()` in `utils/storage.ts` — always use this, never `crypto.randomUUID()` directly.

### Internationalisation (i18n)
- **Every visible UI string** must use `const { t } = useTranslation()` — no hardcoded English strings in JSX.
- All 4 locale files (`en.json`, `de.json`, `fr.json`, `it.json`) must be updated together whenever a new key is added.
- i18next interpolation uses `{{variable}}` syntax (e.g., `"{{count}} sessions imported"`).
- The app auto-detects locale from `navigator.language` on first load.

### Component Conventions
- **File naming**: PascalCase for component files (e.g., `MapView.tsx`, `CatchLog.tsx`).
- **One default export per component file** — named exports only for secondary helpers/types.
- Props interfaces are defined locally in each file (not in `types/index.ts`), named `[ComponentName]Props`.
- Internal sub-components live in the same file as the parent (e.g., `SessionCard` inside `SessionList.tsx`).
- All form state uses a single `useState` object pattern with spread updates (`setForm({ ...form, field: value })`).

### CSS & Styling
- **No CSS framework** — plain CSS in `index.css` and `App.css`.
- CSS class names use kebab-case (e.g., `session-card`, `catch-form`, `bottom-nav`).
- Layout is mobile-first; bottom navigation bar is the primary nav pattern.
- Icon sizes: nav icons `22px`, body icons `16–18px`, inline/meta icons `12–16px`.

### Testing
- **Playwright E2E only** — no unit test framework (no Vitest/Jest).
- Tests run against `npm run preview` on port 4173 (built app, not dev server).
- `data-testid` attributes are the primary selector strategy — always add `data-testid` to interactive elements.
- `localStorage.clear()` is called in `beforeEach` via `addInitScript` to ensure test isolation.
- Do not test implementation details — test user-visible behaviour.

### Data / Types
- All domain types are in `src/types/index.ts` — add new domain types there.
- `weight` is stored in **grams** (integer), `length` in **centimetres** (float).
- `FishingLocation` always has `lat`/`lng`; canton fields are optional (only set within Switzerland).
- Sessions default to empty `weather: {}` and `water: {}` objects — never `null`.

---

## Code Organisation

```
src/
  App.tsx               # Root — tab state, session CRUD, nav bar
  components/
    CatchLog.tsx        # Catch add/delete per session
    ConditionsForm.tsx  # Weather + water conditions editor
    DataManager.tsx     # Export / import JSON
    LandingPage.tsx     # Marketing / onboarding page
    LanguageSwitcher.tsx
    MapView.tsx         # Leaflet map + Nominatim + canton law display
    NewSessionForm.tsx  # New session creation
    SessionList.tsx     # Session cards with expand/tabs
  data/
    cantonLaws.ts       # All 26 cantons, fish species list, state→code map
  i18n/
    index.ts            # i18next setup + language detection
    locales/            # en.json, de.json, fr.json, it.json
  types/
    index.ts            # All shared TypeScript interfaces
  utils/
    storage.ts          # localStorage CRUD + export/import helpers
```

---

## Competitive Analysis & Reverse-Engineered Specifications

The following is derived from publicly observable features of **Fishbrain**, **Fishing Spots (Pro Angler)**, and **fishmap.fr** — no code was copied.

### fishmap.fr — Key Map Features Observed

fishmap.fr is a French interactive fishing map. Its distinguishing map features (useful inspiration for kiro-fishing):

1. **Water body layer** — clickable polygons for lakes, rivers, and reservoirs overlaid on the base map, each with metadata (name, type, category).
2. **River categorisation** — Category 1 (salmonid-dominant) vs Category 2 (cyprinid-dominant) shown as distinct visual layers.
3. **Per-water-body regulations panel** — clicking a water body opens a sidebar/panel showing open/closed season dates, allowed methods, and species-specific rules.
4. **AAPPMA (fishing association) boundaries** — administrative overlay showing which local fishing authority governs each zone.
5. **Permit / day-pass info panel** — direct link to purchase permits per zone.
6. **Species filter** — filter the map to show only water bodies where a target species is present.
7. **Offline-capable** — tile caching for field use.
8. **Search by location name** — address/commune search to centre map.

**Applicable to kiro-fishing:** Items 1–4 and 8 map directly to the existing canton-law feature. The water body polygon layer + species filter would be a significant enhancement.

### Fishbrain — Key Features Observed

1. **GPS-tagged catch spots** — users pin catch locations on the map; spots are community-aggregated.
2. **Catch photo attachment** — photo + species + conditions logged together.
3. **Personal statistics dashboard** — total catches, species breakdown, personal bests (length/weight per species), most-fished locations.
4. **Species database** — illustrated cards per species with habitat, behaviour, and recommended bait/lure.
5. **Weather & fish activity forecast** — integrates forecast data to predict feeding windows (premium).
6. **Fishing reports by water body** — crowdsourced recent activity (e.g. "3 catches in the last 7 days").
7. **Social feed** — follow other anglers, like/comment catches.
8. **Trip planner** — plan future trips with target species and water body.

**Applicable to kiro-fishing (local-first, no backend):** Items 1 (save catch coordinates), 3 (statistics dashboard), 4 (species info panel), and 5 (weather forecast integration via open API).

### Fishing Spots (Pro Angler) — Key Features Observed

1. **Bathymetric / depth maps** — underwater topography overlaid on the water body map.
2. **Custom spot markers with icons** — user-placed markers with category icons (good spot, structure, weed bed, etc.).
3. **Offline map tiles** — download region for field use.
4. **Satellite + topo base layers** — switchable map tile sources.
5. **Water temperature layer** — colour-coded temperature overlay sourced from buoy/satellite data.
6. **Moon phase & solunar tables** — time-of-day feeding activity predictions.
7. **Fishing reports / notes per spot** — per-location text notes and photos.

**Applicable to kiro-fishing:** Items 2 (custom spot markers), 4 (switchable tile layers — OSM vs satellite), 6 (moon phase — calculable client-side with no API).

---

## Recommended Feature Backlog (Reverse-Engineered)

Prioritised for a local-first, no-backend, Switzerland-focused app:

### High Value / Low Effort
- **Statistics dashboard** — catches per species, personal bests, sessions per month chart (all computable from `localStorage`).
- **End-session flow** — record `endTime`, compute duration; currently sessions remain "active" indefinitely.
- **Map tile layer switcher** — OSM standard vs OSM humanitarian vs OpenTopoMap (Swiss topo); no API key needed.
- **Moon phase indicator** — display lunar phase on the session date (pure client-side calculation).
- **Catch photo** — attach a photo to a `Catch` (stored as base64 in localStorage or as a blob URL).

### High Value / Medium Effort
- **Water body layer on map** — overlay GeoJSON of Swiss lakes and rivers (`swissTLMRegio` data, CC0 licensed); clickable to show body name.
- **Saved fishing spots** — let users pin and name their own spots (`FishingSpot` type, separate from sessions).
- **Species info panel** — expandable card per Swiss fish species with habitat, legal minimum size, and season.
- **Session statistics / charts** — simple SVG or CSS bar chart for catch history.

### Lower Priority / Higher Effort
- **Weather forecast integration** — Open-Meteo API (free, no key required) to show 7-day forecast for session location.
- **Offline map tile caching** — Service Worker + Cache API to cache OSM tiles for field use.
- **Export to GPX** — export session locations as GPX for use in GPS devices.

---

## Development Commands

```bash
npm run dev          # Vite dev server — http://localhost:5173
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm run preview      # Serve built app — http://localhost:4173
npm run test         # Playwright E2E (requires built app on 4173)
npm run test:ui      # Playwright interactive UI
```
