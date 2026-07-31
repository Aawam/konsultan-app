# Monitoring-only checkpoint — 2026-07-31

Status: release candidate; not yet accepted in staging or production.

## Scope

- Keep `owner_admin` and `tenaga_ahli` monitoring workflows.
- Remove RAB/AHSP navigation and active database UI.
- Redirect retired RAB pages and return `404` for retired RAB/AHSP APIs.
- Preserve the currently surviving RAB/AHSP schema and data while denying browser-role table and RPC access.

## Database provenance

- Baseline migration: `20260717190000_close_final_sql_baseline_gaps.sql`
- Local baseline SHA-256: `cf3c3acc0efd97fc1c264bf961c3ca55fb910b77b4ce62e3016e3b100d573351`
- Staging migration-history statement MD5: `dba4fefc27f83fd6bc46250e00f67b34` (66 statements)
- Pause migration: `20260731120000_pause_rab_ahsp_access.sql`
- Local pause SHA-256: `2811b5dba562b453fd6516603fbab4533943b119ee5a651098d7e74216f0501e`
- Production history verification: pending; the saved production connection was unreachable during release preparation.

## Deployment order

1. Build and verify the exact candidate commit from a clean checkout.
2. Back up staging and record pre-pause RAB/AHSP row counts.
3. Apply the pause migration to staging and run `docs/DB_RAB_AHSP_Pause_Verification.sql`.
4. Verify direct REST/RPC denial and active monitoring behavior for both roles.
5. Deploy the same candidate commit to staging and complete browser smoke tests.
6. Repeat the backup, database-first migration, direct-client verification, and application deployment in production.

## Rollback boundary

Application rollback must leave database access paused. Do not manually re-grant RAB/AHSP access. Any future restoration requires a separately reviewed forward migration based on recorded pre-pause definitions and grants.
