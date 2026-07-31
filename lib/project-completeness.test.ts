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
  it('marks a project as complete without coupling monitoring to RAB readiness', () => {
    const result = evaluateProjectCompleteness(completeProject)

    expect(result.status).toBe('complete')
    expect(result.missingFields).toEqual([])
    expect(result.blockingReasons).toEqual([])
    expect(result.nextAction).toBe('Data proyek lengkap. Lanjutkan monitoring pekerjaan.')
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
  })

  it('does not flag a complete early-phase project as a monitoring problem', () => {
    const result = evaluateProjectCompleteness({
      ...completeProject,
      tahap_progress: 'Konsep Desain',
      persentase_progress: 40,
    })

    expect(result.status).toBe('complete')
    expect(result.blockingReasons).toEqual([])
    expect(result.nextAction).toBe('Data proyek lengkap. Lanjutkan monitoring pekerjaan.')
  })
})

describe('getProjectWorkflowGate', () => {
  it('returns the first gate that still blocks the project', () => {
    expect(getProjectWorkflowGate(evaluateProjectCompleteness(completeProject))).toBe('Data lengkap')

    const incomplete = evaluateProjectCompleteness({
      ...completeProject,
      dinas: '',
    })

    expect(getProjectWorkflowGate(incomplete)).toBe('Lengkapi data')
  })
})
