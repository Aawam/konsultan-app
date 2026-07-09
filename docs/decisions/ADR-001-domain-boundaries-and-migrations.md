# ADR-001: Keep Domain Logic Out Of Route Handlers

## Status

Accepted

## Date

2026-07-09

## Context

The PRD requires strict separation between commercial project data and technical
RAB/AHSP workflows. The current app uses Next.js Route Handlers for API
endpoints and Supabase for persistence/RLS. Some route handlers had started to
own validation, payload mapping, and direct table mutations.

That is acceptable for prototypes, but it is risky for this app because the same
rules must be enforced across UI, API, RLS/RPC, import, export, and future role
expansion.

## Decision

Route handlers stay thin. Domain validation moves to `lib/validations/*`.
Server-side data access and mutations move to `lib/actions/*`. SQL that is
intended as an ordered schema change belongs in `supabase/migrations/*`; SQL in
`docs/` remains audit, seed, verification, or deployment reference material.

## Alternatives Considered

### Keep Logic In Route Handlers

- Pros: Fast for small endpoints.
- Cons: Duplicates validation, hides domain rules in transport code, and makes
  import/export reuse harder.
- Rejected because RAB/AHSP rules need to be reused outside HTTP handlers.

### Create A Full Feature-Package Structure

- Pros: Strongest domain isolation.
- Cons: Large refactor against a small app with many existing changes.
- Deferred until the current `lib/actions` and `components/*` boundaries become
  insufficient.

## Consequences

- New API work should first look for an existing action/validation module.
- Route handlers should be short and easy to review.
- Database migration promotion becomes explicit instead of accidental.
