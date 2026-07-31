# Product Scope and RAB Reintegration Plan

Status: monitoring-only product scope accepted on 2026-07-31. RAB/AHSP implementation is separated into another project.

## Active Product

- Project list, filters, detail, progress, dashboard, and CSV export.
- Owner/Admin project management and commercial data access.
- Tenaga Ahli read access to technical project data without commercial fields.
- Owner/Admin management of supporting company and Dinas/SKPD data.

## Retired Local Surface

- `/proyek/rab` and `/proyek/[id]/rab`.
- `/api/proyek/[id]/rab/*` and `/api/proyek/[id]/workflow`.
- `/api/master/*` and AHSP/master-price UI.
- RAB XLSX/PDF export, approval, final lock, and audit workflow.

The application implementation is removed from this repository. Historical migrations, generated database types, dormant database objects, and fail-closed access controls are retained so the separation is reversible and auditable without keeping two competing formula implementations.

## Reintegration Gates

RAB may return only after all of these are true:

1. The calculation model is completed in a separate project.
2. Formula behavior is covered by deterministic fixtures and tests.
3. Rounding, overhead, profit/margin, tax, and snapshot rules are explicit.
4. Import/export contracts between the RAB project and this app are documented.
5. Representative real project calculations have been reconciled manually.
6. Role access, database migration, rollback, and monitoring plans are reviewed.

## Immediate Direction

Do not implement RAB/AHSP formulas in this repository. Improve only the monitoring workflow, data quality, role boundaries, and operational reliability of the consultant project application.
