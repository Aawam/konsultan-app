import { describe, expect, it } from 'vitest'

import { buildRabPdfFilename, createRabPdf } from '@/lib/rab-pdf'
import type { RabMakerSnapshot } from '@/lib/types/ahsp'
import type { ProyekDetail } from '@/lib/types/proyek'

const project = {
  id: 'project-1',
  nama_proyek: 'Perencanaan Drainase Pasar Baru',
  paket_pekerjaan_induk: null,
  nomor_kontrak: null,
  jenis_pekerjaan: 'Perencanaan',
  kategori_pekerjaan: 'SDA',
  tahun_anggaran: 2026,
  sumber_dana: 'APBD',
  dinas: 'Dinas PUPR',
  lokasi_kecamatan: 'Tanjung Redeb',
  nama_ppk: 'PPK',
  pagu_dana: null,
  hps: null,
  nilai_penawaran: null,
  perusahaan_id: 'company-1',
  tanggal_mulai: '2026-01-01',
  tanggal_selesai: '2026-02-01',
  durasi_hari: 30,
  tahap_progress: 'Penyusunan Laporan Akhir & RAB',
  persentase_progress: 80,
  pernah_dioverride: false,
  status_proyek: 'Work',
  jalur_masuk: 'manual',
  catatan: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  is_deleted: false,
  perusahaan: null,
} satisfies ProyekDetail

const snapshot = {
  maker: {
    id: 'maker-1',
    proyek_id: 'project-1',
    status: 'validated',
    ppn_persen: 11,
    subtotal: 99000,
    ppn_nilai: 10890,
    total_final: 109890,
    validated_by: 'user-1',
    validated_at: '2026-01-01',
    finalized_by: null,
    finalized_at: null,
    updated_at: '2026-01-01',
  },
  items: [
    {
      id: 'item-1',
      rab_maker_id: 'maker-1',
      source_ahsp_item_id: 'ahsp-1',
      kode_analisa_snapshot: '1.1',
      uraian_pekerjaan_snapshot: 'Galian tanah',
      bidang_snapshot: 'SDA',
      sub_bidang_snapshot: 'Drainase',
      kategori_snapshot: 'Pekerjaan Tanah',
      satuan_snapshot: 'm3',
      volume: 10,
      profit_persen_default: 10,
      profit_persen_final: 10,
      profit_override_reason: null,
      harga_dasar_total: 9000,
      profit_nilai: 900,
      harga_satuan: 9900,
      jumlah_harga: 99000,
      koefisien_locked: true,
      urutan: 1,
    },
  ],
  detailsByItem: {},
} satisfies RabMakerSnapshot

describe('buildRabPdfFilename', () => {
  it('creates a safe pdf filename', () => {
    expect(buildRabPdfFilename(project)).toBe('rab-perencanaan-drainase-pasar-baru-2026.pdf')
  })
})

describe('createRabPdf', () => {
  it('creates a readable PDF buffer for approved RAB data', () => {
    const pdf = createRabPdf(project, snapshot)
    const text = pdf.toString('ascii')

    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text).toContain('RAB / Engineering Estimate')
    expect(text).toContain('Perencanaan Drainase Pasar Baru')
    expect(text).toContain('Galian tanah')
    expect(text).toContain('xref')
  })
})
