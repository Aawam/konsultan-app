import type { KategoriPekerjaan } from '@/lib/constants/proyek'
export type { KategoriPekerjaan }

export type Perusahaan = {
  id: string
  nama_perusahaan: string
  adalah_perusahaan_sendiri: boolean
}

export type DinasOption = {
  id?: string
  dinas: string
}

export type ProyekDisplay = {
  id: string
  nama_proyek: string
  jenis_pekerjaan: string
  tahun_anggaran: number
  dinas: string
  lokasi_kecamatan: string | null
  pagu_dana: number
  nilai_penawaran: number | null
  tahap_progress: string | null
  persentase_progress: number | null
  pernah_dioverride: boolean
  status_proyek?: 'Work' | 'Borrowed' | 'Get Borrowed' | null
  perusahaan_id?: string | null
  created_at?: string | null
  is_deleted?: boolean;
  perusahaan: { nama_perusahaan: string } | { nama_perusahaan: string }[] | null
}

export type ProyekDetail = {
  id: string
  nama_proyek: string
  paket_pekerjaan_induk: string | null
  nomor_kontrak: string | null
  jenis_pekerjaan: string
  kategori_pekerjaan: string
  tahun_anggaran: number
  sumber_dana: string
  dinas: string
  lokasi_kecamatan: string | null
  nama_ppk: string | null
  pagu_dana: number
  hps: number | null
  nilai_penawaran: number | null
  perusahaan_id: string | null
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  durasi_hari: number | null
  tahap_progress: string | null
  persentase_progress: number | null
  pernah_dioverride: boolean | null
  status_proyek: 'Work' | 'Borrowed' | 'Get Borrowed' | null
  jalur_masuk: string | null
  catatan: string | null
  created_at: string
  updated_at: string
  is_deleted?: boolean | null
  perusahaan: { nama_perusahaan: string; adalah_perusahaan_sendiri: boolean } | null
}

export function getNamaPerusahaan(p: ProyekDisplay['perusahaan']): string {
  if (!p) return '-'
  if (Array.isArray(p)) return p[0]?.nama_perusahaan ?? '-'
  return p.nama_perusahaan ?? '-'
}

export type ProyekFormData = {
  id?: string
  nama_proyek?: string
  paket_pekerjaan_induk?: string
  nomor_kontrak?: string
  jenis_pekerjaan?: 'Perencanaan' | 'Pengawasan' | ''
  kategori_pekerjaan?: KategoriPekerjaan | string
  tahun_anggaran?: number
  sumber_dana?: 'APBD' | 'APBD-Perubahan'
  dinas?: string
  lokasi_kecamatan?: string
  nama_ppk?: string
  pagu_dana?: string
  hps?: string
  nilai_penawaran?: string
  perusahaan_id?: string
  tanggal_mulai?: string
  tanggal_selesai?: string
  durasi_hari?: string
  tahap_progress?: string
  status_proyek?: 'Work' | 'Borrowed' | 'Get Borrowed' | ''
  catatan?: string
}

export type ProyekPayload = {
  nama_proyek: string
  paket_pekerjaan_induk: string
  nomor_kontrak: string | null
  jenis_pekerjaan: string
  kategori_pekerjaan: string
  tahun_anggaran: number
  sumber_dana: string
  dinas: string
  lokasi_kecamatan: string
  nama_ppk: string
  pagu_dana: number
  hps: number | null
  nilai_penawaran: number | null
  perusahaan_id: string
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  durasi_hari: number | null
  tahap_progress: string | null
  persentase_progress: number
  catatan: string | null
  jalur_masuk?: 'manual' | 'penawaran'
  status_tender?: 'tidak_diketahui' | 'menang' | 'kalah' | null
  status_proyek?: 'Work' | 'Borrowed' | 'Get Borrowed' | null
}
