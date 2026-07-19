# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for KiroFishing.

ADRs document important architectural choices, the context behind them, and the consequences for future development. They are intentionally concise and should be updated by adding new records rather than rewriting history.

## Records

- [0001 - Use Architecture Decision Records](0001-use-architecture-decision-records.md)
- [0002 - Keep KiroFishing local-first in the browser](0002-local-first-browser-application.md)
- [0003 - Use raw Leaflet with dynamic imports for maps](0003-raw-leaflet-dynamic-imports.md)
- [0004 - Treat fishing regulations as a dedicated domain](0004-dedicated-regulation-domain.md)
- [0005 - Use OSM tiles and Canvas API for story image export](0005-osm-tiles-and-canvas-for-story-export.md)

## Status values

- `Proposed` - Under discussion and not yet adopted.
- `Accepted` - Adopted and expected to guide implementation.
- `Deprecated` - No longer recommended, but retained for context.
- `Superseded` - Replaced by a newer ADR.

## Template

New records should follow this structure:

```markdown
# NNNN - Title

Date: YYYY-MM-DD

Status: Proposed | Accepted | Deprecated | Superseded by ADR-NNNN

## Context

What forces, constraints, or problem led to this decision?

## Decision

What architectural choice are we making?

## Consequences

What becomes easier, harder, or constrained because of this decision?
```
