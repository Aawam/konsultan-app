-- ============================================================
-- DB AUDIT — Konsulindo Project Suite
-- Tanggal: 2026-05-02
--
-- Jalankan di Supabase SQL Editor.
-- Tujuan: verifikasi kolom yang dipakai kode vs yang ada di DB,
--         dan temukan kolom declared tapi tidak dipakai / sebaliknya.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- BAGIAN 1 — Lihat semua kolom yang ada di DB sekarang
-- ────────────────────────────────────────────────────────────

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'proyek', 'perusahaan', 'override_log',
    'personil', 'personil_proyek',
    'pengalaman_perusahaan', 'nomor_surat', 'template_metodologi'
  )
ORDER BY table_name, ordinal_position;


-- ────────────────────────────────────────────────────────────
-- BAGIAN 2 — Cek kolom kritis yang WAJIB ada di setiap tabel
-- ────────────────────────────────────────────────────────────
-- Jika query ini mengembalikan baris = kolom TIDAK ADA di DB.
-- Jika tidak ada baris = semua kolom yang dicek sudah ada. ✓

-- 2A. Tabel: proyek
SELECT 'proyek' AS tabel, col AS kolom_dibutuhkan, 'MISSING' AS status
FROM (VALUES
  ('id'), ('nama_proyek'), ('paket_pekerjaan_induk'),
  ('jenis_pekerjaan'), ('kategori_pekerjaan'),
  ('tahun_anggaran'), ('sumber_dana'),
  ('dinas'), ('lokasi_kecamatan'), ('nama_ppk'),
  ('pagu_dana'), ('hps'), ('nilai_penawaran'),
  ('perusahaan_id'),
  ('tanggal_mulai'), ('tanggal_selesai'),
  ('tahap_progress'), ('persentase_progress'),
  ('pernah_dioverride'),
  ('jalur_masuk'), ('status_tender'),
  ('status_proyek'),
  ('catatan'), ('created_at'), ('updated_at')
) AS needed(col)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'proyek'
    AND column_name = col
);

-- 2B. Tabel: perusahaan
SELECT 'perusahaan' AS tabel, col AS kolom_dibutuhkan, 'MISSING' AS status
FROM (VALUES
  ('id'), ('nama_perusahaan'), ('adalah_perusahaan_sendiri'),
  ('inisial_perusahaan'),
  ('alamat'), ('kota'), ('kode_pos'),
  ('npwp'), ('npwp_direktur'),
  ('telepon'), ('email'),
  ('nama_direktur'),
  ('siujk'), ('sbu'), ('subklasifikasi_sbu'), ('masa_berlaku_sbu'), ('kode_kbli'),
  ('nib'), ('nib_berbasis_risiko'),
  ('nomor_akta_pendirian'), ('tanggal_akta_pendirian'), ('notaris_pendirian'),
  ('pengesahan_kemenkumham'),
  ('nomor_akta_perubahan'), ('tanggal_akta_perubahan'), ('notaris_perubahan'),
  ('bank_nama'), ('bank_rekening'), ('bank_atas_nama')
) AS needed(col)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'perusahaan'
    AND column_name = col
);

-- 2C. Tabel: override_log
SELECT 'override_log' AS tabel, col AS kolom_dibutuhkan, 'MISSING' AS status
FROM (VALUES
  ('id'), ('proyek_id'), ('field_dioverride'),
  ('nilai_sebelum'), ('nilai_sesudah'),
  ('alasan'), ('dilakukan_oleh'), ('dilakukan_pada')
) AS needed(col)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'override_log'
    AND column_name = col
);

-- 2D. Tabel: personil
SELECT 'personil' AS tabel, col AS kolom_dibutuhkan, 'MISSING' AS status
FROM (VALUES
  ('id'), ('nama_lengkap'), ('klasifikasi_skk'), ('nomor_skk'), ('alamat')
) AS needed(col)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'personil'
    AND column_name = col
);

-- 2E. Tabel: personil_proyek
SELECT 'personil_proyek' AS tabel, col AS kolom_dibutuhkan, 'MISSING' AS status
FROM (VALUES
  ('id'), ('proyek_id'), ('personil_id'), ('posisi'), ('durasi_bulan'),
  ('tanggal_mulai_tugas'), ('tanggal_selesai_tugas')
) AS needed(col)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'personil_proyek'
    AND column_name = col
);

-- 2F. Tabel: pengalaman_perusahaan
SELECT 'pengalaman_perusahaan' AS tabel, col AS kolom_dibutuhkan, 'MISSING' AS status
FROM (VALUES
  ('id'), ('perusahaan_id'), ('nama_paket'), ('pemberi_kerja'), ('lokasi'),
  ('nilai_kontrak'), ('nomor_kontrak'), ('tanggal_mulai'), ('tanggal_selesai'),
  ('kategori_pekerjaan')
) AS needed(col)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'pengalaman_perusahaan'
    AND column_name = col
);

-- 2G. Tabel: nomor_surat
SELECT 'nomor_surat' AS tabel, col AS kolom_dibutuhkan, 'MISSING' AS status
FROM (VALUES
  ('id'), ('proyek_id'), ('jenis_surat'), ('nomor_surat'), ('tanggal_surat'),
  ('is_manual'), ('created_at')
) AS needed(col)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'nomor_surat'
    AND column_name = col
);

-- 2H. Tabel: template_metodologi
SELECT 'template_metodologi' AS tabel, col AS kolom_dibutuhkan, 'MISSING' AS status
FROM (VALUES
  ('id'), ('tipe_pekerjaan'), ('kategori_pekerjaan'), ('konten')
) AS needed(col)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'template_metodologi'
    AND column_name = col
);


-- ────────────────────────────────────────────────────────────
-- BAGIAN 3 — Kolom di DB yang tidak dipakai kode (dead columns)
-- ────────────────────────────────────────────────────────────
-- Kolom di bawah ADA di schema lama / Project_Status lama
-- tapi tidak dibaca/ditulis oleh kode saat ini.
-- Kemunculan di hasil = kolom masih ada di DB tapi tidak dipakai.

SELECT table_name, column_name, data_type,
       'ADA DI DB, TIDAK DIPAKAI KODE' AS catatan
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    -- proyek: kolom lama yang tidak dipakai FormProyek / buildProyekPayload
    (table_name = 'proyek' AND column_name IN (
      'alamat_dinas',        -- tidak ada di FormProyek
      'nama_kpa',            -- tidak ada di FormProyek
      'nama_pptk',           -- tidak ada di FormProyek
      'nomor_kontrak',       -- tidak ada di FormProyek
      'nomor_spk',           -- tidak ada di FormProyek
      'tanggal_kontrak',     -- tidak ada di FormProyek
      'durasi_hari',         -- tidak diisi FormProyek; dipakai route generate (fallback 30)
      'skema_pembayaran'     -- tidak ada di FormProyek
    ))
    OR
    -- perusahaan: ktp_direktur ada di docs lama, sudah diganti npwp_direktur di kode baru
    (table_name = 'perusahaan' AND column_name IN (
      'ktp_direktur'         -- route generate menulis '-' hardcoded; PerusahaanDetail tidak ada
    ))
  )
ORDER BY table_name, column_name;


-- ────────────────────────────────────────────────────────────
-- BAGIAN 4 — Cek tabel yang dipakai kode tapi mungkin belum ada
-- ────────────────────────────────────────────────────────────

SELECT t AS tabel_dibutuhkan, 'MISSING TABLE' AS status
FROM (VALUES
  ('proyek'), ('perusahaan'), ('override_log'),
  ('personil'), ('personil_proyek'),
  ('pengalaman_perusahaan'), ('nomor_surat'), ('template_metodologi')
) AS needed(t)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = t
);


-- ────────────────────────────────────────────────────────────
-- BAGIAN 5 — Cek RPC function yang dibutuhkan
-- ────────────────────────────────────────────────────────────
-- next_nomor_penawaran dipakai di lib/actions/penawaran.ts
-- Ada fallback jika RPC tidak ada, tapi sebaiknya dibuat.

SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'next_nomor_penawaran'
  )
  THEN 'OK — next_nomor_penawaran ada'
  ELSE 'MISSING — next_nomor_penawaran belum dibuat (ada fallback di kode, tapi tidak atomic)'
  END AS rpc_status;

-- Untuk membuat RPC jika belum ada, jalankan:
/*
CREATE OR REPLACE FUNCTION next_nomor_penawaran(p_tahun int)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM nomor_surat
  WHERE jenis_surat = 'PEN'
    AND created_at >= make_date(p_tahun, 1, 1)
    AND created_at <  make_date(p_tahun + 1, 1, 1);
  RETURN v_count + 1;
END; $$;
*/


-- ────────────────────────────────────────────────────────────
-- BAGIAN 6 — Cek constraint enum / FK penting
-- ────────────────────────────────────────────────────────────

-- 6A. Cek apakah perusahaan_id di proyek adalah FK ke perusahaan
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('proyek', 'personil_proyek', 'pengalaman_perusahaan',
                         'override_log', 'nomor_surat');

-- 6B. Cek check constraint atau enum untuk status_proyek
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'c'
  AND conrelid = 'proyek'::regclass;


-- ────────────────────────────────────────────────────────────
-- BAGIAN 7 — Cek data: perusahaan tanpa inisial_perusahaan
-- (menyebabkan nomor surat fallback ke 'YPC')
-- ────────────────────────────────────────────────────────────

SELECT id, nama_perusahaan, inisial_perusahaan
FROM perusahaan
WHERE inisial_perusahaan IS NULL OR inisial_perusahaan = ''
ORDER BY nama_perusahaan;


-- ────────────────────────────────────────────────────────────
-- BAGIAN 8 — Cek data: template_metodologi yang ada
-- (diperlukan agar generate penawaran tidak fallback)
-- ────────────────────────────────────────────────────────────

SELECT tipe_pekerjaan, kategori_pekerjaan,
       LEFT(konten, 80) AS preview_konten
FROM template_metodologi
ORDER BY tipe_pekerjaan, kategori_pekerjaan;


-- ────────────────────────────────────────────────────────────
-- BAGIAN 9 — Ringkasan isi tabel (sanity check)
-- ────────────────────────────────────────────────────────────

SELECT 'proyek'                AS tabel, COUNT(*) AS jumlah_baris FROM proyek
UNION ALL
SELECT 'perusahaan',                      COUNT(*) FROM perusahaan
UNION ALL
SELECT 'override_log',                    COUNT(*) FROM override_log
UNION ALL
SELECT 'personil',                        COUNT(*) FROM personil
UNION ALL
SELECT 'personil_proyek',                 COUNT(*) FROM personil_proyek
UNION ALL
SELECT 'pengalaman_perusahaan',           COUNT(*) FROM pengalaman_perusahaan
UNION ALL
SELECT 'nomor_surat',                     COUNT(*) FROM nomor_surat
UNION ALL
SELECT 'template_metodologi',             COUNT(*) FROM template_metodologi
ORDER BY tabel;
