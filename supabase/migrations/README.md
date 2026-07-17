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
12. `20260714115000_rab_export_history.sql` - versioned RAB export history table and recording RPC.
13. `20260714123000_ahsp_controlled_import_rpc.sql` - transactional AHSP masterfile import RPC.
14. `20260714132000_rab_export_versioned_file_rpc.sql` - versioned export filename recording RPC.
15. `20260716100000_paginated_technical_project_read_rpc.sql` - bounded technical-only project pagination for non-commercial roles.
16. `20260717141000_harden_active_export_and_import_rpcs.sql` - repair active RAB export authorization and validate/restrict controlled AHSP import.
17. `20260717150000_enforce_rab_rpc_writes_and_app_membership.sql` - make RAB writes RPC-only, require app membership for technical reads, and validate approval readiness.
18. `20260717160000_harden_ahsp_import_replay.sql` - make AHSP imports replay-safe, preserve detail identity, and disambiguate same-name components by unit.
19. `20260717170000_retire_legacy_rab_draft_rekap.sql` - retire empty legacy RAB draft/rekap tables and the superseded export RPC with guarded preflight checks.
20. `20260717180000_harden_identity_and_workflow_rpc.sql` - fail closed on missing app profiles and derive workflow audit identity from the authenticated profile.

Before promoting any additional `docs/DB_*.sql` script into this folder:

1. Confirm target environment: local, staging, or production.
2. Remove one-off verification queries and comments that are not migration-safe.
3. Ensure the migration is idempotent or intentionally ordered.
4. Add a verification script or query when the migration changes access control.

The verification for migration 15 is
`docs/DB_Paginated_Technical_Project_Read_Verification.sql`.

The rollback-only integration verification for migration 16 is
`docs/DB_Active_RPC_Hardening_Verification.sql`.

The rollback-only authorization verification for migration 17 is
`docs/DB_RAB_Authorization_Hardening_Verification.sql`.

The rollback-only replay verification for migration 18 is
`docs/DB_AHSP_Import_Replay_Verification.sql`.

The post-migration verification for migration 19 is
`docs/DB_Legacy_RAB_Retirement_Verification.sql`.

The rollback-only identity/workflow verification for migration 20 is
`docs/DB_Identity_Workflow_Hardening_Verification.sql`.
