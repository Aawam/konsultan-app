\set ON_ERROR_STOP on

-- Read-only verification for get_proyek_teknis_page.
-- Run after applying 20260716100000_paginated_technical_project_read_rpc.sql.

BEGIN;

DO $$
DECLARE
  actor_id uuid;
  function_signature text := 'public.get_proyek_teknis_page(integer,integer,integer,text,text,uuid,text,text)';
  function_config text[];
  is_security_definer boolean;
  payload jsonb;
  first_row jsonb;
BEGIN
  IF to_regprocedure(function_signature) IS NULL THEN
    RAISE EXCEPTION 'Missing function: %', function_signature;
  END IF;

  SELECT p.prosecdef, p.proconfig
  INTO is_security_definer, function_config
  FROM pg_proc p
  WHERE p.oid = to_regprocedure(function_signature);

  IF NOT is_security_definer
    OR NOT ('search_path=pg_catalog' = ANY(COALESCE(function_config, ARRAY[]::text[])))
  THEN
    RAISE EXCEPTION 'Function security settings are not hardened: %', function_config;
  END IF;

  IF has_function_privilege('anon', function_signature, 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not be able to execute %', function_signature;
  END IF;

  IF NOT has_function_privilege('authenticated', function_signature, 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must be able to execute %', function_signature;
  END IF;

  SELECT u.id
  INTO actor_id
  FROM public.users u
  ORDER BY u.created_at
  LIMIT 1;

  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Verification needs one application member in public.users.';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', actor_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  SELECT public.get_proyek_teknis_page(
    target_page => 2147483647,
    target_page_size => 1000,
    target_search => repeat('x', 200)
  )
  INTO payload;

  IF jsonb_typeof(payload) <> 'object'
    OR jsonb_typeof(payload->'rows') <> 'array'
    OR jsonb_typeof(payload->'total') <> 'number'
    OR jsonb_typeof(payload->'page') <> 'number'
    OR jsonb_typeof(payload->'pageSize') <> 'number'
    OR jsonb_typeof(payload->'pageCount') <> 'number'
  THEN
    RAISE EXCEPTION 'Unexpected pagination payload: %', payload;
  END IF;

  IF (payload->>'pageSize')::integer <> 100 THEN
    RAISE EXCEPTION 'Page size was not capped at 100: %', payload;
  END IF;

  IF (payload->>'page')::integer < 1
    OR (payload->>'page')::integer > (payload->>'pageCount')::integer
  THEN
    RAISE EXCEPTION 'Page was not clamped into the valid range: %', payload;
  END IF;

  first_row := payload->'rows'->0;
  IF first_row IS NOT NULL AND first_row ?| ARRAY[
    'pagu_dana',
    'hps',
    'nilai_penawaran',
    'catatan'
  ] THEN
    RAISE EXCEPTION 'Commercial fields leaked through the technical projection: %', first_row;
  END IF;

  -- A literal backslash must remain a valid search term, not an invalid LIKE escape.
  PERFORM public.get_proyek_teknis_page(target_search => chr(92));
END
$$;

SELECT
  (payload->>'total')::integer AS total,
  (payload->>'page')::integer AS page,
  (payload->>'pageSize')::integer AS page_size,
  (payload->>'pageCount')::integer AS page_count
FROM (
  SELECT public.get_proyek_teknis_page(
    target_page => 1,
    target_page_size => 25
  ) AS payload
) AS verification_summary;

ROLLBACK;
