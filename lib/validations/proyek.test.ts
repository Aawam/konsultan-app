import { describe, expect, it } from 'vitest'
import { proyekSchema } from '@/lib/validations/proyek'

const validProject = {
  nama_proyek: 'Perencanaan Gedung Kantor',
  paket_pekerjaan_induk: 'Pembangunan Gedung Kantor',
  jenis_pekerjaan: 'Perencanaan',
  kategori_pekerjaan: 'Bangunan Gedung',
  tahun_anggaran: 2026,
  sumber_dana: 'APBD',
  dinas: 'Dinas PUPR',
  lokasi_kecamatan: 'Samarinda Ulu',
  nama_ppk: 'Nama PPK',
  pagu_dana: 50000000,
  hps: 45000000,
  nilai_penawaran: 40000000,
  perusahaan_id: 'ypc',
  tanggal_mulai: '2026-01-01',
  tanggal_selesai: '2026-02-01',
  tahap_progress: 'Konsep Desain',
  status_proyek: 'Work',
  catatan: null,
  durasi_hari: 30,
}

describe('proyekSchema', () => {
  it('accepts a complete valid project payload', () => {
    expect(proyekSchema.safeParse(validProject).success).toBe(true)
  })

  it('requires positive budget and duration values', () => {
    const parsed = proyekSchema.safeParse({
      ...validProject,
      pagu_dana: 0,
      durasi_hari: 0,
    })

    expect(parsed.success).toBe(false)
  })

  it('rejects an invalid status bendera value', () => {
    const parsed = proyekSchema.safeParse({
      ...validProject,
      status_proyek: 'Unknown',
    })

    expect(parsed.success).toBe(false)
  })
})
