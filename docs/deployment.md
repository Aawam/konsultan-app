# Deployment Notes

## Environment Files

- `.env.local`: local development. Points to the staging Supabase project.
- `.env.staging.local`: staging reference values.
- `.env.production.local`: production reference values. May include `DATABASE_URL` for local admin scripts.
- `.env.example`: safe template only. Never put real secrets here.

All `.env*` files except `.env.example` are ignored by Git.

## Database Source Of Truth

Ordered files in `supabase/migrations/` are the schema source of truth.
`docs/DB_*.sql` files are audits, seeds, verification scripts, or historical
deployment references unless explicitly promoted into a migration.
`lib/database.types.ts` is generated output, not a schema source.

Do not use the Supabase Table Editor as the schema source of truth. Manual table changes must be copied back into SQL files and regenerated types.

## Local Development

Use staging for local development:

```bash
npm run dev
```

The app reads `.env.local`, so `.env.local` should point to staging, not production.

## Legacy Schema Inventory

The old simplification audit is inventory-only. It is not evidence that a
legacy table is safe to delete. Before any production removal:

1. Back up production data.
2. Run:

```bash
set -a
source .env.production.local
set +a
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/DB_Simplification_Audit.sql
```

3. Check application references, foreign keys, policies, row counts, and recent
   database usage for every candidate object.
4. Require an explicit production approval, backup, rollback plan, and a new
   ordered migration for the exact objects being removed.

`docs/DB_Simplification_Cleanup.sql` is deprecated and deliberately blocked.
Do not use it as a production migration.

## Type Generation

Generate Supabase types from staging:

```bash
npm run types:supabase
```

This requires `SUPABASE_ACCESS_TOKEN` and optionally `SUPABASE_PROJECT_ID`.
Generation is atomic: a CLI failure preserves the existing type file.

Production and staging schemas should match before deployment.

## Staging Promotion

Promoting `experiment` to `staging` uploads a release candidate to the staging
branch/environment only. It does not upload the application to production.

1. Run `npm run check` on `experiment`.
2. Review the migration SQL and apply it to the staging database.
3. Run its read-only verification script against staging.
4. Merge or fast-forward `experiment` into `staging`.
5. Smoke-test the staging deployment and rollback path.
6. Merge `staging` into `main` only after explicit production approval.

## Deployment Rule

Deploy code only when:

- `npm run check` passes.
- `npm audit --omit=dev --audit-level=high` passes.
- Staging schema matches production schema.
- Production data changes have a backup or an explicit reset decision.
- The migration has a reviewed rollback or forward-fix plan.
