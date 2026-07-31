BEGIN;

-- Staging-only dataset for dashboard/list density and performance checks.
-- Adds 36 projects: 12 per year across 2023, 2024, and 2025.
-- It deliberately reuses the companies seeded by DB_Project_Perusahaan_Dummy_Seed.sql.
-- Idempotent by project name and budget year. Never run against production.

WITH seed AS (
  SELECT
    sequence_number,
    2023 + ((sequence_number - 1) / 12) AS tahun_anggaran,
    CASE WHEN sequence_number % 3 = 0 THEN 'Pengawasan' ELSE 'Perencanaan' END AS jenis_pekerjaan,
    (ARRAY[
      'PT Konsultan Berau Mandiri',
      'CV Bumi Segah Engineering',
      'PT Pesisir Kaltim Konsulindo',
      'CV Derawan Cipta Desain',
      'PT Kalimarau Infrastruktur',
      'CV Teluk Bayur Konsultan',
      'PT Maratua Rekayasa Prima',
      'CV Gunung Tabur Teknik',
      'PT Sambaliung Urban Konsultan',
      'CV Segah Maju Engineering'
    ])[((sequence_number - 1) % 10) + 1] AS nama_perusahaan,
    (ARRAY[
      'Jalan & Jembatan',
      'Bangunan Gedung',
      'Sanitasi & Air Minum',
      'Irigasi',
      'Listrik & Mekanikal',
      'Lainnya'
    ])[((sequence_number - 1) % 6) + 1] AS kategori_pekerjaan,
    (ARRAY[
      'Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Berau',
      'Dinas Perumahan dan Kawasan Permukiman Kabupaten Berau',
      'Dinas Pendidikan Kabupaten Berau',
      'Dinas Kesehatan Kabupaten Berau',
      'Dinas Perhubungan Kabupaten Berau',
      'Dinas Lingkungan Hidup dan Kebersihan Kabupaten Berau'
    ])[((sequence_number - 1) % 6) + 1] AS dinas,
    (ARRAY['Tanjung Redeb', 'Sambaliung', 'Teluk Bayur', 'Gunung Tabur', 'Tabalar', 'Segah'])[
      ((sequence_number - 1) % 6) + 1
    ] AS lokasi_kecamatan,
    (ARRAY['Persiapan', 'Survey Lapangan', 'Konsep Desain', 'Penyusunan Laporan Antara', 'Pengawasan Tahap 1', 'Penyusunan Laporan Akhir & RAB', 'Penyerahan & Revisi', 'Selesai (BAST)'])[
      ((sequence_number - 1) % 8) + 1
    ] AS tahap_progress,
    (ARRAY[10, 20, 35, 50, 60, 75, 90, 100])[
      ((sequence_number - 1) % 8) + 1
    ] AS persentase_progress
  FROM generate_series(1, 36) AS sequence_number
),
project_values AS (
  SELECT
    format(
      '%s Optimalisasi Infrastruktur Wilayah %s-%s',
      jenis_pekerjaan,
      tahun_anggaran,
      lpad(((sequence_number - 1) % 12 + 1)::text, 2, '0')
    ) AS nama_proyek,
    format('Paket Konsultansi %s %s', lower(kategori_pekerjaan), tahun_anggaran) AS paket_pekerjaan_induk,
    format('027/%s/PERF/%s/%s', CASE WHEN jenis_pekerjaan = 'Pengawasan' THEN 'PWS' ELSE 'PRC' END, tahun_anggaran, lpad(sequence_number::text, 2, '0')) AS nomor_kontrak,
    jenis_pekerjaan,
    kategori_pekerjaan,
    tahun_anggaran,
    CASE WHEN sequence_number % 4 = 0 THEN 'APBD-Perubahan' ELSE 'APBD' END AS sumber_dana,
    dinas,
    'Kabupaten Berau' AS alamat_dinas,
    lokasi_kecamatan,
    format('PPK Simulasi %s', ((sequence_number - 1) % 6) + 1) AS nama_ppk,
    350000000::numeric + (sequence_number::numeric * 87500000) AS pagu_dana,
    325000000::numeric + (sequence_number::numeric * 84000000) AS hps,
    300000000::numeric + (sequence_number::numeric * 81000000) AS nilai_penawaran,
    nama_perusahaan,
    make_date(tahun_anggaran, ((sequence_number - 1) % 10) + 1, 5) AS tanggal_mulai,
    make_date(tahun_anggaran, LEAST(((sequence_number - 1) % 10) + 3, 12), 20) AS tanggal_selesai,
    60 + ((sequence_number - 1) % 4) * 30 AS durasi_hari,
    tahap_progress,
    persentase_progress,
    CASE WHEN sequence_number % 5 = 0 THEN 'Borrowed' WHEN sequence_number % 7 = 0 THEN 'Get Borrowed' ELSE 'Work' END AS status_proyek
  FROM seed
)
INSERT INTO public.proyek (
  nama_proyek,
  paket_pekerjaan_induk,
  nomor_kontrak,
  tanggal_kontrak,
  jenis_pekerjaan,
  kategori_pekerjaan,
  tahun_anggaran,
  sumber_dana,
  dinas,
  alamat_dinas,
  lokasi_kecamatan,
  nama_ppk,
  pagu_dana,
  hps,
  nilai_penawaran,
  perusahaan_id,
  tanggal_mulai,
  tanggal_selesai,
  durasi_hari,
  tahap_progress,
  persentase_progress,
  status_proyek,
  status_tender,
  skema_pembayaran,
  jalur_masuk,
  catatan
)
SELECT
  pv.nama_proyek,
  pv.paket_pekerjaan_induk,
  pv.nomor_kontrak,
  pv.tanggal_mulai,
  pv.jenis_pekerjaan,
  pv.kategori_pekerjaan,
  pv.tahun_anggaran,
  pv.sumber_dana,
  pv.dinas,
  pv.alamat_dinas,
  pv.lokasi_kecamatan,
  pv.nama_ppk,
  pv.pagu_dana,
  pv.hps,
  pv.nilai_penawaran,
  perusahaan.id,
  pv.tanggal_mulai,
  pv.tanggal_selesai,
  pv.durasi_hari,
  pv.tahap_progress,
  pv.persentase_progress,
  pv.status_proyek,
  'menang',
  'Termin',
  'dummy_performance_seed',
  'Data dummy untuk pengujian kepadatan daftar, filter, dan performa UI.'
FROM project_values pv
JOIN LATERAL (
  SELECT id
  FROM public.perusahaan
  WHERE lower(nama_perusahaan) = lower(pv.nama_perusahaan)
  ORDER BY id
  LIMIT 1
) AS perusahaan ON true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.proyek proyek
  WHERE lower(proyek.nama_proyek) = lower(pv.nama_proyek)
    AND proyek.tahun_anggaran = pv.tahun_anggaran
    AND proyek.is_deleted = false
);

COMMIT;
