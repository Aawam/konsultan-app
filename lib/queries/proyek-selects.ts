export const PROYEK_DETAIL_SELECT = `
  id,
  nama_proyek,
  paket_pekerjaan_induk,
  nomor_kontrak,
  jenis_pekerjaan,
  kategori_pekerjaan,
  tahun_anggaran,
  sumber_dana,
  dinas,
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
  catatan,
  jalur_masuk,
  pernah_dioverride,
  created_at,
  updated_at,
  perusahaan:perusahaan_id (
    nama_perusahaan,
    adalah_perusahaan_sendiri
  )
`

export const PROYEK_LIST_SELECT = `
  id,
  nama_proyek,
  jenis_pekerjaan,
  tahun_anggaran,
  dinas,
  lokasi_kecamatan,
  pagu_dana,
  nilai_penawaran,
  tahap_progress,
  persentase_progress,
  pernah_dioverride,
  status_proyek,
  perusahaan_id,
  created_at,
  updated_at,
  perusahaan:perusahaan_id (
    nama_perusahaan
  )
`

export const OVERRIDE_LOG_SELECT = `
  id,
  proyek_id,
  field_dioverride,
  nilai_sebelum,
  nilai_sesudah,
  alasan,
  dilakukan_oleh,
  dilakukan_pada
`

export const PROYEK_MUTATION_RETURN_SELECT = 'id'
