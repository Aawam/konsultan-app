# PRD Alignment Plan

Status: staging foundation applied; Step 6 core RLS applied; RAB Maker snapshot schema applied; app-level role boundary and read-only AHSP/RAB UI scaffold started.

## Verdict

The active app is a project monitoring system. To match the PRD, the next direction is not UI polish; it is security and data-model correction first.

## Phase 0 - Build Health

- Done: keep `/api/proyek/[id]/rab/*` as explicit `501 Not Implemented` placeholders until RAB calculation modules exist.
- Do not ship broken imports or half-wired RAB mutation/export endpoints.

## Phase 1 - Role And Data Boundary

- Done in staging schema: add app-level `users` profile table mapped to `auth.users`.
- Done in staging schema/app helpers: add roles `owner_admin`, `tenaga_ahli`.
- Done in staging DB/app level: stop treating "authenticated" as sufficient authorization for core write/manage paths.
- Done in staging schema: add `proyek_internal` for future commercial/internal fields.
- In progress: technical project fields are readable to Tenaga Ahli; owner-only UI now hides existing `nilai_penawaran` and `catatan`.
- Remaining: migrate existing `public.proyek.nilai_penawaran` and `public.proyek.catatan` into `proyek_internal` before strict DB-level RLS is safe for production.

## Phase 2 - AHSP Master Data

- Done in staging schema: add `satuan`, `kategori_pekerjaan_master`, `master_upah`, `master_bahan`, `master_alat`.
- Done in staging schema: add `ahsp_items` and `ahsp_details`.
- Done in app UI: Tenaga Ahli can read AHSP/master prices through read-only reference pages.
- Remaining: Owner/Admin mutation UI for AHSP/master prices.

## Phase 3 - RAB/EE Core

- Done in staging schema: add `rab_draft`, `rab_rekap`, and `rab_audit_log`.
- Done in staging schema: store snapshot `harga_satuan` and `jumlah_harga` per draft item.
- Done in staging schema/read UI: store and display `margin_persen`, `overhead_persen`, `ppn_persen`, and `pembulatan_rule` per `rab_rekap`.
- Done in app UI: restrict RAB pages to Owner/Admin and assigned Tenaga Ahli on Perencanaan projects.
- Revised target: RAB Maker must be a full per-project snapshot copied from Masterfile AHSP plus project RAB template.
- New draft: `docs/RAB_Maker_Workflow.md` and `docs/DB_RAB_Maker_Snapshot_Model.sql`.
- Done in staging DB: apply snapshot model after Step 6 RLS.
- Remaining: build centralized RAB calculation service before enabling item mutation.

## Phase 4 - UI

- Done: add sidebar entry `Pembuatan RAB`.
- Done: add read-only database routes for AHSP, harga upah, harga bahan, harga alat, satuan, kategori.
- Done: add `/proyek/[id]/rab` for Perencanaan only.
- Done: split project detail display by role for commercial/internal fields.

## Phase 5 - Export

- Add Excel export after calculation logic is centralized and tested.
- Add PDF export after final RAB/EE layout is stable.

## Immediate Next Step

Build app actions/types around `rab_maker`, `rab_maker_items`, and `rab_maker_item_details`, then implement centralized RAB calculation tests. Do not enable Excel/PDF export until calculation logic is covered by tests and current `nilai_penawaran`/`catatan` usage is migrated into the commercial boundary.
