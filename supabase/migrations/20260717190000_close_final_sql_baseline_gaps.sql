-- ============================================================
-- CLOSE FINAL SQL BASELINE GAPS
--
-- 1. Make RAB mutation readiness identical to the application gate.
-- 2. Reject NaN/infinity at every active numeric storage boundary.
-- 3. Separate RAB read access from mutation readiness.
-- 4. Finish SECURITY DEFINER search_path and EXECUTE hardening.
-- ============================================================

BEGIN;

SET LOCAL lock_timeout = '10s';

-- NOT VALID makes each constraint start protecting new writes immediately
-- without scanning existing rows under the stronger ADD CONSTRAINT lock.

ALTER TABLE public.proyek
  DROP CONSTRAINT IF EXISTS proyek_pagu_dana_finite,
  DROP CONSTRAINT IF EXISTS proyek_hps_finite,
  DROP CONSTRAINT IF EXISTS proyek_nilai_penawaran_finite,
  ADD CONSTRAINT proyek_pagu_dana_finite CHECK (pagu_dana NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT proyek_hps_finite CHECK (hps NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT proyek_nilai_penawaran_finite CHECK (nilai_penawaran NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID;

ALTER TABLE public.proyek_internal
  DROP CONSTRAINT IF EXISTS proyek_internal_nilai_kontrak_jasa_finite,
  DROP CONSTRAINT IF EXISTS proyek_internal_piutang_finite,
  ADD CONSTRAINT proyek_internal_nilai_kontrak_jasa_finite CHECK (nilai_kontrak_jasa NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT proyek_internal_piutang_finite CHECK (piutang NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID;

ALTER TABLE public.master_upah
  DROP CONSTRAINT IF EXISTS master_upah_harga_dasar_finite,
  ADD CONSTRAINT master_upah_harga_dasar_finite CHECK (harga_dasar NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID;

ALTER TABLE public.master_bahan
  DROP CONSTRAINT IF EXISTS master_bahan_harga_dasar_finite,
  ADD CONSTRAINT master_bahan_harga_dasar_finite CHECK (harga_dasar NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID;

ALTER TABLE public.master_alat
  DROP CONSTRAINT IF EXISTS master_alat_harga_dasar_finite,
  ADD CONSTRAINT master_alat_harga_dasar_finite CHECK (harga_dasar NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID;

ALTER TABLE public.ahsp_items
  DROP CONSTRAINT IF EXISTS ahsp_items_profit_persen_default_finite,
  ADD CONSTRAINT ahsp_items_profit_persen_default_finite CHECK (profit_persen_default NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID;

ALTER TABLE public.ahsp_details
  DROP CONSTRAINT IF EXISTS ahsp_details_koefisien_finite,
  ADD CONSTRAINT ahsp_details_koefisien_finite CHECK (koefisien NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID;

ALTER TABLE public.rab_maker
  DROP CONSTRAINT IF EXISTS rab_maker_ppn_persen_finite,
  DROP CONSTRAINT IF EXISTS rab_maker_subtotal_finite,
  DROP CONSTRAINT IF EXISTS rab_maker_ppn_nilai_finite,
  DROP CONSTRAINT IF EXISTS rab_maker_total_final_finite,
  ADD CONSTRAINT rab_maker_ppn_persen_finite CHECK (ppn_persen NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT rab_maker_subtotal_finite CHECK (subtotal NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT rab_maker_ppn_nilai_finite CHECK (ppn_nilai NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT rab_maker_total_final_finite CHECK (total_final NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID;

ALTER TABLE public.rab_maker_items
  DROP CONSTRAINT IF EXISTS rab_maker_items_volume_finite,
  DROP CONSTRAINT IF EXISTS rab_maker_items_profit_default_finite,
  DROP CONSTRAINT IF EXISTS rab_maker_items_profit_final_finite,
  DROP CONSTRAINT IF EXISTS rab_maker_items_harga_dasar_total_finite,
  DROP CONSTRAINT IF EXISTS rab_maker_items_profit_nilai_finite,
  DROP CONSTRAINT IF EXISTS rab_maker_items_harga_satuan_finite,
  DROP CONSTRAINT IF EXISTS rab_maker_items_jumlah_harga_finite,
  ADD CONSTRAINT rab_maker_items_volume_finite CHECK (volume NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT rab_maker_items_profit_default_finite CHECK (profit_persen_default NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT rab_maker_items_profit_final_finite CHECK (profit_persen_final NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT rab_maker_items_harga_dasar_total_finite CHECK (harga_dasar_total NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT rab_maker_items_profit_nilai_finite CHECK (profit_nilai NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT rab_maker_items_harga_satuan_finite CHECK (harga_satuan NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT rab_maker_items_jumlah_harga_finite CHECK (jumlah_harga NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID;

ALTER TABLE public.rab_maker_item_details
  DROP CONSTRAINT IF EXISTS rab_maker_item_details_koefisien_finite,
  DROP CONSTRAINT IF EXISTS rab_maker_item_details_harga_default_finite,
  DROP CONSTRAINT IF EXISTS rab_maker_item_details_harga_final_finite,
  DROP CONSTRAINT IF EXISTS rab_maker_item_details_jumlah_finite,
  ADD CONSTRAINT rab_maker_item_details_koefisien_finite CHECK (koefisien_snapshot NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT rab_maker_item_details_harga_default_finite CHECK (harga_dasar_default NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT rab_maker_item_details_harga_final_finite CHECK (harga_dasar_final NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID,
  ADD CONSTRAINT rab_maker_item_details_jumlah_finite CHECK (jumlah_harga_dasar NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)) NOT VALID;

COMMIT;

-- VALIDATE uses SHARE UPDATE EXCLUSIVE rather than the write-blocking lock used
-- by ADD CONSTRAINT. A bounded timeout makes large-table behavior fail closed.
BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '5min';

ALTER TABLE public.proyek
  VALIDATE CONSTRAINT proyek_pagu_dana_finite,
  VALIDATE CONSTRAINT proyek_hps_finite,
  VALIDATE CONSTRAINT proyek_nilai_penawaran_finite;

ALTER TABLE public.proyek_internal
  VALIDATE CONSTRAINT proyek_internal_nilai_kontrak_jasa_finite,
  VALIDATE CONSTRAINT proyek_internal_piutang_finite;

ALTER TABLE public.master_upah VALIDATE CONSTRAINT master_upah_harga_dasar_finite;
ALTER TABLE public.master_bahan VALIDATE CONSTRAINT master_bahan_harga_dasar_finite;
ALTER TABLE public.master_alat VALIDATE CONSTRAINT master_alat_harga_dasar_finite;
ALTER TABLE public.ahsp_items VALIDATE CONSTRAINT ahsp_items_profit_persen_default_finite;
ALTER TABLE public.ahsp_details VALIDATE CONSTRAINT ahsp_details_koefisien_finite;

ALTER TABLE public.rab_maker
  VALIDATE CONSTRAINT rab_maker_ppn_persen_finite,
  VALIDATE CONSTRAINT rab_maker_subtotal_finite,
  VALIDATE CONSTRAINT rab_maker_ppn_nilai_finite,
  VALIDATE CONSTRAINT rab_maker_total_final_finite;

ALTER TABLE public.rab_maker_items
  VALIDATE CONSTRAINT rab_maker_items_volume_finite,
  VALIDATE CONSTRAINT rab_maker_items_profit_default_finite,
  VALIDATE CONSTRAINT rab_maker_items_profit_final_finite,
  VALIDATE CONSTRAINT rab_maker_items_harga_dasar_total_finite,
  VALIDATE CONSTRAINT rab_maker_items_profit_nilai_finite,
  VALIDATE CONSTRAINT rab_maker_items_harga_satuan_finite,
  VALIDATE CONSTRAINT rab_maker_items_jumlah_harga_finite;

ALTER TABLE public.rab_maker_item_details
  VALIDATE CONSTRAINT rab_maker_item_details_koefisien_finite,
  VALIDATE CONSTRAINT rab_maker_item_details_harga_default_finite,
  VALIDATE CONSTRAINT rab_maker_item_details_harga_final_finite,
  VALIDATE CONSTRAINT rab_maker_item_details_jumlah_finite;

CREATE OR REPLACE FUNCTION public.can_access_project_rab(target_proyek_id uuid)
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

CREATE OR REPLACE FUNCTION public.has_complete_project_rab_core(target_proyek_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.proyek p
    WHERE p.id = target_proyek_id
      AND COALESCE(p.is_deleted, false) = false
      AND p.jenis_pekerjaan = 'Perencanaan'
      AND NULLIF(btrim(p.nama_proyek), '') IS NOT NULL
      AND NULLIF(btrim(p.kategori_pekerjaan), '') IS NOT NULL
      AND p.tahun_anggaran > 0
      AND NULLIF(btrim(p.sumber_dana), '') IS NOT NULL
      AND NULLIF(btrim(p.dinas), '') IS NOT NULL
      AND p.perusahaan_id IS NOT NULL
      AND NULLIF(btrim(p.lokasi_kecamatan), '') IS NOT NULL
      AND NULLIF(btrim(p.nama_ppk), '') IS NOT NULL
      AND p.tanggal_mulai IS NOT NULL
      AND p.tanggal_selesai IS NOT NULL
      AND NULLIF(btrim(p.status_proyek), '') IS NOT NULL
      AND NULLIF(btrim(p.tahap_progress), '') IS NOT NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.is_project_rab_ready(target_proyek_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT public.has_complete_project_rab_core(target_proyek_id)
    AND EXISTS (
      SELECT 1
      FROM public.proyek p
      WHERE p.id = target_proyek_id
        AND p.tahap_progress IN (
          'Penyusunan Laporan Akhir & RAB',
          'Penyerahan & Revisi',
          'Selesai (BAST)'
        )
    )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_project_rab(target_proyek_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT public.can_access_project_rab(target_proyek_id)
    AND public.is_project_rab_ready(target_proyek_id)
$$;

-- Read access remains available for active planning projects even when a project
-- is temporarily outside the mutation-ready workflow. All active write RPCs use
-- can_manage_project_rab(), which now includes the full readiness gate.
DROP POLICY IF EXISTS "rab_maker project team read" ON public.rab_maker;
CREATE POLICY "rab_maker project team read" ON public.rab_maker
FOR SELECT TO authenticated
USING (public.can_access_project_rab(proyek_id));

DROP POLICY IF EXISTS "rab_maker_sections project team read" ON public.rab_maker_sections;
CREATE POLICY "rab_maker_sections project team read" ON public.rab_maker_sections
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.rab_maker rm
    WHERE rm.id = rab_maker_sections.rab_maker_id
      AND public.can_access_project_rab(rm.proyek_id)
  )
);

DROP POLICY IF EXISTS "rab_maker_items project team read" ON public.rab_maker_items;
CREATE POLICY "rab_maker_items project team read" ON public.rab_maker_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.rab_maker rm
    WHERE rm.id = rab_maker_items.rab_maker_id
      AND public.can_access_project_rab(rm.proyek_id)
  )
);

DROP POLICY IF EXISTS "rab_maker_item_details project team read" ON public.rab_maker_item_details;
CREATE POLICY "rab_maker_item_details project team read" ON public.rab_maker_item_details
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.rab_maker_items rmi
    JOIN public.rab_maker rm ON rm.id = rmi.rab_maker_id
    WHERE rmi.id = rab_maker_item_details.rab_maker_item_id
      AND public.can_access_project_rab(rm.proyek_id)
  )
);

DROP POLICY IF EXISTS "rab_audit_log project team read" ON public.rab_audit_log;
CREATE POLICY "rab_audit_log project team read" ON public.rab_audit_log
FOR SELECT TO authenticated
USING (public.is_owner_admin() OR public.can_access_project_rab(proyek_id));

DROP POLICY IF EXISTS "rab_export_history project team read" ON public.rab_export_history;
CREATE POLICY "rab_export_history project team read" ON public.rab_export_history
FOR SELECT TO authenticated
USING (public.can_access_project_rab(proyek_id));

-- The workflow transition is itself an executable boundary. Recheck the same
-- core fields used by evaluateProjectWorkflowTransition() before advancing it.
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

  SELECT p.id, p.jenis_pekerjaan, p.tahap_progress, p.persentase_progress
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

  IF public.has_complete_project_rab_core(target_proyek_id) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Data inti proyek belum lengkap untuk workflow RAB.'
      USING ERRCODE = '23514';
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

-- Every SECURITY DEFINER body below already schema-qualifies application
-- objects. Keep only the trusted pg_catalog implicit lookup path.
ALTER FUNCTION public.create_rab_maker_from_ahsp(uuid, uuid) SET search_path = pg_catalog;
ALTER FUNCTION public.delete_rab_maker_item(uuid) SET search_path = pg_catalog;
ALTER FUNCTION public.get_proyek_teknis_unchecked(uuid) SET search_path = pg_catalog;
ALTER FUNCTION public.handle_new_auth_user() SET search_path = pg_catalog;
ALTER FUNCTION public.recalculate_rab_maker(uuid) SET search_path = pg_catalog;
ALTER FUNCTION public.update_rab_maker_detail_harga_dasar(uuid, numeric, text) SET search_path = pg_catalog;
ALTER FUNCTION public.update_rab_maker_item_profit(uuid, numeric, text) SET search_path = pg_catalog;
ALTER FUNCTION public.update_rab_maker_item_volume(uuid, numeric) SET search_path = pg_catalog;

REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_owner_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_project_rab(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_project_rab(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_project_rab(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_project_rab(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.has_complete_project_rab_core(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_project_rab_ready(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.transition_project_workflow_to_rab_ready(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_project_workflow_to_rab_ready(uuid, text) TO authenticated;

COMMIT;
