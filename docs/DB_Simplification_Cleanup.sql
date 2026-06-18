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
-- BAGIAN 1 — Hapus policy legacy jika masih ada
-- Aman dipanggil berulang karena memakai IF EXISTS
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "authenticated read personil" ON public.personil;
DROP POLICY IF EXISTS "authenticated insert personil" ON public.personil;
DROP POLICY IF EXISTS "authenticated update personil" ON public.personil;

DROP POLICY IF EXISTS "authenticated read personil_proyek" ON public.personil_proyek;
DROP POLICY IF EXISTS "authenticated insert personil_proyek" ON public.personil_proyek;
DROP POLICY IF EXISTS "authenticated update personil_proyek" ON public.personil_proyek;

DROP POLICY IF EXISTS "authenticated read pengalaman_perusahaan" ON public.pengalaman_perusahaan;
DROP POLICY IF EXISTS "authenticated insert pengalaman_perusahaan" ON public.pengalaman_perusahaan;
DROP POLICY IF EXISTS "authenticated update pengalaman_perusahaan" ON public.pengalaman_perusahaan;

DROP POLICY IF EXISTS "authenticated read nomor_surat" ON public.nomor_surat;
DROP POLICY IF EXISTS "authenticated insert nomor_surat" ON public.nomor_surat;
DROP POLICY IF EXISTS "authenticated update nomor_surat" ON public.nomor_surat;

DROP POLICY IF EXISTS "authenticated read template_metodologi" ON public.template_metodologi;
DROP POLICY IF EXISTS "authenticated insert template_metodologi" ON public.template_metodologi;
DROP POLICY IF EXISTS "authenticated update template_metodologi" ON public.template_metodologi;


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
    'template_metodologi'
  )
ORDER BY table_name;

COMMIT;


-- ============================================================
-- LANGKAH SESUDAH CLEANUP
-- 1. Uji ulang aplikasi
-- 2. Regenerate lib/database.types.ts
-- 3. Review docs/RLS jika ingin ikut dirapikan dari object legacy
-- ============================================================
