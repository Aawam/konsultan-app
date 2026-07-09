BEGIN;

-- Dummy project/company data for staging UI flow testing.
-- Idempotent by company name and project name/year.

INSERT INTO public.dinas_skpd (nama_dinas)
SELECT v.nama_dinas
FROM (
  VALUES
    ('Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Berau'),
    ('Dinas Perumahan dan Kawasan Permukiman Kabupaten Berau'),
    ('Dinas Pendidikan Kabupaten Berau'),
    ('Dinas Kesehatan Kabupaten Berau'),
    ('Dinas Perhubungan Kabupaten Berau'),
    ('Dinas Lingkungan Hidup dan Kebersihan Kabupaten Berau')
) AS v(nama_dinas)
WHERE NOT EXISTS (
  SELECT 1 FROM public.dinas_skpd d
  WHERE lower(d.nama_dinas) = lower(v.nama_dinas)
);

INSERT INTO public.perusahaan (
  nama_perusahaan,
  adalah_perusahaan_sendiri,
  inisial_perusahaan,
  alamat,
  kota,
  kode_pos,
  npwp,
  telepon,
  email,
  nama_direktur,
  sbu,
  subklasifikasi_sbu,
  masa_berlaku_sbu,
  kode_kbli,
  nib,
  bank_nama,
  bank_rekening,
  bank_atas_nama
)
SELECT
  v.nama_perusahaan,
  v.adalah_perusahaan_sendiri,
  v.inisial_perusahaan,
  v.alamat,
  v.kota,
  v.kode_pos,
  v.npwp,
  v.telepon,
  v.email,
  v.nama_direktur,
  v.sbu,
  v.subklasifikasi_sbu,
  v.masa_berlaku_sbu::date,
  v.kode_kbli,
  v.nib,
  v.bank_nama,
  v.bank_rekening,
  v.bank_atas_nama
FROM (
  VALUES
    ('PT Konsultan Berau Mandiri', true, 'KBM', 'Jl. Pemuda No. 18, Tanjung Redeb', 'Berau', '77311', '01.234.567.8-724.000', '0812-5400-1001', 'admin@kbm.test', 'Andi Wijaya', 'RK003', 'Jasa Desain Rekayasa Konstruksi', '2028-12-31', '71102', '912030001001', 'Bankaltimtara', '1234567890', 'PT Konsultan Berau Mandiri'),
    ('CV Bumi Segah Engineering', false, 'BSE', 'Jl. Durian III No. 7, Tanjung Redeb', 'Berau', '77312', '02.345.678.9-724.000', '0812-5400-1002', 'kontak@bse.test', 'Rizal Pratama', 'RK003', 'Jasa Rekayasa Jalan dan Jembatan', '2027-10-15', '71102', '912030001002', 'BRI', '1234567891', 'CV Bumi Segah Engineering'),
    ('PT Pesisir Kaltim Konsulindo', false, 'PKK', 'Jl. Pulau Derawan No. 22, Tanjung Redeb', 'Berau', '77313', '03.456.789.0-724.000', '0812-5400-1003', 'office@pkk.test', 'Siti Rahmah', 'RK001', 'Jasa Nasihat dan Konsultansi Rekayasa', '2028-06-30', '71102', '912030001003', 'Mandiri', '1234567892', 'PT Pesisir Kaltim Konsulindo'),
    ('CV Derawan Cipta Desain', false, 'DCD', 'Jl. Mangga II No. 14, Tanjung Redeb', 'Berau', '77314', '04.567.890.1-724.000', '0812-5400-1004', 'hello@dcd.test', 'Muhammad Fadli', 'AR102', 'Jasa Arsitektur Bangunan Gedung', '2027-09-20', '71101', '912030001004', 'BNI', '1234567893', 'CV Derawan Cipta Desain'),
    ('PT Kalimarau Infrastruktur', false, 'KMI', 'Jl. Raja Alam I No. 5, Tanjung Redeb', 'Berau', '77315', '05.678.901.2-724.000', '0812-5400-1005', 'info@kmi.test', 'Yusuf Hakim', 'RK003', 'Jasa Rekayasa Transportasi', '2029-01-31', '71102', '912030001005', 'BCA', '1234567894', 'PT Kalimarau Infrastruktur'),
    ('CV Teluk Bayur Konsultan', false, 'TBK', 'Jl. Pelabuhan No. 9, Teluk Bayur', 'Berau', '77352', '06.789.012.3-724.000', '0812-5400-1006', 'admin@tbk.test', 'Maya Lestari', 'RK002', 'Jasa Rekayasa Sumber Daya Air', '2028-03-10', '71102', '912030001006', 'Bankaltimtara', '1234567895', 'CV Teluk Bayur Konsultan'),
    ('PT Maratua Rekayasa Prima', false, 'MRP', 'Jl. Ahmad Yani No. 33, Tanjung Redeb', 'Berau', '77316', '07.890.123.4-724.000', '0812-5400-1007', 'office@mrp.test', 'Hendra Saputra', 'RK004', 'Jasa Manajemen Proyek Konstruksi', '2027-12-01', '71102', '912030001007', 'BRI', '1234567896', 'PT Maratua Rekayasa Prima'),
    ('CV Gunung Tabur Teknik', false, 'GTT', 'Jl. Kesultanan No. 12, Gunung Tabur', 'Berau', '77351', '08.901.234.5-724.000', '0812-5400-1008', 'kontak@gtt.test', 'Nur Aisyah', 'RK003', 'Jasa Rekayasa Bangunan Sipil', '2028-11-05', '71102', '912030001008', 'Mandiri', '1234567897', 'CV Gunung Tabur Teknik'),
    ('PT Sambaliung Urban Konsultan', false, 'SUK', 'Jl. Sultan Agung No. 21, Sambaliung', 'Berau', '77371', '09.012.345.6-724.000', '0812-5400-1009', 'mail@suk.test', 'Budi Santoso', 'RK001', 'Jasa Perencanaan Wilayah dan Kota', '2029-05-25', '71102', '912030001009', 'BNI', '1234567898', 'PT Sambaliung Urban Konsultan'),
    ('CV Segah Maju Engineering', false, 'SME', 'Jl. Poros Segah Km 4, Segah', 'Berau', '77361', '10.123.456.7-724.000', '0812-5400-1010', 'admin@sme.test', 'Dewi Kartika', 'RK002', 'Jasa Rekayasa Sanitasi dan Air Minum', '2028-08-17', '71102', '912030001010', 'BCA', '1234567899', 'CV Segah Maju Engineering')
) AS v(
  nama_perusahaan,
  adalah_perusahaan_sendiri,
  inisial_perusahaan,
  alamat,
  kota,
  kode_pos,
  npwp,
  telepon,
  email,
  nama_direktur,
  sbu,
  subklasifikasi_sbu,
  masa_berlaku_sbu,
  kode_kbli,
  nib,
  bank_nama,
  bank_rekening,
  bank_atas_nama
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.perusahaan p
  WHERE lower(p.nama_perusahaan) = lower(v.nama_perusahaan)
);

WITH project_values AS (
  SELECT *
  FROM (
    VALUES
      ('Perencanaan Rehabilitasi Gedung Kantor Kecamatan Tanjung Redeb', 'Belanja Jasa Konsultansi Perencanaan Bangunan Gedung', '027/PRC-GDG/TRD/2026', 'Perencanaan', 'Bangunan Gedung', 2026, 'APBD', 'Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Berau', 'Jl. APT Pranoto No. 01, Tanjung Redeb', 'Tanjung Redeb', 'Ir. H. Mansyur', 850000000::numeric, 820000000::numeric, 793500000::numeric, 'PT Konsultan Berau Mandiri', '2026-02-03'::date, '2026-03-24'::date, 50, 'Penyusunan Laporan Antara', 60, 'Work'),
      ('Perencanaan Drainase Lingkungan Kampung Gunung Panjang', 'Belanja Jasa Konsultansi Perencanaan Drainase', '027/PRC-DRN/GP/2026', 'Perencanaan', 'Sanitasi & Air Minum', 2026, 'APBD', 'Dinas Perumahan dan Kawasan Permukiman Kabupaten Berau', 'Jl. Murjani II, Tanjung Redeb', 'Tanjung Redeb', 'Rahmat Hidayat, ST', 640000000::numeric, 612000000::numeric, 589750000::numeric, 'CV Bumi Segah Engineering', '2026-01-20'::date, '2026-03-10'::date, 50, 'Survey Lapangan', 20, 'Work'),
      ('Pengawasan Peningkatan Jalan Poros Sambaliung', 'Belanja Jasa Konsultansi Pengawasan Jalan Kabupaten', '027/PWS-JLN/SBL/2026', 'Pengawasan', 'Jalan & Jembatan', 2026, 'APBD', 'Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Berau', 'Jl. APT Pranoto No. 01, Tanjung Redeb', 'Sambaliung', 'Darmawan, ST', 3200000000::numeric, 3010000000::numeric, 2875000000::numeric, 'PT Kalimarau Infrastruktur', '2026-04-01'::date, '2026-09-28'::date, 180, 'Pengawasan Tahap 1', 30, 'Work'),
      ('Perencanaan SPAM Perdesaan Kampung Buyung-Buyung', 'Belanja Jasa Konsultansi Perencanaan Air Minum', '027/PRC-SPAM/BB/2026', 'Perencanaan', 'Sanitasi & Air Minum', 2026, 'APBD-Perubahan', 'Dinas Perumahan dan Kawasan Permukiman Kabupaten Berau', 'Jl. Murjani II, Tanjung Redeb', 'Tabalar', 'Sulaiman, ST', 1250000000::numeric, 1198000000::numeric, 1139500000::numeric, 'CV Segah Maju Engineering', '2026-07-15'::date, '2026-09-13'::date, 60, 'Konsep Desain', 40, 'Work'),
      ('Pengawasan Pembangunan Puskesmas Pembantu Kampung Merancang', 'Belanja Jasa Konsultansi Pengawasan Bangunan Kesehatan', '027/PWS-PUSTU/MRC/2026', 'Pengawasan', 'Bangunan Gedung', 2026, 'APBD', 'Dinas Kesehatan Kabupaten Berau', 'Jl. Pulau Panjang No. 12, Tanjung Redeb', 'Gunung Tabur', 'dr. Ratna Sari', 1450000000::numeric, 1385000000::numeric, 1320000000::numeric, 'CV Gunung Tabur Teknik', '2026-03-05'::date, '2026-07-02'::date, 120, 'Pengawasan Tahap 2', 60, 'Work'),
      ('Perencanaan Jembatan Lingkungan Kampung Tumbit Melayu', 'Belanja Jasa Konsultansi Perencanaan Jembatan', '027/PRC-JBT/TM/2026', 'Perencanaan', 'Jalan & Jembatan', 2026, 'APBD', 'Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Berau', 'Jl. APT Pranoto No. 01, Tanjung Redeb', 'Teluk Bayur', 'Arif Rahman, ST', 2100000000::numeric, 1980000000::numeric, 1897500000::numeric, 'CV Teluk Bayur Konsultan', '2026-02-17'::date, '2026-05-17'::date, 90, 'Penyusunan Laporan Akhir & RAB', 80, 'Borrowed'),
      ('Pengawasan Renovasi Ruang Kelas SDN 004 Tanjung Redeb', 'Belanja Jasa Konsultansi Pengawasan Bangunan Pendidikan', '027/PWS-SD004/TRD/2026', 'Pengawasan', 'Bangunan Gedung', 2026, 'APBD-Perubahan', 'Dinas Pendidikan Kabupaten Berau', 'Jl. Pemuda No. 10, Tanjung Redeb', 'Tanjung Redeb', 'Siti Halimah, S.Pd', 975000000::numeric, 930000000::numeric, 890000000::numeric, 'CV Derawan Cipta Desain', '2026-08-01'::date, '2026-11-28'::date, 120, 'Persiapan', 10, 'Get Borrowed'),
      ('Perencanaan Penataan Kawasan Wisata Tepian Segah', 'Belanja Jasa Konsultansi Perencanaan Kawasan', '027/PRC-KWS/SGH/2026', 'Perencanaan', 'Lainnya', 2026, 'APBD', 'Dinas Lingkungan Hidup dan Kebersihan Kabupaten Berau', 'Jl. Mangga I No. 02, Tanjung Redeb', 'Tanjung Redeb', 'Herman, ST', 1800000000::numeric, 1715000000::numeric, 1632500000::numeric, 'PT Sambaliung Urban Konsultan', '2026-05-06'::date, '2026-08-03'::date, 90, 'Penyerahan & Revisi', 95, 'Work'),
      ('Perencanaan Penerangan Jalan Umum Koridor Kalimarau', 'Belanja Jasa Konsultansi Perencanaan PJU', '027/PRC-PJU/KLR/2026', 'Perencanaan', 'Listrik & Mekanikal', 2026, 'APBD', 'Dinas Perhubungan Kabupaten Berau', 'Jl. Pemuda No. 40, Tanjung Redeb', 'Teluk Bayur', 'Bambang Priyono, ST', 1650000000::numeric, 1570000000::numeric, 1498500000::numeric, 'PT Maratua Rekayasa Prima', '2026-04-12'::date, '2026-06-10'::date, 60, 'Selesai (BAST)', 100, 'Work'),
      ('Pengawasan Rehabilitasi Saluran Irigasi Kampung Labanan Makmur', 'Belanja Jasa Konsultansi Pengawasan Irigasi', '027/PWS-IRG/LBN/2026', 'Pengawasan', 'Irigasi', 2026, 'APBD', 'Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Berau', 'Jl. APT Pranoto No. 01, Tanjung Redeb', 'Teluk Bayur', 'Syamsul Bahri, ST', 2400000000::numeric, 2285000000::numeric, 2170000000::numeric, 'PT Pesisir Kaltim Konsulindo', '2026-06-01'::date, '2026-10-29'::date, 150, 'Pengawasan Tahap 3', 90, 'Work')
  ) AS v(
    nama_proyek,
    paket_pekerjaan_induk,
    nomor_kontrak,
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
    nama_perusahaan,
    tanggal_mulai,
    tanggal_selesai,
    durasi_hari,
    tahap_progress,
    persentase_progress,
    status_proyek
  )
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
  p.id,
  pv.tanggal_mulai,
  pv.tanggal_selesai,
  pv.durasi_hari,
  pv.tahap_progress,
  pv.persentase_progress,
  pv.status_proyek,
  'menang',
  'Termin',
  'dummy_seed',
  'Data dummy untuk simulasi flow proyek dan perusahaan.'
FROM project_values pv
JOIN LATERAL (
  SELECT id FROM public.perusahaan p
  WHERE lower(p.nama_perusahaan) = lower(pv.nama_perusahaan)
  ORDER BY p.id
  LIMIT 1
) p ON true
WHERE NOT EXISTS (
  SELECT 1 FROM public.proyek pr
  WHERE lower(pr.nama_proyek) = lower(pv.nama_proyek)
    AND pr.tahun_anggaran = pv.tahun_anggaran
    AND pr.is_deleted = false
);

COMMIT;
