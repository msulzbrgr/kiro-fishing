# 0002 - Keep KiroFishing local-first in the browser

Date: 2026-04-30

Status: Accepted

## Context

KiroFishing currently stores fishing sessions, catches, weather conditions, water conditions, and regulation snapshots in browser `localStorage`. The app has no backend service and is built as a React, TypeScript, and Vite web application.

This keeps the app simple to run, avoids account management, and supports personal fishing logs without introducing server-side data ownership or privacy concerns.

## Decision

KiroFishing will remain local-first and browser-only until a feature explicitly requires server-side coordination.

Session data will continue to be persisted locally, with import/export used for backup and transfer. UI state should stay in React component state unless shared state becomes large enough to justify a dedicated state-management decision.

## Consequences

- Users can run the app without signing in or connecting to a backend owned by the project.
- Privacy risk is reduced because personal fishing records remain on the user's device by default.
- Cross-device sync, collaboration, live notifications, and server-verified regulation updates are out of scope until a future ADR introduces backend services.
- Storage size, backup, and migration concerns must be handled carefully because browser storage is the system of record.
