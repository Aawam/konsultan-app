# Deployment Notes

## Environment Files

- `.env.local`: local development. Points to the staging Supabase project.
- `.env.staging.local`: staging reference values.
- `.env.production.local`: production reference values. May include `DATABASE_URL` for local admin scripts.
- `.env.example`: safe template only. Never put real secrets here.

All `.env*` files except `.env.example` are ignored by Git.

## Database Source Of Truth

The active app schema is the monitoring schema:

- `perusahaan`
- `proyek`
- `override_log`
- `dinas_skpd`

The SQL source of truth lives in:

- `docs/DB_SUPABASE_DEPLOY.sql`
- `docs/RLS_Policies.sql`
- `lib/database.types.ts`

Do not use the Supabase Table Editor as the schema source of truth. Manual table changes must be copied back into SQL files and regenerated types.

## Local Development

Use staging for local development:

```bash
npm run dev
```

The app reads `.env.local`, so `.env.local` should point to staging, not production.

## Production Schema Audit

Before changing production schema:

1. Back up production data.
2. Run:

```bash
set -a
source .env.production.local
set +a
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/DB_Simplification_Audit.sql
```

3. Confirm:

- `missing_core_table` returns `0 rows`.
- `legacy_table_found` returns `0 rows`, unless intentionally cleaning legacy objects.
- Core tables remain `perusahaan`, `proyek`, `override_log`, and `dinas_skpd`.

## Production Cleanup

Only run cleanup after audit confirms legacy objects are unused:

```bash
set -a
source .env.production.local
set +a
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/DB_Simplification_Cleanup.sql
```

## Type Generation

Generate Supabase types from staging:

```bash
npm run types:supabase
```

Production and staging schemas should match before deployment.

## Deployment Rule

Deploy code only when:

- `npm test` passes.
- `npm run build` passes.
- Staging schema matches production schema.
- Production data changes have a backup or an explicit reset decision.
