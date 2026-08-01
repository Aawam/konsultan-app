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
    CASE
      WHEN sequence_number % 3 = 0 THEN
        (ARRAY['Persiapan', 'Pengawasan Tahap 1', 'Pengawasan Tahap 2', 'Pengawasan Tahap 3', 'Selesai (BAST)'])[
          ((sequence_number - 1) % 5) + 1
        ]
      ELSE
        (ARRAY['Persiapan & SPMK', 'Survey Lapangan', 'Konsep Desain', 'Penyusunan Laporan Antara', 'Penyusunan Laporan Akhir & RAB', 'Penyerahan & Revisi', 'Selesai (BAST)'])[
          ((sequence_number - 1) % 7) + 1
        ]
    END AS tahap_progress,
    CASE
      WHEN sequence_number % 3 = 0 THEN
        (ARRAY[10, 30, 60, 90, 100])[((sequence_number - 1) % 5) + 1]
      ELSE
        (ARRAY[5, 20, 40, 60, 80, 95, 100])[((sequence_number - 1) % 7) + 1]
    END AS persentase_progress
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
),
resolved_project_values AS (
  SELECT
    pv.*,
    perusahaan.id AS perusahaan_id
  FROM project_values pv
  JOIN LATERAL (
    SELECT id
    FROM public.perusahaan
    WHERE lower(nama_perusahaan) = lower(pv.nama_perusahaan)
    ORDER BY id
    LIMIT 1
  ) AS perusahaan ON true
),
updated AS (
  UPDATE public.proyek proyek
  SET
    paket_pekerjaan_induk = pv.paket_pekerjaan_induk,
    nomor_kontrak = pv.nomor_kontrak,
    tanggal_kontrak = pv.tanggal_mulai,
    jenis_pekerjaan = pv.jenis_pekerjaan,
    kategori_pekerjaan = pv.kategori_pekerjaan,
    sumber_dana = pv.sumber_dana,
    dinas = pv.dinas,
    alamat_dinas = pv.alamat_dinas,
    lokasi_kecamatan = pv.lokasi_kecamatan,
    nama_ppk = pv.nama_ppk,
    pagu_dana = pv.pagu_dana,
    hps = pv.hps,
    nilai_penawaran = pv.nilai_penawaran,
    perusahaan_id = pv.perusahaan_id,
    tanggal_mulai = pv.tanggal_mulai,
    tanggal_selesai = pv.tanggal_selesai,
    durasi_hari = pv.durasi_hari,
    tahap_progress = pv.tahap_progress,
    persentase_progress = pv.persentase_progress,
    status_proyek = pv.status_proyek,
    status_tender = 'menang',
    skema_pembayaran = 'Termin',
    catatan = 'Data dummy untuk pengujian kepadatan daftar, filter, dan performa UI.',
    updated_at = now()
  FROM resolved_project_values pv
  WHERE lower(proyek.nama_proyek) = lower(pv.nama_proyek)
    AND proyek.tahun_anggaran = pv.tahun_anggaran
    AND proyek.jalur_masuk = 'dummy_performance_seed'
    AND proyek.is_deleted = false
  RETURNING proyek.id
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
  pv.perusahaan_id,
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
FROM resolved_project_values pv
WHERE NOT EXISTS (
  SELECT 1
  FROM public.proyek proyek
  WHERE lower(proyek.nama_proyek) = lower(pv.nama_proyek)
    AND proyek.tahun_anggaran = pv.tahun_anggaran
    AND proyek.is_deleted = false
);

COMMIT;
