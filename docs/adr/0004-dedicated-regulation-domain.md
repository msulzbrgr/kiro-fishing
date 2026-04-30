# 0004 - Treat fishing regulations as a dedicated domain

Date: 2026-04-30

Status: Accepted

## Context

Fishing regulation data affects real-world compliance. KiroFishing currently displays canton-level law references and minimum catch sizes, and it also records regulation snapshots and checkpoints on fishing sessions.

Regulations can change over time and may vary by jurisdiction, water body, species, date, and source reliability. Keeping regulation behavior embedded directly in map or session UI components would make it harder to validate, version, and later move to a backend or richer data source.

## Decision

Fishing regulations will be treated as a dedicated domain boundary.

UI components may present regulation information, but regulation lookup, uncertainty handling, snapshots, checkpointing, provenance, and future versioning should be concentrated in dedicated data and utility modules rather than duplicated across components.

## Consequences

- Map and session components can stay focused on interaction and presentation.
- Regulation records can evolve toward versioned, source-aware data without rewriting the UI.
- Future water-body-specific, species-specific, or date-effective rules have a clear architectural home.
- Contributors must preserve source URLs, jurisdiction context, timestamps, and uncertainty state when adding regulation features.
