# Supabase Migrations

This folder is reserved for ordered, runnable database migrations.

Use this folder for schema changes that should be applied in sequence to a
Supabase/Postgres environment. Keep filenames timestamped:

```text
YYYYMMDDHHMMSS_short_description.sql
```

Current SQL files under `docs/` are audit/deployment/reference scripts. Promote
only reviewed, runnable schema/RLS/function changes into this folder.

## Current Order

1. `20260709090000_core_project_schema.sql` - base project/perusahaan/override/dinas tables.
2. `20260709093000_prd_foundation_schema_and_rls.sql` - app roles, AHSP master data, RAB draft/rekap, base PRD RLS.
3. `20260709100000_technical_project_read_rpc.sql` - technical-only project read RPC for non-owner users.
4. `20260709103000_rab_maker_snapshot_model.sql` - per-project RAB Maker snapshot tables and RLS.
5. `20260709110000_rab_maker_rpc_functions.sql` - RAB Maker mutation/recalculation RPCs.
6. `20260709113000_prd_core_owner_rls.sql` - strict owner/admin policies for commercial core tables.
7. `20260709120000_prd_table_grants.sql` - PostgREST grants for tables/functions guarded by RLS.
8. `20260710095500_remove_project_assignments_from_rab_access.sql` - patch RAB access away from `project_assignments`.
9. `20260710103000_remove_project_assignments_and_rename_project_read_rpc.sql` - remove old assignment model and final RPC name.
10. `20260714104000_project_workflow_transition_rpc.sql` - atomic project workflow transition update plus audit log insert.
11. `20260714112000_rab_approval_final_lock_model.sql` - RAB approval/finalization RPCs and lock metadata.

Before promoting any additional `docs/DB_*.sql` script into this folder:

1. Confirm target environment: local, staging, or production.
2. Remove one-off verification queries and comments that are not migration-safe.
3. Ensure the migration is idempotent or intentionally ordered.
4. Add a verification script or query when the migration changes access control.
