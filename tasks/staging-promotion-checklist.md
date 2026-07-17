# Staging Promotion Tracker

Status: **not promoted**
Target flow: `experiment` -> `staging` (release candidate only)

## Required gates

- [x] Fix commercial-list overflow by re-querying the last valid page.
- [x] Add bounded technical pagination (`page >= 1`, `pageSize <= 100`).
- [x] Validate the technical RPC response before mapping it into the UI.
- [x] Keep commercial fields out of the non-owner technical projection.
- [x] Restrict the pagination RPC to `authenticated`; deny `anon` and `PUBLIC`.
- [x] Apply and verify the pagination migration in staging.
- [x] Record staging pagination baseline: 12.34 ms execution for 10 rows (not a scale test).
- [x] Preserve the existing type file when Supabase type generation fails.
- [x] Expand CI to lint, typecheck, test, build, and dependency audit.
- [x] Block the obsolete broad production-cleanup script.
- [x] Fix the responsive sidebar hydration mismatch and add a regression test.
- [x] Rotate the staging database password after it appeared in local tool output.
- [x] Regenerate `lib/database.types.ts` with a valid `SUPABASE_ACCESS_TOKEN`.
- [x] Replace handwritten active-RPC casts with generated types and runtime JSON validation.
- [x] Harden active RAB/AHSP RPC authorization and replay behavior in staging.
- [x] Harden identity helpers and workflow audit identity in staging.
- [x] Pass four rollback-only staging verifications and the legacy-retirement verification.
- [x] Retire empty legacy `rab_draft`/`rab_rekap` tables in staging with fail-closed guards and no `CASCADE`.
- [x] Pass the complete local `npm run check` gate.
- [x] Verify the unauthenticated/login boundary at 390px, 768px, and 1440px with no overflow.
- [ ] Pass authenticated interior-screen smoke tests at 390px, 768px, and 1440px (test session expired).
- [ ] Confirm the remote CI run is green after pushing `experiment`.

## Promotion tasks

- [x] Review the final diff across UI, API, database, security, CI, and migration concerns.
- [ ] Stage only the intended release scope; do not sweep unrelated local changes into the promotion commit.
- [ ] Record the staging database migration and verification result in the release notes.
- [ ] Merge or fast-forward `experiment` into `staging`.
- [ ] Smoke-test the deployed staging URL and verify rollback readiness.

## Production boundary

- [ ] Production approval obtained.
- [ ] Production backup and migration plan reviewed.
- [ ] `staging` merged into `main` only after staging acceptance.

Nothing in this checklist authorizes a production database change or a merge to
`main`.
