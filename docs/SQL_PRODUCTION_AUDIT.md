# Production SQL Audit

Audit date: 2026-07-22 (Asia/Makassar)

> Historical deployment record. The active product scope changed on 2026-07-31:
> RAB/AHSP application implementation was separated from this repository under
> `ADR-003-separate-rab-implementation.md`. RAB references below describe the
> audited database state on 2026-07-22, not an active monitoring feature.

## Verdict

The reviewed SQL baseline is deployed to production Supabase project
`lpowysaggivhinnhbnll`. Production was backed up before and after deployment,
all 21 ordered migrations were applied, application roles were bootstrapped,
and the reported `get_proyek_teknis_page` `PGRST202` failure is resolved.

Deployment evidence:

- 21 ordered migrations are aligned in local, staging, and production migration
  history (`20260709090000` through `20260717190000`).
- 19 public tables exist and all 19 have RLS enabled.
- 26 public functions exist; no `SECURITY DEFINER` function has an unsafe
  `search_path`, and no public function is executable by `PUBLIC` or `anon`.
- `rab_draft` and `rab_rekap` are absent.
- `get_proyek_teknis_page(integer,integer,integer,text,text,uuid,text,text)` is
  present with the signature expected by the Tenaga Ahli application;
  `authenticated` can execute it and `anon` cannot.
- A database-level smoke test as `teknis@ypc.com` returned a valid empty page.
- PostgREST returned `42501 permission denied` for an anonymous RPC request,
  proving the schema cache recognizes the function instead of returning
  `PGRST202`.
- `admin@ypc.com` is `owner_admin`; `teknis@ypc.com` is `tenaga_ahli`.
- All seven SQL verification suites pass on production. Data-dependent suites
  used transaction-scoped fixtures that were rolled back; no fixture rows
  remain.
- Application gates pass: 93 tests, TypeScript, and production build. ESLint
  has no errors and three non-blocking unused-function warnings in
  `lib/rab-export.ts`.
- Verified logical backups exist outside the repository for both pre-deploy and
  post-deploy states. The post-deploy backup includes roles, schema, data,
  migration-history schema/data, SHA-256 checksums, two Auth users, two app
  profiles, 19 public tables, and 21 migration-history rows.

## SQL Inventory

There are 48 SQL files:

- 21 files in `supabase/migrations/`: the only production deployment source of
  truth. Run them through the migration workflow, in timestamp order.
- 27 files in `docs/`: verification, audit, historical deployment references,
  dummy seeds, and destructive maintenance scripts. Do not deploy this folder
  wholesale.

### Documentation SQL classification

Low-risk, high-reward verification or audit scripts:

- `DB_AHSP_Import_Replay_Verification.sql`
- `DB_Active_RPC_Hardening_Verification.sql`
- `DB_Audit.sql`
- `DB_Final_SQL_Baseline_Verification.sql`
- `DB_Identity_Workflow_Hardening_Verification.sql`
- `DB_Index_Verification.sql`
- `DB_Legacy_RAB_Retirement_Verification.sql`
- `DB_PRD_Grant_Verification.sql`
- `DB_PRD_RLS_Verification.sql`
- `DB_PRD_Technical_Project_Read_Verification.sql`
- `DB_Paginated_Technical_Project_Read_Verification.sql`
- `DB_RAB_Authorization_Hardening_Verification.sql`
- `DB_Simplification_Audit.sql`

Historical/manual references with drift or duplicate-deployment risk; do not
run in production when migrations are available:

- `DB_Add_Dinas_SKPD.sql`
- `DB_PRD_Core_RLS.sql`
- `DB_PRD_Foundation.sql`
- `DB_PRD_Grants.sql`
- `DB_PRD_Technical_Project_Read.sql`
- `DB_Production_Core_Fix.sql`
- `DB_RAB_Maker_MVP_Functions.sql`
- `DB_RAB_Maker_Snapshot_Model.sql`
- `DB_SUPABASE_DEPLOY.sql`
- `RLS_Policies.sql`

Production-forbidden dummy data scripts:

- `DB_AHSP_Masterfile_Dummy_Seed.sql`
- `DB_Project_Performance_Dummy_Seed.sql`
- `DB_Project_Perusahaan_Dummy_Seed.sql`

Critical destructive scripts; never run as part of normal deployment:

- `DB_Production_Reset_Except_Perusahaan.sql`
- `DB_Simplification_Cleanup.sql`

## Runtime Usage Findings

Confirmed unused legacy objects were retired in migration
`20260717170000_retire_legacy_rab_draft_rekap.sql`:

- table `public.rab_draft`
- table `public.rab_rekap`
- function `public.record_rab_export_history(uuid,text,text,integer)`
- TypeScript accessors and types for the legacy draft/rekap model

The reported Tenaga Ahli `PGRST202` path is active and repaired:

- the application calls `get_proyek_teknis_page` with eight named parameters;
- staging and production expose the matching eight-parameter function;
- regenerated `lib/database.types.ts` contains that signature;
- the pagination verification passes.

Two empty baseline objects have no direct application caller, but are retained
because they are architectural boundaries rather than confirmed dead objects:

- `public.proyek_internal` (0 rows): owner-only commercial/internal project
  boundary. Removing it would discard the planned separation of sensitive
  fields.
- `public.rab_maker_sections` (0 rows, 0 item references): optional future RAB
  grouping layer. It is still referenced by the `rab_maker_items.section_id`
  foreign key and protected by the active RAB RLS model.

Functions such as `can_access_project_rab`, `can_manage_project_rab`,
`set_updated_at`, and `handle_new_auth_user` have no direct frontend caller by
design; they are used indirectly by policies, RPCs, and triggers and are not
dead code.

## Risk and Reward

| Group | Risk | Reward | Decision |
| --- | --- | --- | --- |
| Ordered migrations 1-15 | Medium/high on a fresh database | Establish the complete application schema | Deploy only through migration history |
| Hardening migrations 16-18, 20-21 | Controlled medium | Close authorization, replay, numeric, workflow, RLS, and function-security gaps | Required for production |
| Legacy retirement migration 19 | High because it drops objects | Removes confirmed dead schema and prevents dual models | Required only after its guarded preflight and backup |
| Rollback-only/read-only verifiers | Low | Detect schema, privilege, RLS, replay, and API-contract regressions | Run after staging and production deployment |
| Historical/manual docs SQL | High drift/duplicate risk | Reference value only | Do not deploy |
| Dummy seeds | Critical in production | Development fixtures only | Production forbidden |
| Reset/cleanup scripts | Critical/destructive | One-off recovery or development cleanup | Production forbidden without a separate recovery plan |

## Production Gate Result

Completed on 2026-07-22:

1. Confirmed production project and Session Pooler target.
2. Created and checksum-verified a logical pre-deploy backup; the owner copied
   it off-device before approval.
3. Compared production inventory with the reviewed staging baseline.
4. Received explicit approval for the exact 21-migration deployment.
5. Applied only the missing ordered migrations through Supabase migration
   history.
6. Assigned and verified the two application roles.
7. Ran all seven SQL verification suites and a direct technical-user RPC smoke
   test.
8. Confirmed `supabase db push --dry-run` reports production up to date.
9. Created and checksum-verified a post-deploy backup including migration
   history.

The remaining browser smoke check was completed at the 2026-07-31 monitoring
checkpoint for both `admin@ypc.com` and `teknis@ypc.com`. No database repair was
required.
