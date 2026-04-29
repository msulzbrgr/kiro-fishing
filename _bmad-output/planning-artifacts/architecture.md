---
stepsCompleted: [1]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/project-context.md
workflowType: 'architecture'
project_name: 'kiro-fishing'
user_name: 'Runner'
date: '2026-04-29'
requestedStructure: 'arc42'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. The final architecture content will use the arc42 document structure and cover frontend modularization plus backend-ready modularization for user management, live updates/notifications, weather and water service adapters, and a dedicated regulation/law bounded context with versioned persistence, provenance, and adapters for canton, water-body, and species-specific regulatory sources._

## Accepted Architecture Context Refinement

- **Regulation & Law Domain:** Canton fishing laws, minimum sizes, permits, closed seasons, species restrictions, and water-body-specific rules are a dedicated domain. They must be encapsulated separately from map rendering and session tracking.
- **Temporal Persistence:** Regulations change over time, so the architecture must support versioned regulation records with validity periods, source URLs, retrieval/update timestamps, and historical lookup.
- **Domain Boundary:** UI components such as `MapView` should not directly own regulation lookup rules. They should ask a regulation/law service or module for applicable rules based on canton, water body, species, date, and location.
- **Future Backend Readiness:** The regulation domain should be designed so it can start as local/static data but later move to persisted storage or backend synchronization without rewriting UI components.
- **Legal Data Provenance:** Since regulation data can affect real-world compliance, each rule should preserve its source, jurisdiction, effective period, and confidence/update status.
