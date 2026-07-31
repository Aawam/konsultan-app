# ADR-003: Separate RAB Implementation from Project Monitoring

## Status

Accepted

## Date

2026-07-31

## Context

ADR-002 removed RAB/AHSP from the active product, but its route handlers, UI, formulas, imports, exports, and tests still compiled with the monitoring application. That left two potential sources of truth while the calculation model was being completed in the separate RAB project.

The monitoring checkpoint must remain focused on consultant projects and the Owner/Admin and Tenaga Ahli roles. The formula project needs freedom to evolve without coupling unfinished calculation behavior to production monitoring.

## Decision

Remove RAB/AHSP application implementation from this repository: pages, API handlers, UI components, actions, formula/import/export helpers, workflow readiness, and their implementation tests.

Retain only:

- Historical migrations and generated database types.
- Currently surviving dormant database schema/data until a separately reviewed cleanup.
- Database grants and authorization helpers that deny browser roles access.
- `proxy.ts` tombstones that redirect or reject retired URLs.
- A regression guard that prevents the removed implementation paths and RAB readiness logic from returning accidentally.

The pre-separation work is preserved at commit `289cc110658e7a8e86ee6dfb1007f46e67d47dc2` on branch `codex/archive-rab-wip-2026-07-31`.

Any future reintegration must use an explicit, versioned contract from the separate RAB project and satisfy the gates in `docs/prd_alignment_plan.md`.

## Alternatives Considered

### Keep inactive implementation in the production repository

Rejected because dead application code still compiles, expands maintenance and security review scope, and can diverge from the external formula project.

### Delete database schema, data, and migration history now

Rejected because that is a distinct destructive migration requiring its own audit, backup, rollback, and approval. Existing browser-role access remains revoked.

### Remove the old URL controls with the implementation

Rejected because bookmarks and direct requests should fail closed instead of changing behavior silently.

## Consequences

- The production build contains only monitoring routes and handlers.
- This repository no longer defines a RAB/AHSP formula source of truth.
- Historical database artifacts remain visible to maintainers but inaccessible to browser roles.
- Future integration cannot revive deleted local source implicitly; it must adopt a reviewed external contract.
- The archived branch provides a recoverable research snapshot without burdening the active build.
