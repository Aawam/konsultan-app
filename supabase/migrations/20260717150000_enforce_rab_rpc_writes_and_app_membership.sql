-- ============================================================
-- ENFORCE RPC-ONLY RAB WRITES AND APPLICATION MEMBERSHIP
--
-- Prevent authenticated clients from bypassing RAB calculation, locking,
-- approval, and audit RPCs through direct table writes. Technical project
-- SECURITY DEFINER reads must also reject auth identities without an app
-- profile in public.users.
-- ============================================================

BEGIN;

SET LOCAL lock_timeout = '10s';

LOCK TABLE
  public.rab_maker,
  public.rab_maker_sections,
  public.rab_maker_items,
  public.rab_maker_item_details
IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION public.prevent_locked_rab_maker_child_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  target_maker_id uuid;
  new_maker_id uuid;
  maker_status public.rab_status;
BEGIN
  IF TG_TABLE_NAME = 'rab_maker_item_details' THEN
    SELECT rmi.rab_maker_id
    INTO target_maker_id
    FROM public.rab_maker_items rmi
    WHERE rmi.id = CASE
      WHEN TG_OP = 'INSERT' THEN NEW.rab_maker_item_id
      ELSE OLD.rab_maker_item_id
    END;
  ELSIF TG_OP = 'INSERT' THEN
    target_maker_id := NEW.rab_maker_id;
  ELSE
    target_maker_id := OLD.rab_maker_id;
  END IF;

  SELECT rm.status
  INTO maker_status
  FROM public.rab_maker rm
  WHERE rm.id = target_maker_id
  FOR UPDATE;

  IF maker_status IN ('validated'::public.rab_status, 'final'::public.rab_status) THEN
    RAISE EXCEPTION 'RAB sudah disetujui/final dan tidak bisa diubah.'
      USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'rab_maker_item_details' THEN
      SELECT rmi.rab_maker_id
      INTO new_maker_id
      FROM public.rab_maker_items rmi
      WHERE rmi.id = NEW.rab_maker_item_id;
    ELSE
      new_maker_id := NEW.rab_maker_id;
    END IF;

    IF new_maker_id IS DISTINCT FROM target_maker_id THEN
      SELECT rm.status
      INTO maker_status
      FROM public.rab_maker rm
      WHERE rm.id = new_maker_id
      FOR UPDATE;

      IF maker_status IN ('validated'::public.rab_status, 'final'::public.rab_status) THEN
        RAISE EXCEPTION 'RAB sudah disetujui/final dan tidak bisa diubah.'
          USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_locked_rab_maker_child_change() FROM PUBLIC, authenticated, anon;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.rab_maker FROM PUBLIC, authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.rab_maker_sections FROM PUBLIC, authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.rab_maker_items FROM PUBLIC, authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.rab_maker_item_details FROM PUBLIC, authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.rab_draft FROM PUBLIC, authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.rab_rekap FROM PUBLIC, authenticated, anon;
REVOKE INSERT ON TABLE public.rab_audit_log FROM PUBLIC, authenticated, anon;
REVOKE INSERT ON TABLE public.rab_export_history FROM PUBLIC, authenticated, anon;

DROP POLICY IF EXISTS "rab_maker project team write" ON public.rab_maker;
DROP POLICY IF EXISTS "rab_maker_sections project team write" ON public.rab_maker_sections;
DROP POLICY IF EXISTS "rab_maker_items project team write" ON public.rab_maker_items;
DROP POLICY IF EXISTS "rab_maker_item_details project team write" ON public.rab_maker_item_details;
DROP POLICY IF EXISTS "rab_draft project team write" ON public.rab_draft;
DROP POLICY IF EXISTS "rab_rekap project team write" ON public.rab_rekap;
DROP POLICY IF EXISTS "rab_audit_log project team insert" ON public.rab_audit_log;
DROP POLICY IF EXISTS "rab_export_history project team insert" ON public.rab_export_history;

DO $$
BEGIN
  IF to_regprocedure('public.get_proyek_teknis_unchecked(uuid)') IS NULL THEN
    IF to_regprocedure('public.get_proyek_teknis(uuid)') IS NULL THEN
      RAISE EXCEPTION 'Required function public.get_proyek_teknis(uuid) is missing.';
    END IF;

    ALTER FUNCTION public.get_proyek_teknis(uuid)
      RENAME TO get_proyek_teknis_unchecked;
  END IF;

  IF to_regprocedure('public.get_proyek_teknis_page_unchecked(integer,integer,integer,text,text,uuid,text,text)') IS NULL THEN
    IF to_regprocedure('public.get_proyek_teknis_page(integer,integer,integer,text,text,uuid,text,text)') IS NULL THEN
      RAISE EXCEPTION 'Required function public.get_proyek_teknis_page(...) is missing.';
    END IF;

    ALTER FUNCTION public.get_proyek_teknis_page(integer, integer, integer, text, text, uuid, text, text)
      RENAME TO get_proyek_teknis_page_unchecked;
  END IF;
END
$$;

REVOKE ALL ON FUNCTION public.get_proyek_teknis_unchecked(uuid) FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.get_proyek_teknis_page_unchecked(integer, integer, integer, text, text, uuid, text, text)
  FROM PUBLIC, authenticated, anon;

COMMENT ON FUNCTION public.get_proyek_teknis_unchecked(uuid) IS
  'Internal technical projection implementation. Use get_proyek_teknis(uuid), which enforces app membership.';
COMMENT ON FUNCTION public.get_proyek_teknis_page_unchecked(integer, integer, integer, text, text, uuid, text, text) IS
  'Internal paginated technical projection implementation. Use get_proyek_teknis_page(...), which enforces app membership.';

CREATE OR REPLACE FUNCTION public.get_proyek_teknis(target_proyek_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  nama_proyek text,
  paket_pekerjaan_induk text,
  nomor_kontrak text,
  jenis_pekerjaan text,
  kategori_pekerjaan text,
  tahun_anggaran integer,
  sumber_dana text,
  dinas text,
  lokasi_kecamatan text,
  nama_ppk text,
  perusahaan_id uuid,
  perusahaan_nama text,
  perusahaan_adalah_perusahaan_sendiri boolean,
  tanggal_mulai date,
  tanggal_selesai date,
  durasi_hari integer,
  tahap_progress text,
  persentase_progress integer,
  pernah_dioverride boolean,
  status_proyek text,
  jalur_masuk text,
  created_at timestamptz,
  updated_at timestamptz,
  is_deleted boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF public.current_app_role() IS NULL THEN
    RAISE EXCEPTION 'User belum terdaftar sebagai anggota aplikasi.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.get_proyek_teknis_unchecked(target_proyek_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_proyek_teknis_page(
  target_page integer DEFAULT 1,
  target_page_size integer DEFAULT 25,
  target_tahun_anggaran integer DEFAULT NULL,
  target_jenis_pekerjaan text DEFAULT NULL,
  target_status_proyek text DEFAULT NULL,
  target_perusahaan_id uuid DEFAULT NULL,
  target_progress text DEFAULT NULL,
  target_search text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF public.current_app_role() IS NULL THEN
    RAISE EXCEPTION 'User belum terdaftar sebagai anggota aplikasi.'
      USING ERRCODE = '42501';
  END IF;

  RETURN public.get_proyek_teknis_page_unchecked(
    target_page,
    target_page_size,
    target_tahun_anggaran,
    target_jenis_pekerjaan,
    target_status_proyek,
    target_perusahaan_id,
    target_progress,
    target_search
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_proyek_teknis(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_proyek_teknis_page(integer, integer, integer, text, text, uuid, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_proyek_teknis(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_proyek_teknis_page(integer, integer, integer, text, text, uuid, text, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.assert_rab_maker_ready_for_approval(target_rab_maker_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  maker_row record;
  expected_subtotal numeric;
  expected_ppn numeric;
BEGIN
  SELECT rm.id, rm.ppn_persen, rm.subtotal, rm.ppn_nilai, rm.total_final
  INTO maker_row
  FROM public.rab_maker rm
  WHERE rm.id = target_rab_maker_id;

  IF maker_row.id IS NULL THEN
    RAISE EXCEPTION 'RAB Maker belum dibuat.'
      USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (VALUES
      (maker_row.ppn_persen),
      (maker_row.subtotal),
      (maker_row.ppn_nilai),
      (maker_row.total_final)
    ) AS header_number(value)
    WHERE lower(header_number.value::text) IN ('nan', 'infinity', '-infinity')
  ) OR EXISTS (
    SELECT 1
    FROM public.rab_maker_items rmi
    CROSS JOIN LATERAL (VALUES
      (rmi.volume),
      (rmi.profit_persen_default),
      (rmi.profit_persen_final),
      (rmi.harga_dasar_total),
      (rmi.profit_nilai),
      (rmi.harga_satuan),
      (rmi.jumlah_harga)
    ) AS item_number(value)
    WHERE rmi.rab_maker_id = maker_row.id
      AND lower(item_number.value::text) IN ('nan', 'infinity', '-infinity')
  ) OR EXISTS (
    SELECT 1
    FROM public.rab_maker_item_details rmid
    JOIN public.rab_maker_items rmi ON rmi.id = rmid.rab_maker_item_id
    CROSS JOIN LATERAL (VALUES
      (rmid.koefisien_snapshot),
      (rmid.harga_dasar_default),
      (rmid.harga_dasar_final),
      (rmid.jumlah_harga_dasar)
    ) AS detail_number(value)
    WHERE rmi.rab_maker_id = maker_row.id
      AND lower(detail_number.value::text) IN ('nan', 'infinity', '-infinity')
  ) THEN
    RAISE EXCEPTION 'RAB mengandung nilai numerik non-finite (NaN atau infinity).'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.rab_maker_items rmi
    WHERE rmi.rab_maker_id = maker_row.id
  ) THEN
    RAISE EXCEPTION 'RAB belum memiliki item pekerjaan.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.rab_maker_items rmi
    WHERE rmi.rab_maker_id = maker_row.id
      AND (
        rmi.volume IS NULL
        OR rmi.volume <= 0
        OR rmi.harga_satuan IS NULL
        OR rmi.harga_satuan <= 0
        OR rmi.jumlah_harga IS NULL
        OR rmi.jumlah_harga <= 0
      )
  ) THEN
    RAISE EXCEPTION 'Semua item RAB wajib memiliki volume, harga satuan, dan jumlah harga lebih dari nol.'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    WITH item_calculation AS (
      SELECT
        rmi.id,
        rmi.volume,
        rmi.profit_persen_final,
        rmi.harga_dasar_total,
        rmi.profit_nilai,
        rmi.harga_satuan,
        rmi.jumlah_harga,
        count(rmid.id) AS detail_count,
        COALESCE(sum(rmid.jumlah_harga_dasar), 0) AS expected_base
      FROM public.rab_maker_items rmi
      LEFT JOIN public.rab_maker_item_details rmid ON rmid.rab_maker_item_id = rmi.id
      WHERE rmi.rab_maker_id = maker_row.id
      GROUP BY rmi.id
    )
    SELECT 1
    FROM item_calculation item
    WHERE item.detail_count = 0
      OR item.harga_dasar_total IS DISTINCT FROM item.expected_base
      OR item.profit_nilai IS DISTINCT FROM item.expected_base * item.profit_persen_final / 100
      OR item.harga_satuan IS DISTINCT FROM item.expected_base + (item.expected_base * item.profit_persen_final / 100)
      OR item.jumlah_harga IS DISTINCT FROM item.volume * (
        item.expected_base + (item.expected_base * item.profit_persen_final / 100)
      )
  ) THEN
    RAISE EXCEPTION 'Perhitungan detail atau item RAB tidak konsisten.'
      USING ERRCODE = '23514';
  END IF;

  SELECT COALESCE(sum(rmi.jumlah_harga), 0)
  INTO expected_subtotal
  FROM public.rab_maker_items rmi
  WHERE rmi.rab_maker_id = maker_row.id;

  expected_ppn := expected_subtotal * maker_row.ppn_persen / 100;

  IF maker_row.subtotal IS DISTINCT FROM expected_subtotal
    OR maker_row.ppn_nilai IS DISTINCT FROM expected_ppn
    OR maker_row.total_final IS DISTINCT FROM expected_subtotal + expected_ppn
    OR maker_row.total_final <= 0 THEN
    RAISE EXCEPTION 'Perhitungan header RAB tidak konsisten atau total final tidak positif.'
      USING ERRCODE = '23514';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_rab_maker_ready_for_approval(uuid) FROM PUBLIC, authenticated, anon;

CREATE OR REPLACE FUNCTION public.approve_rab_maker(target_proyek_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  maker_row record;
BEGIN
  IF public.is_owner_admin() IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Hanya Owner/Admin yang boleh menyetujui RAB.'
      USING ERRCODE = '42501';
  END IF;

  SELECT rm.id, rm.proyek_id, rm.status
  INTO maker_row
  FROM public.rab_maker rm
  WHERE rm.proyek_id = target_proyek_id
    AND public.can_manage_project_rab(rm.proyek_id)
  FOR UPDATE;

  IF maker_row.id IS NULL THEN
    RAISE EXCEPTION 'RAB Maker belum dibuat.'
      USING ERRCODE = 'P0002';
  END IF;

  IF maker_row.status = 'final'::public.rab_status THEN
    RAISE EXCEPTION 'RAB final tidak bisa disetujui ulang.'
      USING ERRCODE = 'P0001';
  END IF;

  PERFORM public.assert_rab_maker_ready_for_approval(maker_row.id);

  IF maker_row.status = 'validated'::public.rab_status THEN
    RETURN maker_row.id;
  END IF;

  UPDATE public.rab_maker
  SET status = 'validated'::public.rab_status,
      validated_by = auth.uid(),
      validated_at = now()
  WHERE id = maker_row.id;

  INSERT INTO public.rab_audit_log (
    proyek_id,
    user_id,
    aksi,
    metadata,
    rab_maker_id
  )
  VALUES (
    maker_row.proyek_id,
    auth.uid(),
    'rab_approved',
    jsonb_build_object('previous_status', maker_row.status, 'new_status', 'validated'),
    maker_row.id
  );

  RETURN maker_row.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_rab_maker(target_proyek_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  maker_row record;
BEGIN
  IF public.is_owner_admin() IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Hanya Owner/Admin yang boleh memfinalkan RAB.'
      USING ERRCODE = '42501';
  END IF;

  SELECT rm.id, rm.proyek_id, rm.status
  INTO maker_row
  FROM public.rab_maker rm
  WHERE rm.proyek_id = target_proyek_id
    AND public.can_manage_project_rab(rm.proyek_id)
  FOR UPDATE;

  IF maker_row.id IS NULL THEN
    RAISE EXCEPTION 'RAB Maker belum dibuat.'
      USING ERRCODE = 'P0002';
  END IF;

  PERFORM public.assert_rab_maker_ready_for_approval(maker_row.id);

  IF maker_row.status = 'final'::public.rab_status THEN
    RETURN maker_row.id;
  END IF;

  IF maker_row.status <> 'validated'::public.rab_status THEN
    RAISE EXCEPTION 'RAB harus disetujui sebelum difinalkan.'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.rab_maker
  SET status = 'final'::public.rab_status,
      finalized_by = auth.uid(),
      finalized_at = now()
  WHERE id = maker_row.id;

  INSERT INTO public.rab_audit_log (
    proyek_id,
    user_id,
    aksi,
    metadata,
    rab_maker_id
  )
  VALUES (
    maker_row.proyek_id,
    auth.uid(),
    'rab_finalized',
    jsonb_build_object('previous_status', maker_row.status, 'new_status', 'final'),
    maker_row.id
  );

  RETURN maker_row.id;
END;
$$;

DO $$
DECLARE
  existing_maker record;
BEGIN
  FOR existing_maker IN
    SELECT rm.id, rm.status
    FROM public.rab_maker rm
    WHERE rm.status IN ('validated'::public.rab_status, 'final'::public.rab_status)
  LOOP
    BEGIN
      PERFORM public.assert_rab_maker_ready_for_approval(existing_maker.id);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Existing RAB % with status % failed readiness preflight: %',
          existing_maker.id,
          existing_maker.status,
          SQLERRM;
    END;
  END LOOP;
END
$$;

REVOKE ALL ON FUNCTION public.approve_rab_maker(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finalize_rab_maker(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_rab_maker(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_rab_maker(uuid) TO authenticated;

COMMIT;
