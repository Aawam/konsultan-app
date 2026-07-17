-- ============================================================
-- HARDEN ACTIVE RAB EXPORT AND AHSP IMPORT RPCS
--
-- 1. Repair the active versioned export RPC authorization dependency.
-- 2. Put strict payload validation in front of the existing transactional
--    AHSP import implementation.
-- 3. Remove anonymous/PUBLIC execution from both active RPCs.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.record_rab_export_file(
  target_rab_maker_id uuid,
  export_format text,
  base_file_name text,
  file_size_bytes integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_proyek_id uuid;
  next_version integer;
  clean_format text;
  file_extension text;
  file_stem text;
  versioned_file_name text;
BEGIN
  clean_format := lower(trim(export_format));

  IF clean_format NOT IN ('xlsx', 'pdf') THEN
    RAISE EXCEPTION 'Format export tidak valid: %', export_format;
  END IF;

  SELECT rm.proyek_id
  INTO target_proyek_id
  FROM public.rab_maker rm
  WHERE rm.id = target_rab_maker_id;

  IF target_proyek_id IS NULL THEN
    RAISE EXCEPTION 'RAB Maker tidak ditemukan.';
  END IF;

  IF NOT public.can_manage_project_rab(target_proyek_id) THEN
    RAISE EXCEPTION 'Tidak punya akses export RAB proyek ini.'
      USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(target_rab_maker_id::text, 0));

  SELECT COALESCE(MAX(reh.version_number), 0) + 1
  INTO next_version
  FROM public.rab_export_history reh
  WHERE reh.rab_maker_id = target_rab_maker_id;

  file_extension := substring(base_file_name from '(\.[^.]+)$');
  file_stem := regexp_replace(base_file_name, '\.[^.]*$', '');

  IF file_extension IS NULL OR file_extension = '' THEN
    file_extension := '.' || clean_format;
  END IF;

  IF file_stem IS NULL OR trim(file_stem) = '' THEN
    file_stem := 'rab-export';
  END IF;

  versioned_file_name := file_stem || '-v' || next_version || file_extension;

  INSERT INTO public.rab_export_history (
    rab_maker_id,
    proyek_id,
    version_number,
    export_format,
    file_name,
    file_size_bytes,
    exported_by
  )
  VALUES (
    target_rab_maker_id,
    target_proyek_id,
    next_version,
    clean_format,
    versioned_file_name,
    GREATEST(file_size_bytes, 0),
    auth.uid()
  );

  RETURN jsonb_build_object(
    'versionNumber', next_version,
    'fileName', versioned_file_name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_rab_export_file(uuid, text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_rab_export_file(uuid, text, text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_rab_export_file(uuid, text, text, integer) TO authenticated;

DO $$
BEGIN
  IF to_regprocedure('public.import_ahsp_masterfile_unchecked(jsonb)') IS NULL THEN
    IF to_regprocedure('public.import_ahsp_masterfile(jsonb)') IS NULL THEN
      RAISE EXCEPTION 'Required function public.import_ahsp_masterfile(jsonb) is missing.';
    END IF;

    ALTER FUNCTION public.import_ahsp_masterfile(jsonb)
      RENAME TO import_ahsp_masterfile_unchecked;
  END IF;
END
$$;

REVOKE ALL ON FUNCTION public.import_ahsp_masterfile_unchecked(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_ahsp_masterfile_unchecked(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.import_ahsp_masterfile_unchecked(jsonb) FROM authenticated;

COMMENT ON FUNCTION public.import_ahsp_masterfile_unchecked(jsonb) IS
  'Internal transactional implementation. Call import_ahsp_masterfile(jsonb), which validates the full replacement payload.';

CREATE OR REPLACE FUNCTION public.import_ahsp_masterfile(import_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF public.is_owner_admin() IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Hanya Owner/Admin yang boleh import AHSP.'
      USING ERRCODE = '42501';
  END IF;

  IF import_payload IS NULL OR jsonb_typeof(import_payload) <> 'object' THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid.';
  END IF;

  IF NOT import_payload ?& ARRAY['satuan', 'kategori', 'master', 'ahspItems', 'ahspDetails'] THEN
    RAISE EXCEPTION 'Payload import AHSP tidak lengkap: semua bagian wajib dikirim.';
  END IF;

  IF jsonb_typeof(import_payload->'satuan') <> 'array'
    OR jsonb_typeof(import_payload->'kategori') <> 'array'
    OR jsonb_typeof(import_payload->'master') <> 'object'
    OR jsonb_typeof(import_payload->'ahspItems') <> 'array'
    OR jsonb_typeof(import_payload->'ahspDetails') <> 'array' THEN
    RAISE EXCEPTION 'Payload import AHSP tidak lengkap: bentuk bagian utama tidak valid.';
  END IF;

  IF NOT (import_payload->'master') ?& ARRAY['upah', 'bahan', 'alat']
    OR jsonb_typeof(import_payload->'master'->'upah') <> 'array'
    OR jsonb_typeof(import_payload->'master'->'bahan') <> 'array'
    OR jsonb_typeof(import_payload->'master'->'alat') <> 'array' THEN
    RAISE EXCEPTION 'Payload import AHSP tidak lengkap: master upah, bahan, dan alat wajib berupa array.';
  END IF;

  IF jsonb_array_length(import_payload->'ahspItems') = 0
    OR jsonb_array_length(import_payload->'ahspDetails') = 0 THEN
    RAISE EXCEPTION 'Payload import AHSP tidak lengkap: AHSP item dan detail tidak boleh kosong.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(import_payload->'ahspItems') item
    WHERE jsonb_typeof(item) <> 'object'
      OR NULLIF(btrim(item->>'kode_analisa'), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: setiap item wajib punya kode_analisa.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(import_payload->'ahspDetails') detail
    WHERE jsonb_typeof(detail) <> 'object'
      OR NULLIF(btrim(detail->>'kode_ahsp'), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: setiap detail wajib punya kode_ahsp.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(import_payload->'ahspItems') item
    GROUP BY lower(btrim(item->>'kode_analisa'))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: kode_analisa duplikat.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(import_payload->'ahspItems') item
    WHERE NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(import_payload->'ahspDetails') detail
      WHERE lower(btrim(detail->>'kode_ahsp')) = lower(btrim(item->>'kode_analisa'))
    )
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: setiap AHSP item wajib memiliki minimal satu detail komponen.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(import_payload->'ahspDetails') detail
    WHERE NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(import_payload->'ahspItems') item
      WHERE lower(btrim(item->>'kode_analisa')) = lower(btrim(detail->>'kode_ahsp'))
    )
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: detail mengacu ke AHSP item yang tidak dikirim.';
  END IF;

  RETURN public.import_ahsp_masterfile_unchecked(import_payload);
END;
$$;

REVOKE ALL ON FUNCTION public.import_ahsp_masterfile(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_ahsp_masterfile(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.import_ahsp_masterfile(jsonb) TO authenticated;

COMMIT;
