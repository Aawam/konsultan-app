-- ============================================================
-- ACTIVE RPC HARDENING VERIFICATION
--
-- Verifies the active RAB export and AHSP import RPC contracts.
-- The integration calls run inside a transaction that is always rolled back.
-- Run with psql -X -v ON_ERROR_STOP=1.
-- ============================================================

BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.record_rab_export_file(uuid,text,text,integer)') IS NULL THEN
    RAISE EXCEPTION 'Missing public.record_rab_export_file(uuid,text,text,integer).';
  END IF;

  IF to_regprocedure('public.import_ahsp_masterfile(jsonb)') IS NULL THEN
    RAISE EXCEPTION 'Missing public.import_ahsp_masterfile(jsonb).';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'public.record_rab_export_file(uuid,text,text,integer)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'authenticated cannot execute record_rab_export_file.';
  END IF;

  IF has_function_privilege(
    'anon',
    'public.record_rab_export_file(uuid,text,text,integer)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'anon can execute record_rab_export_file.';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'public.import_ahsp_masterfile(jsonb)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'authenticated cannot execute import_ahsp_masterfile.';
  END IF;

  IF has_function_privilege(
    'anon',
    'public.import_ahsp_masterfile(jsonb)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'anon can execute import_ahsp_masterfile.';
  END IF;
END
$$;

DO $$
DECLARE
  actor_id uuid;
  maker_id uuid;
  history_before bigint;
  history_after bigint;
  export_result jsonb;
BEGIN
  SELECT u.id
  INTO actor_id
  FROM public.users u
  WHERE u.role = 'owner_admin'::public.app_role
  ORDER BY u.created_at
  LIMIT 1;

  SELECT rm.id
  INTO maker_id
  FROM public.rab_maker rm
  JOIN public.proyek p ON p.id = rm.proyek_id
  WHERE p.jenis_pekerjaan = 'Perencanaan'
    AND COALESCE(p.is_deleted, false) = false
  ORDER BY rm.created_at
  LIMIT 1;

  IF actor_id IS NULL OR maker_id IS NULL THEN
    RAISE EXCEPTION 'Verification needs one active owner_admin and one active Perencanaan RAB Maker.';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', actor_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  SELECT count(*)
  INTO history_before
  FROM public.rab_export_history reh
  WHERE reh.rab_maker_id = maker_id;

  export_result := public.record_rab_export_file(
    maker_id,
    'xlsx',
    'rpc-hardening-verification.xlsx',
    1
  );

  SELECT count(*)
  INTO history_after
  FROM public.rab_export_history reh
  WHERE reh.rab_maker_id = maker_id;

  IF history_after <> history_before + 1 THEN
    RAISE EXCEPTION 'record_rab_export_file did not insert exactly one history row.';
  END IF;

  IF COALESCE(export_result->>'fileName', '') !~ E'-v[0-9]+\\.xlsx$' THEN
    RAISE EXCEPTION 'record_rab_export_file returned an invalid versioned filename: %', export_result;
  END IF;
END
$$;

DO $$
DECLARE
  actor_id uuid;
  rejected boolean := false;
BEGIN
  SELECT u.id
  INTO actor_id
  FROM public.users u
  WHERE u.role = 'owner_admin'::public.app_role
  ORDER BY u.created_at
  LIMIT 1;

  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Verification needs one active owner_admin.';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', actor_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    PERFORM public.import_ahsp_masterfile('{}'::jsonb);
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE 'Payload import AHSP tidak lengkap:%' THEN
        rejected := true;
      ELSE
        RAISE;
      END IF;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'import_ahsp_masterfile accepted an incomplete payload.';
  END IF;
END
$$;

ROLLBACK;

SELECT 'active RPC hardening verification passed' AS result;
