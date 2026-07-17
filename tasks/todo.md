# UI Hierarchy Cleanup Checklist

- [x] Define shared typography and surface rules.
- [x] Normalize page, section, and statistic primitives.
- [x] Verify the foundation with linting.
- [x] Simplify the project-list header and metric strip.
- [x] Rebuild dashboard filter hierarchy and card rhythm.
- [x] Recompose the project-detail layout and resolve the duplicated location display.
- [ ] Browser-test desktop, tablet, and mobile in both themes (waiting for the in-app authenticated session).
- [x] Update UI conventions and complete lint/test/build verification.

## Workflow UX Follow-up

- [x] Preserve dashboard filters and list context in the URL.
- [x] Compact project-form progress and summary on narrow screens.
- [x] Fix keyboard and screen-reader affordances in project controls.
- [x] State the RAB compact-viewport boundary.
- [x] Verify lint, targeted filter tests, and production build.
- [ ] Browser-check authenticated project flows at 390px, 768px, and 1440px in light and dark modes.

## Production SQL Hardening

- [x] Capture and reconcile the Codex CLI adversarial audit.
- [x] Prove the current export/import RPC failures with rollback-only staging checks.
- [x] Add a forward migration that repairs RAB export authorization.
- [x] Reject incomplete AHSP import payloads and remove anon/PUBLIC execution.
- [x] Apply the blocker migrations to staging and rerun the integration checks.
- [x] Prepare a guarded cleanup migration for confirmed-unused RAB legacy objects.
- [x] Remove dead TypeScript accessors only after the cleanup migration passes staging.
- [x] Configure Supabase CLI authentication and regenerate database types.
- [ ] Build and verify a clean production baseline without dummy seeds.
- [ ] Obtain a reachable production project, backup, and explicit deployment approval.
