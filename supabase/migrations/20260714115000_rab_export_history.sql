-- ============================================================
-- KONSULTAN APP - RAB EXPORT HISTORY
-- Purpose:
-- Track generated RAB export files as versioned artifacts per RAB Maker.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.rab_export_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rab_maker_id uuid NOT NULL REFERENCES public.rab_maker(id) ON DELETE CASCADE,
  proyek_id uuid NOT NULL REFERENCES public.proyek(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  export_format text NOT NULL CHECK (export_format IN ('xlsx', 'pdf')),
  file_name text NOT NULL,
  file_size_bytes integer NOT NULL CHECK (file_size_bytes >= 0),
  exported_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  exported_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (rab_maker_id, version_number)
);

CREATE INDEX IF NOT EXISTS rab_export_history_rab_maker_idx ON public.rab_export_history(rab_maker_id);
CREATE INDEX IF NOT EXISTS rab_export_history_proyek_idx ON public.rab_export_history(proyek_id);
CREATE INDEX IF NOT EXISTS rab_export_history_exported_at_idx ON public.rab_export_history(exported_at DESC);

ALTER TABLE public.rab_export_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rab_export_history project team read" ON public.rab_export_history;
CREATE POLICY "rab_export_history project team read" ON public.rab_export_history
FOR SELECT TO authenticated
USING (public.can_manage_project_rab(proyek_id));

DROP POLICY IF EXISTS "rab_export_history project team insert" ON public.rab_export_history;
CREATE POLICY "rab_export_history project team insert" ON public.rab_export_history
FOR INSERT TO authenticated
WITH CHECK (public.can_manage_project_rab(proyek_id));

GRANT SELECT, INSERT ON TABLE public.rab_export_history TO authenticated;

CREATE OR REPLACE FUNCTION public.record_rab_export_history(
  target_rab_maker_id uuid,
  export_format text,
  file_name text,
  file_size_bytes integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  maker_row record;
  next_version integer;
BEGIN
  IF export_format NOT IN ('xlsx', 'pdf') THEN
    RAISE EXCEPTION 'Format export tidak valid.'
      USING ERRCODE = 'P0001';
  END IF;

  IF file_size_bytes IS NULL OR file_size_bytes < 0 THEN
    RAISE EXCEPTION 'Ukuran file export tidak valid.'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT rm.id, rm.proyek_id
  INTO maker_row
  FROM public.rab_maker rm
  WHERE rm.id = target_rab_maker_id
    AND public.can_manage_project_rab(rm.proyek_id)
  FOR UPDATE;

  IF maker_row.id IS NULL THEN
    RAISE EXCEPTION 'RAB Maker tidak ditemukan.'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT COALESCE(MAX(reh.version_number), 0) + 1
  INTO next_version
  FROM public.rab_export_history reh
  WHERE reh.rab_maker_id = maker_row.id;

  INSERT INTO public.rab_export_history (
    rab_maker_id,
    proyek_id,
    version_number,
    export_format,
    file_name,
    file_size_bytes,
    exported_by,
    metadata
  )
  VALUES (
    maker_row.id,
    maker_row.proyek_id,
    next_version,
    export_format,
    COALESCE(NULLIF(btrim(file_name), ''), 'rab-export'),
    file_size_bytes,
    auth.uid(),
    jsonb_build_object('source', 'rab_export_route')
  );

  RETURN next_version;
END;
$$;

REVOKE ALL ON FUNCTION public.record_rab_export_history(uuid, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_rab_export_history(uuid, text, text, integer) TO authenticated;

COMMIT;
