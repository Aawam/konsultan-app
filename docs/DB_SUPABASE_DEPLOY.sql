-- ============================================================
-- KONSULTAN APP - SINGLE SUPABASE DATABASE DEPLOY
-- Last updated: 2026-06-22
--
-- Use this file for a fresh staging/experiment/production Supabase project.
-- It creates the current active app schema in one run:
-- 1. Core project monitoring tables
-- 2. Database reference table for Dinas/SKPD
-- 3. RLS policies for authenticated internal users
--
-- Notes:
-- - This script is idempotent for normal re-runs.
-- - It does not export/import filled production data.
-- - It does not drop legacy tables from older experiments.
-- - Run in Supabase SQL Editor after creating the Supabase project.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Shared timestamp trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Core monitoring tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.perusahaan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_perusahaan text NOT NULL,
  adalah_perusahaan_sendiri boolean NOT NULL DEFAULT false,
  inisial_perusahaan text,
  alamat text,
  kota text,
  kode_pos text,
  npwp text,
  npwp_direktur text,
  ktp_direktur text,
  telepon text,
  email text,
  nama_direktur text,
  siujk text,
  sbu text,
  subklasifikasi_sbu text,
  masa_berlaku_sbu date,
  kode_kbli text,
  nib text,
  nib_berbasis_risiko text,
  nomor_akta_pendirian text,
  tanggal_akta_pendirian date,
  notaris_pendirian text,
  pengesahan_kemenkumham text,
  nomor_akta_perubahan text,
  tanggal_akta_perubahan date,
  notaris_perubahan text,
  bank_nama text,
  bank_rekening text,
  bank_atas_nama text
);

CREATE TABLE IF NOT EXISTS public.proyek (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_proyek text NOT NULL,
  paket_pekerjaan_induk text NOT NULL,
  nomor_kontrak text,
  nomor_spk text,
  tanggal_kontrak date,
  jenis_pekerjaan text NOT NULL CHECK (jenis_pekerjaan IN ('Perencanaan', 'Pengawasan')),
  kategori_pekerjaan text NOT NULL,
  tahun_anggaran integer NOT NULL,
  sumber_dana text NOT NULL CHECK (sumber_dana IN ('APBD', 'APBD-Perubahan')),
  dinas text NOT NULL,
  alamat_dinas text,
  lokasi_kecamatan text NOT NULL,
  nama_ppk text NOT NULL DEFAULT '',
  nama_kpa text,
  nama_pptk text,
  pagu_dana numeric NOT NULL DEFAULT 0 CHECK (pagu_dana >= 0),
  hps numeric CHECK (hps IS NULL OR hps >= 0),
  nilai_penawaran numeric CHECK (nilai_penawaran IS NULL OR nilai_penawaran >= 0),
  perusahaan_id uuid NOT NULL REFERENCES public.perusahaan(id),
  tanggal_mulai date,
  tanggal_selesai date,
  durasi_hari integer CHECK (durasi_hari IS NULL OR durasi_hari >= 0),
  tahap_progress text,
  persentase_progress integer NOT NULL DEFAULT 0 CHECK (persentase_progress >= 0 AND persentase_progress <= 100),
  pernah_dioverride boolean NOT NULL DEFAULT false,
  status_proyek text CHECK (status_proyek IS NULL OR status_proyek IN ('Work', 'Borrowed', 'Get Borrowed')),
  status_tender text,
  skema_pembayaran text,
  jalur_masuk text NOT NULL DEFAULT 'manual',
  catatan text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.override_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyek_id uuid NOT NULL REFERENCES public.proyek(id) ON DELETE CASCADE,
  field_dioverride text NOT NULL,
  nilai_sebelum text,
  nilai_sesudah text,
  alasan text NOT NULL,
  dilakukan_oleh text NOT NULL DEFAULT 'Admin',
  dilakukan_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dinas_skpd (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_dinas text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS proyek_perusahaan_id_idx ON public.proyek(perusahaan_id);
CREATE INDEX IF NOT EXISTS proyek_is_deleted_idx ON public.proyek(is_deleted);
CREATE INDEX IF NOT EXISTS proyek_tahun_anggaran_idx ON public.proyek(tahun_anggaran);
CREATE INDEX IF NOT EXISTS proyek_dinas_idx ON public.proyek(dinas);
CREATE INDEX IF NOT EXISTS override_log_proyek_id_idx ON public.override_log(proyek_id);

DROP TRIGGER IF EXISTS set_proyek_updated_at ON public.proyek;
CREATE TRIGGER set_proyek_updated_at
BEFORE UPDATE ON public.proyek
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 3. RLS policies
-- ============================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'perusahaan',
    'proyek',
    'override_log',
    'dinas_skpd'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "authenticated read %1$s" ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated insert %1$s" ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated update %1$s" ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated delete %1$s" ON public.%1$I', tbl);

    EXECUTE format('CREATE POLICY "authenticated read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', tbl);
    EXECUTE format('CREATE POLICY "authenticated insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (true)', tbl);
    EXECUTE format('CREATE POLICY "authenticated update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', tbl);
    EXECUTE format('CREATE POLICY "authenticated delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (true)', tbl);
  END LOOP;
END $$;

-- ============================================================
-- 4. Seed reference data
-- ============================================================

INSERT INTO public.dinas_skpd (nama_dinas)
SELECT DISTINCT trim(dinas)
FROM public.proyek
WHERE dinas IS NOT NULL
  AND trim(dinas) <> ''
ON CONFLICT (nama_dinas) DO NOTHING;

COMMIT;

-- ============================================================
-- Quick smoke-check after running
-- ============================================================
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN (
--     'perusahaan', 'proyek', 'override_log', 'dinas_skpd'
--   )
-- ORDER BY table_name;
