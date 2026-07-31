# ADR-002: Pause RAB and Focus on Project Monitoring

## Status

Superseded in part by ADR-003

## Date

2026-07-31

## Context

The RAB calculation model is materially more complex than the original estimate. Formula rules, rounding, overhead, profit/margin, tax, AHSP snapshots, and export reconciliation are not yet stable enough to be part of the consultant monitoring product.

Continuing both monitoring and RAB in one delivery stream creates scope pressure and risks presenting unverified calculations as production-ready.

The application already has a useful monitoring core and two required roles:

- Owner/Admin manages projects, supporting reference data, and commercial fields.
- Tenaga Ahli reads technical project data without commercial fields.

## Decision

The active product is limited to consultant project monitoring.

RAB/AHSP navigation and entry points are removed from the active interface. RAB pages redirect to the project list, and RAB/AHSP API surfaces return `404`. Browser-facing Supabase roles also lose table and RPC privileges for the paused domain, and the RAB authorization helpers fail closed. Monitoring completeness is evaluated independently from RAB phase readiness.

At the time of this decision, existing RAB/AHSP source code, tests, migrations, design documents, and surviving database schema/data were retained as paused work. ADR-003 later separated the application implementation while preserving the database history and fail-closed controls.

RAB calculation development continues in a separate project until the formula model is complete and verified. Reintegration requires the gates documented in `docs/prd_alignment_plan.md`.

## Alternatives Considered

### Continue RAB development inside this application

Rejected because the unstable calculation model would keep expanding the active product scope and weaken confidence in both monitoring and RAB.

### Delete all RAB/AHSP implementation

Rejected for now because the existing work contains useful domain research, security controls, tests, and migration history. Deletion can be reconsidered after the external RAB project establishes the replacement contract.

### Hide only the sidebar link

Rejected because direct page and API access would still make RAB an active, undocumented capability.

### Block only Next.js routes

Rejected because an authenticated browser session can call Supabase/PostgREST directly. The pause must also be enforced by database grants and RAB authorization helpers.

## Consequences

- The active UI is smaller and centered on project monitoring.
- Owner/Admin and Tenaga Ahli role boundaries remain.
- Database monitoring contains only project, Dinas/SKPD, and company data.
- Current surviving RAB/AHSP data and schema are preserved, but `anon` and `authenticated` cannot access their tables or RPCs.
- RAB/AHSP code remains a maintenance liability while paused, but it is isolated from users.
- Future RAB integration must use an explicit contract and verified calculation fixtures rather than reviving the current surface implicitly.
