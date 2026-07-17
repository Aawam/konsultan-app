# PRD Gap Audit

Status: 2026-07-17

This audit compares the current repository against the Draft v1 PRD for
`konsultan-app`. The PRD sitemap and Settings module are intentionally not used
as blocking gaps because the product direction keeps the current `/proyek/*`
navigation and does not need a user-facing Settings area while operations remain
internal and single-operator.

## Verdict

The app is ahead of the PRD in the RAB data model and access-control foundation,
but behind the PRD in product completeness. The current state is roughly
60-65% of the PRD MVP.

## Ahead Of PRD

- RAB snapshot model is more detailed than the PRD's initial `rab_draft` and
  `rab_rekap` split. The current model has `rab_maker`, `rab_maker_items`,
  `rab_maker_item_details`, and audit hooks.
- Role foundation exists for `owner_admin` and `tenaga_ahli`.
- Project technical read boundaries are modeled through assigned-project access
  helpers and RLS/RPC scripts.
- RAB Maker already supports AHSP selection, item snapshots, volume updates,
  item-level profit override, and component price override.

## Aligned With PRD

- Auth and role profile foundation.
- Project CRUD with `jenis_pekerjaan`.
- Role-aware project list/detail visibility for commercial fields.
- AHSP/master data read surface.
- Owner/Admin write access direction for master data.
- Tenaga Ahli access direction for assigned Perencanaan RAB work.

## Behind PRD

- Rekap RAB still needs a complete product surface for every document-level
  parameter and review exception, despite working approval/finalization locks.
- Global parameters such as default PPN, default margin, overhead, and rounding
  rules are not yet a first-class app surface. This is acceptable for the
  current single-operator phase but must be revisited before multi-user
  operations.

## Not A Gap

- Sitemap mismatch is accepted. The current app keeps `/proyek/dashboard`,
  `/proyek/rab`, and a tabbed `/database` surface instead of the PRD's
  `/dashboard` and split database routes.
- `/pengaturan` is intentionally deferred. User-role and global parameter
  management remain technical/internal for now.

## Priority Fix Order

1. Stabilize domain boundaries: route handlers should orchestrate auth, request
   parsing, and responses only. Domain validation and mutations belong in
   `lib/validations/*` and `lib/actions/*`.
2. Add an explicit migration folder and stop treating `docs/*.sql` as runnable
   production migrations.
3. Finish the remaining Rekap RAB document-level parameter workflow.
4. Keep XLSX/PDF export and controlled AHSP import covered by regression tests.
