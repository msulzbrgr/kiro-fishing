# 0003 - Use raw Leaflet with dynamic imports for maps

Date: 2026-04-30

Status: Accepted

## Context

The map feature uses Leaflet and OpenStreetMap tiles to let users select Swiss locations and inspect canton-level fishing law information. The codebase includes `react-leaflet`, but the current implementation uses the raw Leaflet API from React effects.

Leaflet depends on browser globals and DOM availability, so importing it eagerly can create issues in build, test, or future server-rendered contexts.

## Decision

Map components will use the raw Leaflet API and load Leaflet with dynamic imports inside React effects.

Map instances and markers will be owned through refs, and map cleanup must remove the Leaflet instance when the component unmounts. `react-leaflet` should not be introduced for new map work unless a future ADR supersedes this decision.

## Consequences

- Map lifecycle stays explicit and aligned with the existing implementation.
- Browser-only Leaflet behavior is isolated to effects that run after the DOM is available.
- Contributors must manage Leaflet cleanup, marker updates, and icon path configuration manually.
- The project avoids mixing declarative `react-leaflet` patterns with imperative raw Leaflet patterns.
