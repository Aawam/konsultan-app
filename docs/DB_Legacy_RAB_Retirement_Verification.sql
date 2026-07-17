-- ============================================================
-- LEGACY RAB RETIREMENT VERIFICATION
-- Run with psql -X -v ON_ERROR_STOP=1 after migration 20260717170000.
-- ============================================================

DO $$
DECLARE
  proyek_id_is_not_null boolean;
  preserved_table_count integer;
BEGIN
  IF to_regclass('public.rab_draft') IS NOT NULL THEN
    RAISE EXCEPTION 'public.rab_draft still exists.';
  END IF;

  IF to_regclass('public.rab_rekap') IS NOT NULL THEN
    RAISE EXCEPTION 'public.rab_rekap still exists.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rab_audit_log'
      AND column_name IN ('rab_draft_id', 'rab_rekap_id')
  ) THEN
    RAISE EXCEPTION 'rab_audit_log still has legacy target columns.';
  END IF;

  SELECT a.attnotnull
  INTO proyek_id_is_not_null
  FROM pg_attribute a
  WHERE a.attrelid = 'public.rab_audit_log'::regclass
    AND a.attname = 'proyek_id'
    AND NOT a.attisdropped;

  IF proyek_id_is_not_null IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'rab_audit_log.proyek_id is not enforced as NOT NULL.';
  END IF;

  IF to_regprocedure('public.record_rab_export_history(uuid,text,text,integer)') IS NOT NULL THEN
    RAISE EXCEPTION 'Legacy record_rab_export_history RPC still exists.';
  END IF;

  IF to_regprocedure('public.record_rab_export_file(uuid,text,text,integer)') IS NULL THEN
    RAISE EXCEPTION 'Active record_rab_export_file RPC is missing.';
  END IF;

  SELECT count(*)
  INTO preserved_table_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN (
      'rab_maker',
      'rab_maker_sections',
      'rab_maker_items',
      'rab_maker_item_details',
      'proyek_internal'
    )
    AND c.relkind IN ('r', 'p');

  IF preserved_table_count <> 5 THEN
    RAISE EXCEPTION 'Required preserved tables are incomplete or not real tables.';
  END IF;
END
$$;

SELECT 'legacy RAB retirement verification passed' AS result;
