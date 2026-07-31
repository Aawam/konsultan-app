# Domain Boundaries

Status: active for monitoring; RAB/AHSP application implementation is external.

This app is small enough to stay in a conventional Next.js structure, but the
business domains must remain explicit. Do not treat `app/api/**/route.ts` as the
place for product logic.

## Route Handlers

Route handlers may:

- Check authentication and role gates.
- Read and parse the request body.
- Call one domain action.
- Convert domain results into API responses.

Route handlers must not:

- Own validation rules beyond request shape wiring.
- Build Supabase table payloads directly when the payload belongs to a domain.
- Introduce RAB/AHSP calculation rules into the monitoring application.
- Contain permission logic that should also be enforced in RLS/RPC.

## Domain Actions

`lib/actions/*` owns server-side data access and mutations:

- `lib/actions/proyek.ts`: project queries/mutations and commercial boundary
  shaping.
- `lib/actions/perusahaan.ts`: company records and company-project relations.

## Validation

`lib/validations/*` owns reusable input validation and normalization:

- It should return typed payloads or explicit validation errors.
- It should be testable without Supabase.
- It should be reused by route handlers and server actions when both need the
  same rule.

## External RAB Boundary

This repository must not own RAB/AHSP formulas, imports, exports, or workflow readiness. Historical migrations, generated database types, and dormant database objects do not make RAB part of the active application domain.

Future reintegration must start from an explicit versioned contract with the separate RAB project. Do not restore the retired source as an implicit integration path. `proxy.ts` keeps old URLs fail-closed until that contract is accepted.

## UI Components

- `components/ui/*` is for shadcn-style primitives and generic helpers only.
- Domain UI belongs in `components/proyek/*` or `components/database/*`.
- Do not add AHSP/RAB/proyek-specific behavior to `components/ui/*`.

## Database Scripts

- `supabase/migrations/*` is for ordered runnable migrations.
- `docs/*.sql` is for audits, seed scripts, deployment notes, and historical
  SQL references unless explicitly copied into a migration.
