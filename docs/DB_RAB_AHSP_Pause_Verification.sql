-- ============================================================
-- RAB/AHSP PAUSE VERIFICATION
--
-- Verifies that browser-facing Supabase roles cannot read, mutate, or invoke
-- the paused RAB/AHSP surface. This script is read-only.
-- Run with psql -X -v ON_ERROR_STOP=1.
-- ============================================================

BEGIN;

DO $$
DECLARE
  object_name text;
  privilege_name text;
  role_name text;
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
    'public.rab_maker',
    'public.rab_maker_sections',
    'public.rab_maker_items',
    'public.rab_maker_item_details',
    'public.rab_audit_log',
    'public.rab_export_history'
  ]
  LOOP
    target_table := to_regclass(object_name);

    IF target_table IS NULL THEN
      RAISE EXCEPTION 'Required preserved table % is missing.', object_name;
    END IF;

    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated']
    LOOP
      FOREACH privilege_name IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']
      LOOP
        IF has_table_privilege(role_name, target_table, privilege_name) THEN
          RAISE EXCEPTION '% still has % on %.', role_name, privilege_name, object_name;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  IF to_regclass('public.rab_draft') IS NOT NULL
    OR to_regclass('public.rab_rekap') IS NOT NULL THEN
    RAISE EXCEPTION 'Retired legacy RAB tables unexpectedly exist.';
  END IF;
END
$$;

DO $$
DECLARE
  object_signature text;
  role_name text;
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
    'public.record_rab_export_file(uuid,text,text,integer)',
    'public.import_ahsp_masterfile(jsonb)',
    'public.import_ahsp_masterfile_unchecked(jsonb)'
  ]
  LOOP
    target_function := to_regprocedure(object_signature);

    IF target_function IS NULL THEN
      RAISE EXCEPTION 'Required preserved function % is missing.', object_signature;
    END IF;

    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated']
    LOOP
      IF has_function_privilege(role_name, target_function, 'EXECUTE') THEN
        RAISE EXCEPTION '% can still execute %.', role_name, object_signature;
      END IF;
    END LOOP;
  END LOOP;

  IF to_regprocedure('public.record_rab_export_history(uuid,text,text,integer)') IS NOT NULL THEN
    RAISE EXCEPTION 'Retired legacy RAB export function unexpectedly exists.';
  END IF;

  IF public.can_access_project_rab(gen_random_uuid()) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'can_access_project_rab() does not fail closed.';
  END IF;

  IF public.can_manage_project_rab(gen_random_uuid()) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'can_manage_project_rab() does not fail closed.';
  END IF;
END
$$;

DO $$
DECLARE
  exposed_object record;
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    FOR exposed_object IN
      SELECT DISTINCT
        view_namespace.nspname AS schema_name,
        view_class.relname AS view_name
      FROM pg_depend dependency
      JOIN pg_rewrite rewrite_rule
        ON rewrite_rule.oid = dependency.objid
      JOIN pg_class view_class
        ON view_class.oid = rewrite_rule.ev_class
      JOIN pg_namespace view_namespace
        ON view_namespace.oid = view_class.relnamespace
      JOIN pg_class source_class
        ON source_class.oid = dependency.refobjid
      JOIN pg_namespace source_namespace
        ON source_namespace.oid = source_class.relnamespace
      WHERE view_namespace.nspname = 'public'
        AND source_namespace.nspname = 'public'
        AND source_class.relname IN (
          'satuan',
          'kategori_pekerjaan_master',
          'master_upah',
          'master_bahan',
          'master_alat',
          'ahsp_items',
          'ahsp_details',
          'rab_maker',
          'rab_maker_sections',
          'rab_maker_items',
          'rab_maker_item_details',
          'rab_audit_log',
          'rab_export_history'
        )
        AND view_class.relkind IN ('v', 'm')
        AND has_table_privilege(
          role_name,
          format('%I.%I', view_namespace.nspname, view_class.relname),
          'SELECT'
        )
    LOOP
      RAISE EXCEPTION '% can access paused data through %.%.',
        role_name,
        exposed_object.schema_name,
        exposed_object.view_name;
    END LOOP;
  END LOOP;
END
$$;

ROLLBACK;

SELECT 'RAB/AHSP pause verification passed' AS result;
