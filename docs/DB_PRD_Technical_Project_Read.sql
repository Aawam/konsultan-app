-- ============================================================
-- KONSULTAN APP - TECHNICAL PROJECT READ RPC
-- Purpose:
-- Allow Tenaga Ahli to read all available project technical fields without granting
-- direct SELECT access to sensitive columns in public.proyek.
--
-- Safe to re-run. Target: staging first.
-- ============================================================

BEGIN;

DROP FUNCTION IF EXISTS public.get_assigned_proyek_teknis(uuid);

CREATE FUNCTION public.get_assigned_proyek_teknis(target_proyek_id uuid DEFAULT NULL)
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.nama_proyek,
    p.paket_pekerjaan_induk,
    p.nomor_kontrak,
    p.jenis_pekerjaan,
    p.kategori_pekerjaan,
    p.tahun_anggaran,
    p.sumber_dana,
    p.dinas,
    p.lokasi_kecamatan,
    p.nama_ppk,
    p.perusahaan_id,
    pr.nama_perusahaan AS perusahaan_nama,
    pr.adalah_perusahaan_sendiri AS perusahaan_adalah_perusahaan_sendiri,
    p.tanggal_mulai,
    p.tanggal_selesai,
    p.durasi_hari,
    p.tahap_progress,
    p.persentase_progress,
    p.pernah_dioverride,
    p.status_proyek,
    p.jalur_masuk,
    p.created_at,
    p.updated_at,
    p.is_deleted
  FROM public.proyek p
  LEFT JOIN public.perusahaan pr ON pr.id = p.perusahaan_id
  WHERE COALESCE(p.is_deleted, false) = false
    AND (target_proyek_id IS NULL OR p.id = target_proyek_id)
  ORDER BY p.tahun_anggaran DESC, p.nama_proyek ASC;
$$;

REVOKE ALL ON FUNCTION public.get_assigned_proyek_teknis(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_assigned_proyek_teknis(uuid) TO authenticated;

COMMIT;
