import { describe, expect, it } from 'vitest'

import {
  PROJECT_WORKFLOW_TRANSITIONS,
  evaluateProjectWorkflowTransition,
} from '@/lib/project-workflow'
import type { ProjectCompletenessInput } from '@/lib/project-completeness'

const completePlanningProject: ProjectCompletenessInput = {
  nama_proyek: 'Perencanaan Gedung Kantor',
  jenis_pekerjaan: 'Perencanaan',
  kategori_pekerjaan: 'Bangunan Gedung',
  tahun_anggaran: 2026,
  sumber_dana: 'APBD',
  dinas: 'Dinas PUPR',
  lokasi_kecamatan: 'Tanjung Redeb',
  nama_ppk: 'PPK Teknis',
  perusahaan_id: 'company-1',
  tanggal_mulai: '2026-01-01',
  tanggal_selesai: '2026-03-01',
  status_proyek: 'Work',
  tahap_progress: 'Konsep Desain',
  persentase_progress: 40,
  pagu_dana: 100_000_000,
  hps: 95_000_000,
  nilai_penawaran: 90_000_000,
}

describe('evaluateProjectWorkflowTransition', () => {
  it('builds the canonical update for a complete planning project moving to RAB-ready', () => {
    const result = evaluateProjectWorkflowTransition(completePlanningProject, 'mark_rab_ready')

    expect(result).toEqual({
      allowed: true,
      reason: null,
      update: {
        tahap_progress: PROJECT_WORKFLOW_TRANSITIONS.mark_rab_ready.tahapProgress,
        persentase_progress: PROJECT_WORKFLOW_TRANSITIONS.mark_rab_ready.persentaseProgress,
      },
      completeness: expect.objectContaining({
        status: 'needs_review',
        canStartRab: false,
      }),
    })
  })

  it('blocks non-planning projects from moving into RAB-ready workflow', () => {
    const result = evaluateProjectWorkflowTransition(
      { ...completePlanningProject, jenis_pekerjaan: 'Pengawasan', tahap_progress: 'Pengawasan Tahap 1' },
      'mark_rab_ready'
    )

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('not-planning')
    expect(result.update).toBeNull()
  })

  it('blocks transition when required project data is still missing', () => {
    const result = evaluateProjectWorkflowTransition(
      { ...completePlanningProject, nama_ppk: null },
      'mark_rab_ready'
    )

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('missing-data')
    expect(result.update).toBeNull()
    expect(result.completeness.missingFields.map((field) => field.label)).toContain('Nama PPK')
  })

  it('blocks duplicate transition when the project is already RAB-ready', () => {
    const result = evaluateProjectWorkflowTransition(
      {
        ...completePlanningProject,
        tahap_progress: PROJECT_WORKFLOW_TRANSITIONS.mark_rab_ready.tahapProgress,
        persentase_progress: PROJECT_WORKFLOW_TRANSITIONS.mark_rab_ready.persentaseProgress,
      },
      'mark_rab_ready'
    )

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('already-ready')
    expect(result.update).toBeNull()
  })
})
