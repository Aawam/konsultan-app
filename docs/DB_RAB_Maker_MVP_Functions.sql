BEGIN;

CREATE OR REPLACE FUNCTION public.can_manage_project_rab(target_proyek_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_owner_admin()
    OR EXISTS (
      SELECT 1
      FROM public.project_assignments pa
      JOIN public.proyek p ON p.id = pa.proyek_id
      WHERE pa.proyek_id = target_proyek_id
        AND pa.user_id = auth.uid()
        AND p.jenis_pekerjaan = 'Perencanaan'
        AND COALESCE(p.is_deleted, false) = false
    )
$$;

CREATE OR REPLACE FUNCTION public.recalculate_rab_maker(target_rab_maker_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subtotal_value numeric;
  ppn_value numeric;
  ppn_percent numeric;
BEGIN
  SELECT COALESCE(SUM(jumlah_harga), 0)
  INTO subtotal_value
  FROM public.rab_maker_items
  WHERE rab_maker_id = target_rab_maker_id;

  SELECT ppn_persen
  INTO ppn_percent
  FROM public.rab_maker
  WHERE id = target_rab_maker_id;

  ppn_value := subtotal_value * COALESCE(ppn_percent, 0) / 100;

  UPDATE public.rab_maker
  SET subtotal = subtotal_value,
      ppn_nilai = ppn_value,
      total_final = subtotal_value + ppn_value
  WHERE id = target_rab_maker_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_rab_maker_from_ahsp(
  target_proyek_id uuid,
  source_ahsp_item_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  maker_id uuid;
  item_id uuid;
  next_order integer;
  source_item record;
  detail_subtotal numeric;
  requested_proyek_id uuid := target_proyek_id;
  requested_ahsp_item_id uuid := source_ahsp_item_id;
BEGIN
  IF NOT public.can_manage_project_rab(requested_proyek_id) THEN
    RAISE EXCEPTION 'Tidak punya akses RAB proyek ini.';
  END IF;

  SELECT
    ai.id,
    ai.kode_analisa,
    ai.uraian_pekerjaan,
    ai.bidang,
    ai.sub_bidang,
    ai.profit_persen_default,
    k.nama_kategori,
    s.nama_satuan
  INTO source_item
  FROM public.ahsp_items ai
  JOIN public.kategori_pekerjaan_master k ON k.id = ai.kategori_id
  JOIN public.satuan s ON s.id = ai.satuan_id
  WHERE ai.id = requested_ahsp_item_id;

  IF source_item.id IS NULL THEN
    RAISE EXCEPTION 'AHSP tidak ditemukan.';
  END IF;

  INSERT INTO public.rab_maker (proyek_id, created_by)
  VALUES (requested_proyek_id, auth.uid())
  ON CONFLICT (proyek_id) DO UPDATE
  SET updated_at = now()
  RETURNING id INTO maker_id;

  IF EXISTS (
    SELECT 1
    FROM public.rab_maker_items rmi
    WHERE rmi.rab_maker_id = maker_id
      AND rmi.source_ahsp_item_id = requested_ahsp_item_id
  ) THEN
    RAISE EXCEPTION 'AHSP ini sudah ada di RAB Maker proyek.';
  END IF;

  SELECT COALESCE(MAX(urutan), 0) + 1
  INTO next_order
  FROM public.rab_maker_items
  WHERE rab_maker_id = maker_id;

  SELECT COALESCE(SUM(
    ad.koefisien *
    COALESCE(mu.harga_dasar, mb.harga_dasar, ma.harga_dasar, 0)
  ), 0)
  INTO detail_subtotal
  FROM public.ahsp_details ad
  LEFT JOIN public.master_upah mu ON mu.id = ad.upah_id
  LEFT JOIN public.master_bahan mb ON mb.id = ad.bahan_id
  LEFT JOIN public.master_alat ma ON ma.id = ad.alat_id
  WHERE ad.ahsp_item_id = requested_ahsp_item_id;

  INSERT INTO public.rab_maker_items (
    rab_maker_id,
    source_ahsp_item_id,
    kode_analisa_snapshot,
    uraian_pekerjaan_snapshot,
    bidang_snapshot,
    sub_bidang_snapshot,
    kategori_snapshot,
    satuan_snapshot,
    volume,
    profit_persen_default,
    profit_persen_final,
    harga_dasar_total,
    profit_nilai,
    harga_satuan,
    jumlah_harga,
    koefisien_locked,
    urutan,
    created_by
  )
  VALUES (
    maker_id,
    source_item.id,
    source_item.kode_analisa,
    source_item.uraian_pekerjaan,
    source_item.bidang,
    source_item.sub_bidang,
    source_item.nama_kategori,
    source_item.nama_satuan,
    0,
    source_item.profit_persen_default,
    source_item.profit_persen_default,
    detail_subtotal,
    detail_subtotal * source_item.profit_persen_default / 100,
    detail_subtotal + (detail_subtotal * source_item.profit_persen_default / 100),
    0,
    true,
    next_order,
    auth.uid()
  )
  RETURNING id INTO item_id;

  INSERT INTO public.rab_maker_item_details (
    rab_maker_item_id,
    source_ahsp_detail_id,
    komponen_tipe,
    source_upah_id,
    source_bahan_id,
    source_alat_id,
    nama_komponen_snapshot,
    satuan_snapshot,
    koefisien_snapshot,
    koefisien_locked,
    harga_dasar_default,
    harga_dasar_final,
    jumlah_harga_dasar,
    urutan
  )
  SELECT
    item_id,
    ad.id,
    ad.komponen_tipe,
    ad.upah_id,
    ad.bahan_id,
    ad.alat_id,
    COALESCE(mu.nama_upah, mb.nama_bahan, ma.nama_alat),
    COALESCE(su.nama_satuan, sb.nama_satuan, sa.nama_satuan),
    ad.koefisien,
    true,
    COALESCE(mu.harga_dasar, mb.harga_dasar, ma.harga_dasar, 0),
    COALESCE(mu.harga_dasar, mb.harga_dasar, ma.harga_dasar, 0),
    ad.koefisien * COALESCE(mu.harga_dasar, mb.harga_dasar, ma.harga_dasar, 0),
    ROW_NUMBER() OVER (ORDER BY ad.komponen_tipe, COALESCE(mu.nama_upah, mb.nama_bahan, ma.nama_alat), ad.id)
  FROM public.ahsp_details ad
  LEFT JOIN public.master_upah mu ON mu.id = ad.upah_id
  LEFT JOIN public.satuan su ON su.id = mu.satuan_id
  LEFT JOIN public.master_bahan mb ON mb.id = ad.bahan_id
  LEFT JOIN public.satuan sb ON sb.id = mb.satuan_id
  LEFT JOIN public.master_alat ma ON ma.id = ad.alat_id
  LEFT JOIN public.satuan sa ON sa.id = ma.satuan_id
  WHERE ad.ahsp_item_id = requested_ahsp_item_id
  ORDER BY ad.komponen_tipe, COALESCE(mu.nama_upah, mb.nama_bahan, ma.nama_alat), ad.id;

  PERFORM public.recalculate_rab_maker(maker_id);

  RETURN item_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_rab_maker_item_volume(
  target_item_id uuid,
  new_volume numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  maker_id uuid;
BEGIN
  IF new_volume < 0 THEN
    RAISE EXCEPTION 'Volume tidak boleh negatif.';
  END IF;

  SELECT rmi.rab_maker_id
  INTO maker_id
  FROM public.rab_maker_items rmi
  JOIN public.rab_maker rm ON rm.id = rmi.rab_maker_id
  WHERE rmi.id = target_item_id
    AND public.can_manage_project_rab(rm.proyek_id);

  IF maker_id IS NULL THEN
    RAISE EXCEPTION 'Item RAB tidak ditemukan atau tidak dapat diakses.';
  END IF;

  UPDATE public.rab_maker_items
  SET volume = new_volume,
      jumlah_harga = new_volume * harga_satuan
  WHERE id = target_item_id;

  PERFORM public.recalculate_rab_maker(maker_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_rab_maker_item(target_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  maker_id uuid;
BEGIN
  SELECT rmi.rab_maker_id
  INTO maker_id
  FROM public.rab_maker_items rmi
  JOIN public.rab_maker rm ON rm.id = rmi.rab_maker_id
  WHERE rmi.id = target_item_id
    AND public.can_manage_project_rab(rm.proyek_id);

  IF maker_id IS NULL THEN
    RAISE EXCEPTION 'Item RAB tidak ditemukan atau tidak dapat diakses.';
  END IF;

  DELETE FROM public.rab_maker_items
  WHERE id = target_item_id;

  PERFORM public.recalculate_rab_maker(maker_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_rab_maker_item_profit(
  target_item_id uuid,
  new_profit_persen numeric,
  override_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_row record;
  clean_reason text := NULLIF(btrim(COALESCE(override_reason, '')), '');
BEGIN
  IF new_profit_persen IS NULL OR new_profit_persen < 0 THEN
    RAISE EXCEPTION 'Profit tidak boleh negatif.';
  END IF;

  SELECT
    rmi.id,
    rmi.rab_maker_id,
    rmi.profit_persen_default,
    rmi.profit_persen_final,
    rmi.harga_dasar_total,
    rmi.volume,
    rm.proyek_id
  INTO item_row
  FROM public.rab_maker_items rmi
  JOIN public.rab_maker rm ON rm.id = rmi.rab_maker_id
  WHERE rmi.id = target_item_id
    AND public.can_manage_project_rab(rm.proyek_id);

  IF item_row.id IS NULL THEN
    RAISE EXCEPTION 'Item RAB tidak ditemukan atau tidak dapat diakses.';
  END IF;

  IF new_profit_persen IS DISTINCT FROM item_row.profit_persen_default AND clean_reason IS NULL THEN
    RAISE EXCEPTION 'Alasan override profit wajib diisi.';
  END IF;

  UPDATE public.rab_maker_items
  SET profit_persen_final = new_profit_persen,
      profit_override_reason = CASE
        WHEN new_profit_persen IS DISTINCT FROM profit_persen_default THEN clean_reason
        ELSE NULL
      END,
      profit_nilai = harga_dasar_total * new_profit_persen / 100,
      harga_satuan = harga_dasar_total + (harga_dasar_total * new_profit_persen / 100),
      jumlah_harga = volume * (harga_dasar_total + (harga_dasar_total * new_profit_persen / 100))
  WHERE id = target_item_id;

  INSERT INTO public.rab_audit_log (
    proyek_id,
    user_id,
    aksi,
    metadata,
    rab_maker_id,
    rab_maker_item_id
  )
  VALUES (
    item_row.proyek_id,
    auth.uid(),
    'profit_overridden',
    jsonb_build_object(
      'old_profit_persen', item_row.profit_persen_final,
      'new_profit_persen', new_profit_persen,
      'profit_persen_default', item_row.profit_persen_default,
      'reason', clean_reason
    ),
    item_row.rab_maker_id,
    item_row.id
  );

  PERFORM public.recalculate_rab_maker(item_row.rab_maker_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_rab_maker_detail_harga_dasar(
  target_detail_id uuid,
  new_harga_dasar numeric,
  override_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  detail_row record;
  clean_reason text := NULLIF(btrim(COALESCE(override_reason, '')), '');
  new_base_total numeric;
BEGIN
  IF new_harga_dasar IS NULL OR new_harga_dasar < 0 THEN
    RAISE EXCEPTION 'Harga dasar tidak boleh negatif.';
  END IF;

  SELECT
    rmid.id,
    rmid.rab_maker_item_id,
    rmid.harga_dasar_default,
    rmid.harga_dasar_final,
    rmid.koefisien_snapshot,
    rmi.rab_maker_id,
    rm.proyek_id
  INTO detail_row
  FROM public.rab_maker_item_details rmid
  JOIN public.rab_maker_items rmi ON rmi.id = rmid.rab_maker_item_id
  JOIN public.rab_maker rm ON rm.id = rmi.rab_maker_id
  WHERE rmid.id = target_detail_id
    AND public.can_manage_project_rab(rm.proyek_id);

  IF detail_row.id IS NULL THEN
    RAISE EXCEPTION 'Detail AHSP RAB tidak ditemukan atau tidak dapat diakses.';
  END IF;

  IF new_harga_dasar IS DISTINCT FROM detail_row.harga_dasar_default AND clean_reason IS NULL THEN
    RAISE EXCEPTION 'Alasan override harga dasar wajib diisi.';
  END IF;

  UPDATE public.rab_maker_item_details
  SET harga_dasar_final = new_harga_dasar,
      harga_override_reason = CASE
        WHEN new_harga_dasar IS DISTINCT FROM harga_dasar_default THEN clean_reason
        ELSE NULL
      END,
      jumlah_harga_dasar = koefisien_snapshot * new_harga_dasar
  WHERE id = target_detail_id;

  SELECT COALESCE(SUM(jumlah_harga_dasar), 0)
  INTO new_base_total
  FROM public.rab_maker_item_details
  WHERE rab_maker_item_id = detail_row.rab_maker_item_id;

  UPDATE public.rab_maker_items
  SET harga_dasar_total = new_base_total,
      profit_nilai = new_base_total * profit_persen_final / 100,
      harga_satuan = new_base_total + (new_base_total * profit_persen_final / 100),
      jumlah_harga = volume * (new_base_total + (new_base_total * profit_persen_final / 100))
  WHERE id = detail_row.rab_maker_item_id;

  INSERT INTO public.rab_audit_log (
    proyek_id,
    user_id,
    aksi,
    metadata,
    rab_maker_id,
    rab_maker_item_id,
    rab_maker_item_detail_id
  )
  VALUES (
    detail_row.proyek_id,
    auth.uid(),
    'harga_dasar_overridden',
    jsonb_build_object(
      'old_harga_dasar', detail_row.harga_dasar_final,
      'new_harga_dasar', new_harga_dasar,
      'harga_dasar_default', detail_row.harga_dasar_default,
      'reason', clean_reason
    ),
    detail_row.rab_maker_id,
    detail_row.rab_maker_item_id,
    detail_row.id
  );

  PERFORM public.recalculate_rab_maker(detail_row.rab_maker_id);
END;
$$;

REVOKE ALL ON FUNCTION public.create_rab_maker_from_ahsp(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_rab_maker_item_volume(uuid, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_rab_maker_item_profit(uuid, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_rab_maker_detail_harga_dasar(uuid, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_rab_maker_item(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recalculate_rab_maker(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_rab_maker_from_ahsp(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_rab_maker_item_volume(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_rab_maker_item_profit(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_rab_maker_detail_harga_dasar(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_rab_maker_item(uuid) TO authenticated;

COMMIT;
