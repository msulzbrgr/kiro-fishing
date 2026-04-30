---
title: 'Canton Regulations Overview'
type: 'feature'
created: '2026-04-30T20:46:02.598+00:00'
status: 'draft'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users need source-backed fishing law and regulation information for Swiss cantons, beginning with Solothurn and Bern, and they need to see the relevant canton details when a selected map location is inside that canton. Users also need an overview view so they can browse available canton regulation information without selecting a map point.

**Approach:** Enrich the existing canton law data model and UI with more complete regulation details for Bern and Solothurn, while preserving the existing all-canton dataset. Add a laws overview section to the current Laws tab that lists available canton records and lets users inspect the same source-backed details as the location-specific map panel.

## Boundaries & Constraints

**Always:** Keep the app local-first with no backend; every visible UI string must use i18n keys in all four locale files; treat in-app regulation content as informational and link users to official sources; keep raw Leaflet usage and existing map behavior intact; start enriched regulation content with Bern and Solothurn.

**Ask First:** Adding third-party APIs, paid data sources, backend scraping, automatic legal document downloads, or claiming legal completeness/real-time legal accuracy requires human approval.

**Never:** Do not remove existing canton records for the other 24 cantons; do not present the app as legal advice; do not add new dependencies unless unavoidable; do not hardcode visible UI strings in JSX.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Location-specific Bern | User selects a map location reverse-geocoded to Canton Bern | The map panel shows Bern fishing regulations, permits, minimum sizes, and official source links | If reverse geocoding fails, keep current no-canton/unknown behavior |
| Location-specific Solothurn | User selects a map location reverse-geocoded to Canton Solothurn | The map panel shows Solothurn fishing regulations, permits, minimum sizes, and official source links | If source details are informational/stale, show official source links for verification |
| Overview browse | User opens the Laws tab without selecting a map point | User can browse an overview of canton regulation records, with enriched Bern and Solothurn entries clearly available | Cantons without enriched details still display their existing summary information |
| Outside Switzerland | User selects a location outside Switzerland | Overview remains available and the map shows the existing non-Swiss-canton warning | No crash and no misleading canton data |

</frozen-after-approval>

## Code Map

- `src/data/cantonLaws.ts` -- central canton law dataset, including Bern/Solothurn entries, source URLs, minimum sizes, and state-to-canton mapping.
- `src/types/index.ts` -- shared `CantonLaw` and related interfaces; extend only if the enriched regulation details require structured fields.
- `src/components/MapView.tsx` -- location-specific canton law display after reverse geocoding detects a Swiss canton.
- `src/App.tsx` -- Laws tab composition; add the overview alongside the existing map.
- `src/i18n/locales/en.json`, `de.json`, `fr.json`, `it.json` -- required translations for any new visible labels.
- `src/index.css` / `src/App.css` -- app styling for any new overview layout.
- `tests/navigation.spec.ts` or new focused E2E spec -- verify Laws tab overview and existing location-specific behavior remains accessible.

## Tasks & Acceptance

**Execution:**
- [ ] `src/types/index.ts` -- add optional structured fields for regulation highlights/source freshness if needed -- supports richer Bern/Solothurn details without breaking existing canton records.
- [ ] `src/data/cantonLaws.ts` -- enrich Bern and Solothurn with official source-backed regulation information -- delivers the requested starting cantons.
- [ ] `src/components/MapView.tsx` -- reuse enriched fields in the location-specific canton panel -- ensures selected Bern/Solothurn locations show the new information.
- [ ] `src/App.tsx` plus a small component if warranted -- add a canton regulations overview to the Laws tab -- supports browsing without a selected location.
- [ ] `src/i18n/locales/*.json` -- add all new UI keys in EN/DE/FR/IT -- preserves localization contract.
- [ ] `src/index.css` / `src/App.css` -- style the overview consistently with current mobile-first patterns -- keeps UI usable.
- [ ] `tests/*.spec.ts` -- cover Laws tab overview and Bern/Solothurn content visibility -- protects the feature from regressions.

**Acceptance Criteria:**
- Given the user opens the Laws tab, when no map location is selected, then an overview of canton regulation information is visible.
- Given the overview is visible, when the user inspects Bern or Solothurn, then the app shows enriched regulation details and official source links for that canton.
- Given a selected map location resolves to Bern or Solothurn, when the canton law panel is displayed, then it includes the enriched details for that canton.
- Given a selected map location is outside Switzerland, when the warning is shown, then the overview remains accessible and no canton-specific information is falsely assigned.
- Given the app is displayed in EN, DE, FR, or IT, when the new overview labels appear, then they are localized through the existing i18n system.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint` -- expected: no lint errors.
- `npm run build` -- expected: TypeScript and Vite production build succeed.
- `npm run test` -- expected: Playwright E2E suite passes after browser installation.
