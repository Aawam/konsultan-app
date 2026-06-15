import { describe, expect, it } from 'vitest'
import { buildProyekPayload } from '@/lib/actions/proyek'
import type { ProyekFormData } from '@/lib/types/proyek'

const form: ProyekFormData = {
  nama_proyek: 'Perencanaan Gedung Kantor',
  paket_pekerjaan_induk: 'Pembangunan Gedung Kantor',
  jenis_pekerjaan: 'Perencanaan',
  kategori_pekerjaan: 'Bangunan Gedung',
  tahun_anggaran: 2026,
  sumber_dana: 'APBD',
  dinas: 'Dinas PUPR',
  lokasi_kecamatan: 'Samarinda Ulu',
  nama_ppk: 'Nama PPK',
  pagu_dana: '50000000',
  hps: '45000000',
  nilai_penawaran: '40000000',
  perusahaan_id: '00000000-0000-4000-8000-000000000000',
  tanggal_mulai: '2026-01-01',
  tanggal_selesai: '2026-02-01',
  durasi_hari: '30',
  tahap_progress: 'Konsep Desain',
  status_proyek: 'Work',
  catatan: '',
}

describe('buildProyekPayload', () => {
  it('normalizes form strings into a database payload', () => {
    const payload = buildProyekPayload(form)

    expect(payload.pagu_dana).toBe(50000000)
    expect(payload.hps).toBe(45000000)
    expect(payload.nilai_penawaran).toBe(40000000)
    expect(payload.durasi_hari).toBe(30)
    expect(payload.persentase_progress).toBe(40)
    expect(payload.jalur_masuk).toBe('manual')
    expect(payload.catatan).toBeNull()
  })

  it('keeps optional numeric fields as null when blank', () => {
    const payload = buildProyekPayload({
      ...form,
      hps: '',
      nilai_penawaran: '',
      tahap_progress: '',
    })

    expect(payload.hps).toBeNull()
    expect(payload.nilai_penawaran).toBeNull()
    expect(payload.tahap_progress).toBeNull()
    expect(payload.persentase_progress).toBe(0)
  })
})
