-- ============================================================
-- RAB AUTHORIZATION HARDENING VERIFICATION
--
-- Verifies that RAB writes are RPC-only and technical project reads require
-- an application profile. Any approval mutation is rolled back.
-- Run with psql -X -v ON_ERROR_STOP=1.
-- ============================================================

BEGIN;

DO $$
DECLARE
  table_name text;
  privilege_name text;
  role_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'rab_maker',
    'rab_maker_sections',
    'rab_maker_items',
    'rab_maker_item_details'
  ]
  LOOP
    IF NOT has_table_privilege('authenticated', 'public.' || table_name, 'SELECT') THEN
      RAISE EXCEPTION 'authenticated lost SELECT on public.%', table_name;
    END IF;

    FOREACH role_name IN ARRAY ARRAY['authenticated', 'anon']
    LOOP
      FOREACH privilege_name IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE']
      LOOP
        IF has_table_privilege(role_name, 'public.' || table_name, privilege_name) THEN
          RAISE EXCEPTION '% still has % on public.%', role_name, privilege_name, table_name;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  FOREACH role_name IN ARRAY ARRAY['authenticated', 'anon']
  LOOP
    IF has_table_privilege(role_name, 'public.rab_audit_log', 'INSERT') THEN
      RAISE EXCEPTION '% still has INSERT on public.rab_audit_log.', role_name;
    END IF;

    IF has_table_privilege(role_name, 'public.rab_export_history', 'INSERT') THEN
      RAISE EXCEPTION '% still has INSERT on public.rab_export_history.', role_name;
    END IF;

    IF has_function_privilege(role_name, 'public.get_proyek_teknis_unchecked(uuid)', 'EXECUTE') THEN
      RAISE EXCEPTION '% can execute get_proyek_teknis_unchecked.', role_name;
    END IF;

    IF has_function_privilege(
      role_name,
      'public.get_proyek_teknis_page_unchecked(integer,integer,integer,text,text,uuid,text,text)',
      'EXECUTE'
    ) THEN
      RAISE EXCEPTION '% can execute get_proyek_teknis_page_unchecked.', role_name;
    END IF;
  END LOOP;
END
$$;

SELECT set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    PERFORM * FROM public.get_proyek_teknis(NULL);
  EXCEPTION
    WHEN insufficient_privilege THEN
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'get_proyek_teknis accepted an authenticated identity without public.users membership.';
  END IF;

  rejected := false;

  BEGIN
    PERFORM public.get_proyek_teknis_page();
  EXCEPTION
    WHEN insufficient_privilege THEN
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'get_proyek_teknis_page accepted an authenticated identity without public.users membership.';
  END IF;

  rejected := false;

  BEGIN
    PERFORM public.approve_rab_maker(gen_random_uuid());
  EXCEPTION
    WHEN insufficient_privilege THEN
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'approve_rab_maker did not reject an identity without public.users membership as unauthorized.';
  END IF;

  rejected := false;

  BEGIN
    PERFORM public.finalize_rab_maker(gen_random_uuid());
  EXCEPTION
    WHEN insufficient_privilege THEN
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'finalize_rab_maker did not reject an identity without public.users membership as unauthorized.';
  END IF;
END
$$;

RESET ROLE;

DO $$
DECLARE
  actor_id uuid;
  target_project_id uuid;
  item_id uuid;
BEGIN
  SELECT u.id
  INTO actor_id
  FROM public.users u
  WHERE u.role = 'owner_admin'::public.app_role
  ORDER BY u.created_at
  LIMIT 1;

  SELECT rm.proyek_id
  INTO target_project_id
  FROM public.rab_maker rm
  WHERE rm.status = 'draft'::public.rab_status
    AND EXISTS (
      SELECT 1
      FROM public.rab_maker_items rmi
      WHERE rmi.rab_maker_id = rm.id
        AND COALESCE(rmi.volume, 0) <= 0
    )
  ORDER BY rm.created_at
  LIMIT 1;

  SELECT rmi.id
  INTO item_id
  FROM public.rab_maker_items rmi
  JOIN public.rab_maker rm ON rm.id = rmi.rab_maker_id
  WHERE rm.proyek_id = target_project_id
    AND COALESCE(rmi.volume, 0) <= 0
  ORDER BY rmi.created_at
  LIMIT 1;

  IF actor_id IS NULL OR target_project_id IS NULL OR item_id IS NULL THEN
    RAISE EXCEPTION 'Verification needs an owner_admin and a draft RAB with a zero-volume item.';
  END IF;

  PERFORM set_config('verification.actor_id', actor_id::text, true);
  PERFORM set_config('verification.project_id', target_project_id::text, true);
  PERFORM set_config('verification.item_id', item_id::text, true);
END
$$;

SELECT set_config('request.jwt.claim.sub', current_setting('verification.actor_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  target_project_id uuid := current_setting('verification.project_id')::uuid;
  rejected boolean := false;
BEGIN
  BEGIN
    PERFORM public.approve_rab_maker(target_project_id);
  EXCEPTION
    WHEN check_violation THEN
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'approve_rab_maker accepted an incomplete/zero-volume RAB.';
  END IF;
END
$$;

RESET ROLE;

UPDATE public.rab_maker_items
SET volume = 'NaN'::numeric,
    jumlah_harga = 'NaN'::numeric
WHERE id = current_setting('verification.item_id')::uuid;

SELECT set_config('request.jwt.claim.sub', current_setting('verification.actor_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  target_project_id uuid := current_setting('verification.project_id')::uuid;
  rejected boolean := false;
BEGIN
  BEGIN
    PERFORM public.approve_rab_maker(target_project_id);
  EXCEPTION
    WHEN check_violation THEN
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'approve_rab_maker accepted a RAB containing NaN.';
  END IF;
END
$$;

RESET ROLE;

ROLLBACK;

SELECT 'RAB authorization hardening verification passed' AS result;
