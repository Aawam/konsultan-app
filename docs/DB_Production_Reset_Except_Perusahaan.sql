-- ============================================================
-- PRODUCTION DATA RESET — KEEP PERUSAHAAN
--
-- Purpose:
-- Clear operational/test data from production while preserving
-- company master data in public.perusahaan.
--
-- Deletes data from:
-- - public.override_log
-- - public.proyek
-- - public.dinas_skpd
--
-- Keeps data in:
-- - public.perusahaan
--
-- Run only after confirming production row counts.
-- ============================================================

BEGIN;

DELETE FROM public.override_log;
DELETE FROM public.proyek;
DELETE FROM public.dinas_skpd;

COMMIT;

-- Smoke check:
-- SELECT 'perusahaan' AS table_name, count(*) AS rows FROM public.perusahaan
-- UNION ALL SELECT 'proyek', count(*) FROM public.proyek
-- UNION ALL SELECT 'override_log', count(*) FROM public.override_log
-- UNION ALL SELECT 'dinas_skpd', count(*) FROM public.dinas_skpd
-- ORDER BY table_name;
