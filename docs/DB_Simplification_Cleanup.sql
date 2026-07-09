-- ============================================================
-- DB SIMPLIFICATION CLEANUP — Monitoring-only scope
-- Tanggal: 2026-06-17
--
-- Tujuan:
-- Menghapus object legacy modul dokumen setelah aplikasi dipangkas
-- menjadi monitoring proyek + database perusahaan.
--
-- PENTING:
-- 1. Backup database dulu
-- 2. Jalankan DB_Simplification_Audit.sql dulu
-- 3. Pastikan smoke test app sudah lolos
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- BAGIAN 1 — Hapus policy legacy jika tabelnya masih ada
-- DROP POLICY ... ON table tetap error jika table sudah tidak ada,
-- jadi policy dihapus dari daftar pg_policies secara dinamis.
-- ────────────────────────────────────────────────────────────

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'personil',
        'personil_proyek',
        'pengalaman_perusahaan',
        'nomor_surat',
        'template_metodologi',
        'checklist_proyek',
        'termin_pembayaran'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;


-- ────────────────────────────────────────────────────────────
-- BAGIAN 2 — Hapus RPC legacy
-- ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.next_nomor_penawaran(integer);


-- ────────────────────────────────────────────────────────────
-- BAGIAN 3 — Hapus tabel legacy
-- Urutan dibuat dari tabel anak ke tabel induk untuk meminimalkan risiko
-- CASCADE dipakai agar FK/constraint legacy ikut bersih
-- ────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.personil_proyek CASCADE;
DROP TABLE IF EXISTS public.checklist_proyek CASCADE;
DROP TABLE IF EXISTS public.termin_pembayaran CASCADE;
DROP TABLE IF EXISTS public.nomor_surat CASCADE;
DROP TABLE IF EXISTS public.pengalaman_perusahaan CASCADE;
DROP TABLE IF EXISTS public.personil CASCADE;
DROP TABLE IF EXISTS public.template_metodologi CASCADE;


-- ────────────────────────────────────────────────────────────
-- BAGIAN 4 — Ringkasan object inti yang tersisa
-- Query ini membantu verifikasi cepat setelah cleanup
-- ────────────────────────────────────────────────────────────

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'proyek',
    'perusahaan',
    'override_log',
    'personil',
    'personil_proyek',
    'pengalaman_perusahaan',
    'nomor_surat',
    'template_metodologi',
    'checklist_proyek',
    'termin_pembayaran',
    'dinas_skpd'
  )
ORDER BY table_name;

COMMIT;


-- ============================================================
-- LANGKAH SESUDAH CLEANUP
-- 1. Uji ulang aplikasi
-- 2. Regenerate lib/database.types.ts
-- 3. Review docs/RLS jika ingin ikut dirapikan dari object legacy
-- ============================================================
