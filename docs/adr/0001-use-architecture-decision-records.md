# 0001 - Use Architecture Decision Records

Date: 2026-04-30

Status: Accepted

## Context

KiroFishing is evolving from a small local-first fishing companion into an application with clearer domain boundaries for session tracking, mapping, internationalisation, and fishing regulation data. Architectural choices need to remain visible so future changes can preserve intent instead of rediscovering old trade-offs.

## Decision

We will record significant architectural decisions as Markdown ADRs under `docs/adr/`.

Each ADR will describe the context, the decision, and the consequences. Existing ADRs should not be edited to change history; later changes should be captured in new ADRs that supersede or amend earlier records.

## Consequences

- Contributors have a stable place to find architectural rationale.
- Future work can reference accepted decisions before introducing incompatible patterns.
- Documentation maintenance becomes part of architectural change.
- Small implementation details should not become ADRs unless they affect long-term structure, dependencies, data ownership, or operational constraints.
