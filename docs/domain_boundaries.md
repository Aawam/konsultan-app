# Domain Boundaries

Status: active

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
- Duplicate RAB/AHSP calculation rules.
- Contain permission logic that should also be enforced in RLS/RPC.

## Domain Actions

`lib/actions/*` owns server-side data access and mutations:

- `lib/actions/proyek.ts`: project queries/mutations and commercial boundary
  shaping.
- `lib/actions/perusahaan.ts`: company records and company-project relations.
- `lib/actions/ahsp.ts`: AHSP items, AHSP details, master harga, satuan, and
  kategori pekerjaan.
- `lib/actions/rab.ts`: RAB Maker snapshots, assigned project access, and RAB
  read models.

## Validation

`lib/validations/*` owns reusable input validation and normalization:

- It should return typed payloads or explicit validation errors.
- It should be testable without Supabase.
- It should be reused by route handlers and server actions when both need the
  same rule.

## RAB Calculation

RAB calculation rules must remain centralized:

- Database-level recalculation lives in SQL/RPC where persistence is involved.
- TypeScript-only parsing/normalization lives in `lib/rab-maker.ts`.
- UI components may display calculated values, but must not define calculation
  rules that differ from the domain/RPC layer.

## UI Components

- `components/ui/*` is for shadcn-style primitives and generic helpers only.
- Domain UI belongs in `components/proyek/*` or `components/database/*`.
- Do not add AHSP/RAB/proyek-specific behavior to `components/ui/*`.

## Database Scripts

- `supabase/migrations/*` is for ordered runnable migrations.
- `docs/*.sql` is for audits, seed scripts, deployment notes, and historical
  SQL references unless explicitly copied into a migration.
