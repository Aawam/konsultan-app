import { evaluateProjectCompleteness, type ProjectCompletenessInput, type ProjectCompletenessResult } from '@/lib/project-completeness'

export type ProjectWorkflowTransition = 'mark_rab_ready'
export type ProjectWorkflowTransitionBlockReason = 'not-planning' | 'missing-data' | 'already-ready'

export const PROJECT_WORKFLOW_TRANSITIONS: Record<ProjectWorkflowTransition, {
  label: string
  tahapProgress: string
  persentaseProgress: number
}> = {
  mark_rab_ready: {
    label: 'Tandai Siap RAB',
    tahapProgress: 'Penyusunan Laporan Akhir & RAB',
    persentaseProgress: 80,
  },
}

export type ProjectWorkflowTransitionResult = {
  allowed: boolean
  reason: ProjectWorkflowTransitionBlockReason | null
  update: {
    tahap_progress: string
    persentase_progress: number
  } | null
  completeness: ProjectCompletenessResult
}

export function evaluateProjectWorkflowTransition(
  project: ProjectCompletenessInput,
  transition: ProjectWorkflowTransition,
  options: { includeCommercial?: boolean } = { includeCommercial: false }
): ProjectWorkflowTransitionResult {
  const completeness = evaluateProjectCompleteness(project, options)
  const target = PROJECT_WORKFLOW_TRANSITIONS[transition]

  if (project.jenis_pekerjaan !== 'Perencanaan') {
    return {
      allowed: false,
      reason: 'not-planning',
      update: null,
      completeness,
    }
  }

  if (completeness.missingFields.length > 0) {
    return {
      allowed: false,
      reason: 'missing-data',
      update: null,
      completeness,
    }
  }

  if (
    project.tahap_progress === target.tahapProgress &&
    project.persentase_progress === target.persentaseProgress
  ) {
    return {
      allowed: false,
      reason: 'already-ready',
      update: null,
      completeness,
    }
  }

  return {
    allowed: true,
    reason: null,
    update: {
      tahap_progress: target.tahapProgress,
      persentase_progress: target.persentaseProgress,
    },
    completeness,
  }
}
