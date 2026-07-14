-- ============================================================
-- KONSULTAN APP - PROJECT WORKFLOW TRANSITION RPC
-- Purpose:
-- Make the RAB-ready workflow transition atomic: update public.proyek and
-- insert public.override_log in one database transaction/RPC.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.transition_project_workflow_to_rab_ready(
  target_proyek_id uuid,
  actor_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_row record;
  target_tahap text := 'Penyusunan Laporan Akhir & RAB';
  target_percent integer := 80;
BEGIN
  IF NOT public.is_owner_admin() THEN
    RAISE EXCEPTION 'Hanya Owner/Admin yang boleh mengubah workflow proyek.'
      USING ERRCODE = '42501';
  END IF;

  SELECT
    p.id,
    p.jenis_pekerjaan,
    p.tahap_progress,
    p.persentase_progress
  INTO project_row
  FROM public.proyek p
  WHERE p.id = target_proyek_id
    AND COALESCE(p.is_deleted, false) = false
  FOR UPDATE;

  IF project_row.id IS NULL THEN
    RAISE EXCEPTION 'Proyek tidak ditemukan.'
      USING ERRCODE = 'P0002';
  END IF;

  IF project_row.jenis_pekerjaan <> 'Perencanaan' THEN
    RAISE EXCEPTION 'Hanya proyek Perencanaan yang bisa dipindahkan ke workflow RAB.'
      USING ERRCODE = 'P0001';
  END IF;

  IF project_row.tahap_progress = target_tahap
    AND project_row.persentase_progress = target_percent THEN
    RAISE EXCEPTION 'Proyek sudah berada pada workflow RAB.'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.proyek
  SET tahap_progress = target_tahap,
      persentase_progress = target_percent
  WHERE id = target_proyek_id;

  INSERT INTO public.override_log (
    proyek_id,
    field_dioverride,
    nilai_sebelum,
    nilai_sesudah,
    alasan,
    dilakukan_oleh,
    dilakukan_pada
  )
  VALUES (
    target_proyek_id,
    'Workflow RAB',
    COALESCE(project_row.tahap_progress, '-'),
    target_tahap,
    'Transisi workflow: Tandai siap RAB.',
    COALESCE(NULLIF(btrim(actor_email), ''), 'Authenticated User'),
    now()
  );

  RETURN target_proyek_id;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_project_workflow_to_rab_ready(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_project_workflow_to_rab_ready(uuid, text) TO authenticated;

COMMIT;
