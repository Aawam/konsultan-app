-- ============================================================
-- AHSP IMPORT REPLAY VERIFICATION
--
-- Proves that same-name/different-unit components are unambiguous and that
-- replay updates coefficients without replacing ahsp_details.id.
-- All fixture rows are rolled back.
-- ============================================================

BEGIN;

DO $$
DECLARE
  role_name text;
BEGIN
  -- A PUBLIC grant would also make these checks true for anon/authenticated.
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF has_function_privilege(role_name, 'public.import_ahsp_masterfile_unchecked(jsonb)', 'EXECUTE') THEN
      RAISE EXCEPTION '% can execute import_ahsp_masterfile_unchecked.', role_name;
    END IF;
  END LOOP;

  IF NOT has_function_privilege('authenticated', 'public.import_ahsp_masterfile(jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated cannot execute import_ahsp_masterfile.';
  END IF;

  IF has_function_privilege('anon', 'public.import_ahsp_masterfile(jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can execute import_ahsp_masterfile.';
  END IF;
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
    PERFORM public.import_ahsp_masterfile('{}'::jsonb);
  EXCEPTION
    WHEN insufficient_privilege THEN
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Import accepted an authenticated identity without public.users membership.';
  END IF;
END
$$;

RESET ROLE;

DO $$
DECLARE
  actor_id uuid;
  suffix text := replace(gen_random_uuid()::text, '-', '');
  payload jsonb;
BEGIN
  SELECT id INTO actor_id
  FROM public.users
  WHERE role = 'owner_admin'::public.app_role
  ORDER BY created_at
  LIMIT 1;

  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Verification needs one owner_admin.';
  END IF;

  payload := jsonb_build_object(
    'satuan', jsonb_build_array('verify-output-' || suffix, 'verify-unit-a-' || suffix, 'verify-unit-b-' || suffix),
    'kategori', jsonb_build_array('verify-category-' || suffix),
    'master', jsonb_build_object(
      'upah', '[]'::jsonb,
      'bahan', jsonb_build_array(
        jsonb_build_object('nama', 'verify-component-' || suffix, 'satuan', 'verify-unit-a-' || suffix, 'harga_dasar', 100),
        jsonb_build_object('nama', 'verify-component-' || suffix, 'satuan', 'verify-unit-b-' || suffix, 'harga_dasar', 200)
      ),
      'alat', '[]'::jsonb
    ),
    'ahspItems', jsonb_build_array(
      jsonb_build_object(
        'kode_analisa', 'VERIFY.' || suffix,
        'uraian_pekerjaan', 'Verification replay-safe AHSP',
        'kategori', 'verify-category-' || suffix,
        'satuan', 'verify-output-' || suffix,
        'bidang', 'CK',
        'sub_bidang', NULL,
        'profit_persen_default', 10
      )
    ),
    'ahspDetails', jsonb_build_array(
      jsonb_build_object(
        'kode_ahsp', 'VERIFY.' || suffix,
        'komponen_tipe', 'bahan',
        'nama_komponen', 'verify-component-' || suffix,
        'satuan', 'verify-unit-a-' || suffix,
        'koefisien', 1.25,
        'urutan', 1
      ),
      jsonb_build_object(
        'kode_ahsp', 'VERIFY.' || suffix,
        'komponen_tipe', 'bahan',
        'nama_komponen', 'verify-component-' || suffix,
        'satuan', 'verify-unit-b-' || suffix,
        'koefisien', 3.5,
        'urutan', 2
      )
    )
  );

  PERFORM set_config('verification.actor_id', actor_id::text, true);
  PERFORM set_config('verification.ahsp_code', 'VERIFY.' || suffix, true);
  PERFORM set_config('verification.component_name', 'verify-component-' || suffix, true);
  PERFORM set_config('verification.unit_a', 'verify-unit-a-' || suffix, true);
  PERFORM set_config('verification.unit_b', 'verify-unit-b-' || suffix, true);
  PERFORM set_config('verification.payload', payload::text, true);
END
$$;

SELECT set_config('request.jwt.claim.sub', current_setting('verification.actor_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;
SELECT public.import_ahsp_masterfile(current_setting('verification.payload')::jsonb);
RESET ROLE;

DO $$
DECLARE
  detail_id_a uuid;
  detail_id_b uuid;
BEGIN
  SELECT ad.id INTO detail_id_a
  FROM public.ahsp_details ad
  JOIN public.ahsp_items ai ON ai.id = ad.ahsp_item_id
  JOIN public.master_bahan mb ON mb.id = ad.bahan_id
  JOIN public.satuan s ON s.id = mb.satuan_id
  WHERE ai.kode_analisa = current_setting('verification.ahsp_code')
    AND s.nama_satuan = current_setting('verification.unit_a');

  SELECT ad.id INTO detail_id_b
  FROM public.ahsp_details ad
  JOIN public.ahsp_items ai ON ai.id = ad.ahsp_item_id
  JOIN public.master_bahan mb ON mb.id = ad.bahan_id
  JOIN public.satuan s ON s.id = mb.satuan_id
  WHERE ai.kode_analisa = current_setting('verification.ahsp_code')
    AND s.nama_satuan = current_setting('verification.unit_b');

  IF detail_id_a IS NULL OR detail_id_b IS NULL THEN
    RAISE EXCEPTION 'First import did not resolve both same-name/different-unit details.';
  END IF;

  PERFORM set_config('verification.detail_id_a', detail_id_a::text, true);
  PERFORM set_config('verification.detail_id_b', detail_id_b::text, true);
  PERFORM set_config(
    'verification.payload',
    jsonb_set(
      current_setting('verification.payload')::jsonb #- '{ahspDetails,1}',
      '{ahspDetails,0,koefisien}',
      '2.5'::jsonb
    )::text,
    true
  );
END
$$;

SELECT set_config('request.jwt.claim.sub', current_setting('verification.actor_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;
SELECT public.import_ahsp_masterfile(current_setting('verification.payload')::jsonb);
RESET ROLE;

DO $$
DECLARE
  replayed_detail_id uuid;
  replayed_coefficient numeric;
  replayed_unit text;
  omitted_detail_count integer;
  component_count integer;
BEGIN
  SELECT ad.id, ad.koefisien, s.nama_satuan
  INTO replayed_detail_id, replayed_coefficient, replayed_unit
  FROM public.ahsp_details ad
  JOIN public.ahsp_items ai ON ai.id = ad.ahsp_item_id
  JOIN public.master_bahan mb ON mb.id = ad.bahan_id
  JOIN public.satuan s ON s.id = mb.satuan_id
  WHERE ai.kode_analisa = current_setting('verification.ahsp_code')
    AND s.nama_satuan = current_setting('verification.unit_a');

  IF replayed_detail_id IS DISTINCT FROM current_setting('verification.detail_id_a')::uuid THEN
    RAISE EXCEPTION 'Replay replaced ahsp_details.id and would break snapshot lineage.';
  END IF;

  IF replayed_coefficient IS DISTINCT FROM 2.5::numeric THEN
    RAISE EXCEPTION 'Replay did not update the existing detail coefficient.';
  END IF;

  IF replayed_unit IS DISTINCT FROM current_setting('verification.unit_a') THEN
    RAISE EXCEPTION 'Replay resolved the detail to the wrong component unit: %', replayed_unit;
  END IF;

  SELECT count(*) INTO omitted_detail_count
  FROM public.ahsp_details
  WHERE id = current_setting('verification.detail_id_b')::uuid;

  IF omitted_detail_count <> 0 THEN
    RAISE EXCEPTION 'Replay did not delete the detail omitted from the imported AHSP item.';
  END IF;

  SELECT count(*) INTO component_count
  FROM public.master_bahan mb
  WHERE mb.nama_bahan = current_setting('verification.component_name');

  IF component_count <> 2 THEN
    RAISE EXCEPTION 'Same-name/different-unit master components were not preserved: %', component_count;
  END IF;
END
$$;

ROLLBACK;

SELECT 'AHSP import replay verification passed' AS result;
