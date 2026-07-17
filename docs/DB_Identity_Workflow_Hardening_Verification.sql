-- ============================================================
-- IDENTITY AND WORKFLOW RPC HARDENING VERIFICATION
-- Run with psql -X -v ON_ERROR_STOP=1 after migration 20260717180000.
-- All workflow mutations are rolled back.
-- ============================================================

BEGIN;

DO $$
DECLARE
  function_name text;
  function_config text[];
BEGIN
  FOREACH function_name IN ARRAY ARRAY[
    'current_app_role',
    'is_owner_admin',
    'can_manage_project_rab',
    'transition_project_workflow_to_rab_ready'
  ]
  LOOP
    SELECT p.proconfig
    INTO function_config
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = function_name
    ORDER BY p.oid
    LIMIT 1;

    IF function_config IS NULL
      OR NOT ('search_path=pg_catalog' = ANY(function_config)) THEN
      RAISE EXCEPTION 'public.% does not enforce search_path=pg_catalog.', function_name;
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
  IF public.is_owner_admin() IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'is_owner_admin did not fail closed for a missing app profile.';
  END IF;

  BEGIN
    PERFORM public.transition_project_workflow_to_rab_ready(gen_random_uuid(), 'spoof@example.com');
  EXCEPTION
    WHEN insufficient_privilege THEN
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Workflow RPC accepted an authenticated identity without app membership.';
  END IF;
END
$$;

RESET ROLE;

DO $$
DECLARE
  actor_id uuid;
  actor_email text;
  target_project_id uuid;
BEGIN
  SELECT u.id, u.email
  INTO actor_id, actor_email
  FROM public.users u
  WHERE u.role = 'owner_admin'::public.app_role
  ORDER BY u.created_at
  LIMIT 1;

  SELECT p.id
  INTO target_project_id
  FROM public.proyek p
  WHERE p.jenis_pekerjaan = 'Perencanaan'
    AND COALESCE(p.is_deleted, false) = false
    AND (
      p.tahap_progress IS DISTINCT FROM 'Penyusunan Laporan Akhir & RAB'
      OR p.persentase_progress IS DISTINCT FROM 80
    )
  ORDER BY p.created_at
  LIMIT 1;

  IF actor_id IS NULL OR actor_email IS NULL OR target_project_id IS NULL THEN
    RAISE EXCEPTION 'Verification needs an owner_admin and an eligible Perencanaan project.';
  END IF;

  PERFORM set_config('verification.actor_id', actor_id::text, true);
  PERFORM set_config('verification.actor_email', actor_email, true);
  PERFORM set_config('verification.project_id', target_project_id::text, true);
END
$$;

SELECT set_config('request.jwt.claim.sub', current_setting('verification.actor_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;

SELECT public.transition_project_workflow_to_rab_ready(
  current_setting('verification.project_id')::uuid,
  'spoof@example.com'
);

RESET ROLE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.override_log ol
    WHERE ol.proyek_id = current_setting('verification.project_id')::uuid
      AND ol.field_dioverride = 'Workflow RAB'
      AND ol.dilakukan_oleh = current_setting('verification.actor_email')
  ) THEN
    RAISE EXCEPTION 'Workflow audit did not use the authenticated app profile email.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.override_log ol
    WHERE ol.proyek_id = current_setting('verification.project_id')::uuid
      AND ol.field_dioverride = 'Workflow RAB'
      AND ol.dilakukan_oleh = 'spoof@example.com'
  ) THEN
    RAISE EXCEPTION 'Workflow audit trusted caller-controlled actor_email.';
  END IF;
END
$$;

ROLLBACK;

SELECT 'identity and workflow hardening verification passed' AS result;
