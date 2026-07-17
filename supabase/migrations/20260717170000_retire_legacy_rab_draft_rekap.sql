-- ============================================================
-- RETIRE LEGACY RAB DRAFT/REKAP MODEL
--
-- Replacement: rab_maker + rab_maker_items + rab_maker_item_details.
-- This migration aborts instead of deleting if legacy business data or audit
-- references exist. No CASCADE is used.
-- ============================================================

BEGIN;

SET LOCAL lock_timeout = '10s';

LOCK TABLE
  public.rab_audit_log,
  public.rab_draft,
  public.rab_rekap
IN ACCESS EXCLUSIVE MODE;

DO $$
DECLARE
  preserved_table_count integer;
BEGIN
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
    RAISE EXCEPTION 'Cannot retire legacy RAB model: required preserved tables are incomplete.';
  END IF;

  IF to_regprocedure('public.record_rab_export_file(uuid,text,text,integer)') IS NULL THEN
    RAISE EXCEPTION 'Cannot retire legacy export RPC: active record_rab_export_file RPC is missing.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.rab_draft) THEN
    RAISE EXCEPTION 'Cannot retire public.rab_draft: table still contains data.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.rab_rekap) THEN
    RAISE EXCEPTION 'Cannot retire public.rab_rekap: table still contains data.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.rab_audit_log
    WHERE rab_draft_id IS NOT NULL
      OR rab_rekap_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot retire legacy RAB model: audit log still references legacy rows.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.rab_audit_log
    WHERE proyek_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot simplify rab_audit_log: a row has no proyek_id.';
  END IF;
END
$$;

ALTER TABLE public.rab_audit_log
  DROP CONSTRAINT rab_audit_log_target,
  ALTER COLUMN proyek_id SET NOT NULL,
  DROP COLUMN rab_draft_id,
  DROP COLUMN rab_rekap_id;

DROP TABLE public.rab_draft;
DROP TABLE public.rab_rekap;

DROP FUNCTION IF EXISTS public.record_rab_export_history(uuid, text, text, integer);

COMMENT ON TABLE public.rab_audit_log IS
  'Project-scoped audit log for the active rab_maker model.';

COMMIT;
