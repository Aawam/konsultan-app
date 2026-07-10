import { describe, expect, it } from 'vitest'

import {
  evaluateProjectCompleteness,
  getProjectWorkflowGate,
  type ProjectCompletenessInput,
} from '@/lib/project-completeness'

const completeProject: ProjectCompletenessInput = {
  nama_proyek: 'Perencanaan Drainase Kampung Gunung Panjang',
  jenis_pekerjaan: 'Perencanaan',
  kategori_pekerjaan: 'SDA',
  tahun_anggaran: 2026,
  sumber_dana: 'APBD',
  dinas: 'Dinas PUPR Berau',
  lokasi_kecamatan: 'Tanjung Redeb',
  nama_ppk: 'Andi, ST',
  perusahaan_id: 'company-1',
  tanggal_mulai: '2026-01-01',
  tanggal_selesai: '2026-03-01',
  status_proyek: 'Work',
  tahap_progress: 'Penyusunan Laporan Akhir & RAB',
  persentase_progress: 80,
  pagu_dana: 250_000_000,
  hps: 240_000_000,
  nilai_penawaran: 230_000_000,
}

describe('evaluateProjectCompleteness', () => {
  it('marks a complete Perencanaan project as ready for RAB', () => {
    const result = evaluateProjectCompleteness(completeProject)

    expect(result.status).toBe('complete')
    expect(result.missingFields).toEqual([])
    expect(result.canStartRab).toBe(true)
    expect(result.nextAction).toBe('Siap susun RAB/EE.')
  })

  it('reports missing core project fields', () => {
    const result = evaluateProjectCompleteness({
      ...completeProject,
      perusahaan_id: null,
      lokasi_kecamatan: null,
      tanggal_mulai: null,
      tahap_progress: null,
      persentase_progress: 0,
    })

    expect(result.status).toBe('incomplete')
    expect(result.missingFields.map((field) => field.label)).toEqual([
      'Perusahaan',
      'Kecamatan/Lokasi',
      'Tanggal mulai',
      'Tahap progress',
    ])
    expect(result.canStartRab).toBe(false)
  })

  it('blocks RAB readiness before the RAB-producing Perencanaan phase', () => {
    const result = evaluateProjectCompleteness({
      ...completeProject,
      tahap_progress: 'Konsep Desain',
      persentase_progress: 40,
    })

    expect(result.status).toBe('needs_review')
    expect(result.blockingReasons).toEqual(['Progress belum masuk tahap penyusunan RAB/EE.'])
    expect(result.canStartRab).toBe(false)
  })
})

describe('getProjectWorkflowGate', () => {
  it('returns the first gate that still blocks the project', () => {
    expect(getProjectWorkflowGate(evaluateProjectCompleteness(completeProject))).toBe('Siap RAB')

    const incomplete = evaluateProjectCompleteness({
      ...completeProject,
      dinas: '',
    })

    expect(getProjectWorkflowGate(incomplete)).toBe('Lengkapi data')
  })
})
