-- ============================================================
-- KONSULTAN APP - VERSIONED RAB EXPORT FILE RPC
--
-- Purpose:
-- Record RAB exports with the generated version in the stored/downloaded
-- filename, while locking per RAB maker to avoid duplicate version numbers.
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
SET search_path = public
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

  IF NOT public.can_access_project_rab(target_proyek_id) THEN
    RAISE EXCEPTION 'Tidak punya akses export RAB proyek ini.';
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
GRANT EXECUTE ON FUNCTION public.record_rab_export_file(uuid, text, text, integer) TO authenticated;

COMMIT;
