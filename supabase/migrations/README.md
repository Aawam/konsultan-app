# Supabase Migrations

This folder is reserved for ordered, runnable database migrations.

Use this folder for schema changes that should be applied in sequence to a
Supabase/Postgres environment. Keep filenames timestamped:

```text
YYYYMMDDHHMMSS_short_description.sql
```

Current SQL files under `docs/` are audit/deployment/reference scripts. Do not
assume they are production migrations just because they contain DDL.

Before promoting any `docs/DB_*.sql` script into this folder:

1. Confirm target environment: local, staging, or production.
2. Remove one-off verification queries and comments that are not migration-safe.
3. Ensure the migration is idempotent or intentionally ordered.
4. Add a verification script or query when the migration changes access control.
