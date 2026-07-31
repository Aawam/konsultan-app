-- ============================================================
-- PAUSE RAB AND AHSP ACCESS
--
-- Keep all RAB/AHSP data and the currently surviving schema intact while
-- removing the paused feature from the browser-facing Supabase API. Future
-- reintegration must restore access through a new reviewed forward migration.
-- ============================================================

BEGIN;

SET LOCAL lock_timeout = '10s';

-- Fail closed even if a retained SECURITY DEFINER function or RLS policy calls
-- these helpers after the feature has been paused.
CREATE OR REPLACE FUNCTION public.can_access_project_rab(target_proyek_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT false
$$;

CREATE OR REPLACE FUNCTION public.can_manage_project_rab(target_proyek_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT false
$$;

DO $$
DECLARE
  object_name text;
  target_table regclass;
BEGIN
  FOREACH object_name IN ARRAY ARRAY[
    'public.satuan',
    'public.kategori_pekerjaan_master',
    'public.master_upah',
    'public.master_bahan',
    'public.master_alat',
    'public.ahsp_items',
    'public.ahsp_details',
    'public.rab_draft',
    'public.rab_rekap',
    'public.rab_maker',
    'public.rab_maker_sections',
    'public.rab_maker_items',
    'public.rab_maker_item_details',
    'public.rab_audit_log',
    'public.rab_export_history'
  ]
  LOOP
    target_table := to_regclass(object_name);

    IF target_table IS NOT NULL THEN
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON TABLE %s FROM PUBLIC, anon, authenticated',
        target_table
      );
    END IF;
  END LOOP;
END
$$;

DO $$
DECLARE
  object_signature text;
  target_function regprocedure;
BEGIN
  FOREACH object_signature IN ARRAY ARRAY[
    'public.can_access_project_rab(uuid)',
    'public.can_manage_project_rab(uuid)',
    'public.has_complete_project_rab_core(uuid)',
    'public.is_project_rab_ready(uuid)',
    'public.transition_project_workflow_to_rab_ready(uuid,text)',
    'public.recalculate_rab_maker(uuid)',
    'public.create_rab_maker_from_ahsp(uuid,uuid)',
    'public.update_rab_maker_item_volume(uuid,numeric)',
    'public.update_rab_maker_item_profit(uuid,numeric,text)',
    'public.update_rab_maker_detail_harga_dasar(uuid,numeric,text)',
    'public.delete_rab_maker_item(uuid)',
    'public.prevent_locked_rab_maker_child_change()',
    'public.assert_rab_maker_ready_for_approval(uuid)',
    'public.approve_rab_maker(uuid)',
    'public.finalize_rab_maker(uuid)',
    'public.record_rab_export_history(uuid,text,text,integer)',
    'public.record_rab_export_file(uuid,text,text,integer)',
    'public.import_ahsp_masterfile(jsonb)',
    'public.import_ahsp_masterfile_unchecked(jsonb)'
  ]
  LOOP
    target_function := to_regprocedure(object_signature);

    IF target_function IS NOT NULL THEN
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON FUNCTION %s FROM PUBLIC, anon, authenticated',
        target_function
      );
    END IF;
  END LOOP;
END
$$;

COMMENT ON FUNCTION public.can_access_project_rab(uuid) IS
  'Paused by ADR-002. Always denies RAB access until a reviewed forward migration restores the feature.';
COMMENT ON FUNCTION public.can_manage_project_rab(uuid) IS
  'Paused by ADR-002. Always denies RAB mutations until a reviewed forward migration restores the feature.';

COMMIT;
