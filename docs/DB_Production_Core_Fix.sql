-- ============================================================
-- PRODUCTION CORE SCHEMA FIX
-- Purpose:
-- Align production with the active monitoring schema without
-- deleting any legacy tables.
--
-- Safe to run on production before cleanup:
-- - Does not drop tables
-- - Only normalizes proyek.is_deleted
-- ============================================================

BEGIN;

UPDATE public.proyek
SET is_deleted = false
WHERE is_deleted IS NULL;

ALTER TABLE public.proyek
ALTER COLUMN is_deleted SET DEFAULT false;

ALTER TABLE public.proyek
ALTER COLUMN is_deleted SET NOT NULL;

COMMIT;

-- Smoke check:
-- SELECT column_name, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'proyek'
--   AND column_name = 'is_deleted';
