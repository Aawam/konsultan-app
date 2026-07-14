export type ProjectCompletenessStatus = 'complete' | 'incomplete' | 'needs_review'
export type ProjectWorkflowGate = 'Lengkapi data' | 'Siap kerja' | 'Siap RAB'
export type ProjectRabReadinessReason = 'not-planning' | 'missing-data' | 'workflow-review'

export type ProjectCompletenessInput = {
  nama_proyek?: string | null
  jenis_pekerjaan?: string | null
  kategori_pekerjaan?: string | null
  tahun_anggaran?: number | null
  sumber_dana?: string | null
  dinas?: string | null
  lokasi_kecamatan?: string | null
  nama_ppk?: string | null
  perusahaan_id?: string | null
  tanggal_mulai?: string | null
  tanggal_selesai?: string | null
  status_proyek?: string | null
  tahap_progress?: string | null
  persentase_progress?: number | null
  pagu_dana?: number | null
  hps?: number | null
  nilai_penawaran?: number | null
}

export type MissingProjectField = {
  key: keyof ProjectCompletenessInput
  label: string
  scope: 'core' | 'commercial'
}

export type ProjectCompletenessResult = {
  status: ProjectCompletenessStatus
  missingFields: MissingProjectField[]
  blockingReasons: string[]
  canStartRab: boolean
  nextAction: string
}

export type ProjectRabReadinessResult = {
  allowed: boolean
  reason: ProjectRabReadinessReason | null
  completeness: ProjectCompletenessResult
}

const CORE_FIELDS: MissingProjectField[] = [
  { key: 'nama_proyek', label: 'Nama proyek', scope: 'core' },
  { key: 'jenis_pekerjaan', label: 'Jenis pekerjaan', scope: 'core' },
  { key: 'kategori_pekerjaan', label: 'Kategori pekerjaan', scope: 'core' },
  { key: 'tahun_anggaran', label: 'Tahun anggaran', scope: 'core' },
  { key: 'sumber_dana', label: 'Sumber dana', scope: 'core' },
  { key: 'dinas', label: 'Dinas/SKPD', scope: 'core' },
  { key: 'perusahaan_id', label: 'Perusahaan', scope: 'core' },
  { key: 'lokasi_kecamatan', label: 'Kecamatan/Lokasi', scope: 'core' },
  { key: 'nama_ppk', label: 'Nama PPK', scope: 'core' },
  { key: 'tanggal_mulai', label: 'Tanggal mulai', scope: 'core' },
  { key: 'tanggal_selesai', label: 'Tanggal selesai', scope: 'core' },
  { key: 'status_proyek', label: 'Status bendera', scope: 'core' },
  { key: 'tahap_progress', label: 'Tahap progress', scope: 'core' },
]

const COMMERCIAL_FIELDS: MissingProjectField[] = [
  { key: 'pagu_dana', label: 'Pagu dana', scope: 'commercial' },
  { key: 'hps', label: 'HPS', scope: 'commercial' },
  { key: 'nilai_penawaran', label: 'Nilai kontrak/penawaran', scope: 'commercial' },
]

const RAB_READY_PHASES = new Set([
  'Penyusunan Laporan Akhir & RAB',
  'Penyerahan & Revisi',
  'Selesai (BAST)',
])

function isBlank(value: unknown) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

function isMissing(project: ProjectCompletenessInput, field: MissingProjectField) {
  const value = project[field.key]
  if (typeof value === 'number') return !Number.isFinite(value) || value <= 0
  return isBlank(value)
}

export function evaluateProjectCompleteness(
  project: ProjectCompletenessInput,
  { includeCommercial = true }: { includeCommercial?: boolean } = {}
): ProjectCompletenessResult {
  const fields = includeCommercial ? [...CORE_FIELDS, ...COMMERCIAL_FIELDS] : CORE_FIELDS
  const missingFields = fields.filter((field) => isMissing(project, field))
  const blockingReasons: string[] = []
  const isPerencanaan = project.jenis_pekerjaan === 'Perencanaan'

  if (isPerencanaan && missingFields.length === 0 && !RAB_READY_PHASES.has(project.tahap_progress ?? '')) {
    blockingReasons.push('Progress belum masuk tahap penyusunan RAB/EE.')
  }

  const canStartRab = isPerencanaan && missingFields.length === 0 && blockingReasons.length === 0
  const status: ProjectCompletenessStatus = missingFields.length > 0
    ? 'incomplete'
    : blockingReasons.length > 0
      ? 'needs_review'
      : 'complete'

  return {
    status,
    missingFields,
    blockingReasons,
    canStartRab,
    nextAction: getNextProjectAction(status, canStartRab, isPerencanaan),
  }
}

function getNextProjectAction(status: ProjectCompletenessStatus, canStartRab: boolean, isPerencanaan: boolean) {
  if (status === 'incomplete') return 'Lengkapi data proyek wajib.'
  if (status === 'needs_review') return 'Review gate workflow sebelum lanjut.'
  if (canStartRab) return 'Siap susun RAB/EE.'
  return isPerencanaan ? 'Lanjutkan progress sampai tahap RAB/EE.' : 'Siap dipakai untuk monitoring.'
}

export function getProjectWorkflowGate(result: ProjectCompletenessResult): ProjectWorkflowGate {
  if (result.missingFields.length > 0) return 'Lengkapi data'
  if (result.canStartRab) return 'Siap RAB'
  return 'Siap kerja'
}

export function getMissingProjectFieldLabels(
  project: ProjectCompletenessInput,
  options?: { includeCommercial?: boolean }
) {
  return evaluateProjectCompleteness(project, options).missingFields.map((field) => field.label)
}

export function evaluateProjectRabReadiness(
  project: ProjectCompletenessInput,
  options: { includeCommercial?: boolean } = { includeCommercial: false }
): ProjectRabReadinessResult {
  const completeness = evaluateProjectCompleteness(project, options)

  if (project.jenis_pekerjaan !== 'Perencanaan') {
    return {
      allowed: false,
      reason: 'not-planning',
      completeness,
    }
  }

  if (completeness.missingFields.length > 0) {
    return {
      allowed: false,
      reason: 'missing-data',
      completeness,
    }
  }

  if (completeness.blockingReasons.length > 0) {
    return {
      allowed: false,
      reason: 'workflow-review',
      completeness,
    }
  }

  return {
    allowed: true,
    reason: null,
    completeness,
  }
}
