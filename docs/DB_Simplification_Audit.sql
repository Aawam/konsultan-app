-- ============================================================
-- DB SIMPLIFICATION AUDIT — Monitoring-only scope
-- Tanggal: 2026-06-17
--
-- Tujuan:
-- 1. Memastikan aplikasi monitoring hanya bergantung pada tabel inti
-- 2. Mengidentifikasi object legacy modul dokumen yang siap dihapus
-- 3. Memberi snapshot singkat sebelum cleanup dijalankan
--
-- Jalankan di Supabase SQL Editor sebelum menjalankan
-- DB_Simplification_Cleanup.sql
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- BAGIAN 1 — Tabel inti yang WAJIB tetap ada
-- Jika hasil query muncul = tabel inti hilang
-- ────────────────────────────────────────────────────────────

SELECT needed.table_name AS missing_core_table
FROM (VALUES
  ('proyek'),
  ('perusahaan'),
  ('override_log'),
  ('dinas_skpd')
) AS needed(table_name)
WHERE NOT EXISTS (
  SELECT 1
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_name = needed.table_name
);


-- ────────────────────────────────────────────────────────────
-- BAGIAN 2 — Tabel legacy kandidat hapus
-- Jika tabel ada, ia akan muncul di hasil
-- ────────────────────────────────────────────────────────────

SELECT
  t.table_name AS legacy_table_found
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'personil',
    'personil_proyek',
    'pengalaman_perusahaan',
    'nomor_surat',
    'template_metodologi',
    'checklist_proyek',
    'termin_pembayaran'
  )
ORDER BY t.table_name;


-- ────────────────────────────────────────────────────────────
-- BAGIAN 3 — RPC legacy kandidat hapus
-- ────────────────────────────────────────────────────────────

SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'next_nomor_penawaran';


-- ────────────────────────────────────────────────────────────
-- BAGIAN 4 — FK yang menyentuh tabel legacy
-- Tinjau hasil ini sebelum drop supaya tahu relasi yang akan ikut hilang
-- ────────────────────────────────────────────────────────────

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
 AND tc.table_schema = ccu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (
    tc.table_name IN (
      'personil',
      'personil_proyek',
      'pengalaman_perusahaan',
      'nomor_surat',
      'template_metodologi',
      'checklist_proyek',
      'termin_pembayaran'
    )
    OR ccu.table_name IN (
      'personil',
      'personil_proyek',
      'pengalaman_perusahaan',
      'nomor_surat',
      'template_metodologi',
      'checklist_proyek',
      'termin_pembayaran'
    )
  )
ORDER BY tc.table_name, tc.constraint_name;


-- ────────────────────────────────────────────────────────────
-- BAGIAN 5 — RLS policy yang menempel ke tabel legacy
-- ────────────────────────────────────────────────────────────

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
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
ORDER BY tablename, policyname;


-- ────────────────────────────────────────────────────────────
-- BAGIAN 6 — Perkiraan isi data legacy (sanity check sebelum hapus)
-- Menggunakan pg_stat_user_tables supaya aman walau tabel sudah tidak ada
-- n_live_tup bersifat estimasi, cukup untuk cek cepat
-- ────────────────────────────────────────────────────────────

SELECT
  needed.table_name AS tabel,
  CASE
    WHEN s.relname IS NULL THEN 'TABLE NOT FOUND'
    ELSE COALESCE(s.n_live_tup::text, '0')
  END AS jumlah_baris_estimasi
FROM (VALUES
  ('personil'),
  ('personil_proyek'),
  ('pengalaman_perusahaan'),
  ('nomor_surat'),
  ('template_metodologi'),
  ('checklist_proyek'),
  ('termin_pembayaran')
) AS needed(table_name)
LEFT JOIN pg_stat_user_tables s
  ON s.schemaname = 'public'
 AND s.relname = needed.table_name
ORDER BY needed.table_name;


-- ────────────────────────────────────────────────────────────
-- BAGIAN 7 — Tabel inti sesudah penyederhanaan
-- Ini adalah target minimum schema aplikasi
-- ────────────────────────────────────────────────────────────

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('proyek', 'perusahaan', 'override_log', 'dinas_skpd')
ORDER BY table_name, ordinal_position;
