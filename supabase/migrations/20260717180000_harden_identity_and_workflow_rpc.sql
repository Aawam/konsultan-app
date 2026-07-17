-- ============================================================
-- HARDEN IDENTITY HELPERS AND PROJECT WORKFLOW RPC
--
-- Keep the deployed migration history append-only while repairing the active
-- definitions: fail closed for missing app profiles, use a trusted search
-- path, and derive audit identity from auth.uid() instead of caller input.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT u.role
  FROM public.users u
  WHERE u.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_owner_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    public.current_app_role() = 'owner_admin'::public.app_role,
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_project_rab(target_proyek_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT public.current_app_role() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.proyek p
      WHERE p.id = target_proyek_id
        AND p.jenis_pekerjaan = 'Perencanaan'
        AND COALESCE(p.is_deleted, false) = false
    )
$$;

CREATE OR REPLACE FUNCTION public.transition_project_workflow_to_rab_ready(
  target_proyek_id uuid,
  actor_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  project_row record;
  trusted_actor_email text;
  target_tahap text := 'Penyusunan Laporan Akhir & RAB';
  target_percent integer := 80;
BEGIN
  IF public.is_owner_admin() IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Hanya Owner/Admin yang boleh mengubah workflow proyek.'
      USING ERRCODE = '42501';
  END IF;

  SELECT u.email
  INTO trusted_actor_email
  FROM public.users u
  WHERE u.id = auth.uid();

  IF trusted_actor_email IS NULL THEN
    RAISE EXCEPTION 'User belum terdaftar sebagai anggota aplikasi.'
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
    trusted_actor_email,
    now()
  );

  RETURN target_proyek_id;
END;
$$;

COMMENT ON FUNCTION public.transition_project_workflow_to_rab_ready(uuid, text) IS
  'Owner/admin-only atomic workflow transition. actor_email is retained for API compatibility but ignored; audit identity comes from auth.uid().';

REVOKE ALL ON FUNCTION public.transition_project_workflow_to_rab_ready(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_project_workflow_to_rab_ready(uuid, text) TO authenticated;

COMMIT;
