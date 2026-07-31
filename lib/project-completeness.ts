export type ProjectCompletenessStatus = 'complete' | 'incomplete'
export type ProjectWorkflowGate = 'Lengkapi data' | 'Data lengkap'

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
  nextAction: string
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
  const status: ProjectCompletenessStatus = missingFields.length > 0
    ? 'incomplete'
    : 'complete'

  return {
    status,
    missingFields,
    blockingReasons: [],
    nextAction: status === 'incomplete'
      ? 'Lengkapi data proyek wajib.'
      : 'Data proyek lengkap. Lanjutkan monitoring pekerjaan.',
  }
}

export function getProjectWorkflowGate(result: ProjectCompletenessResult): ProjectWorkflowGate {
  if (result.missingFields.length > 0) return 'Lengkapi data'
  return 'Data lengkap'
}

export function getMissingProjectFieldLabels(
  project: ProjectCompletenessInput,
  options?: { includeCommercial?: boolean }
) {
  return evaluateProjectCompleteness(project, options).missingFields.map((field) => field.label)
}
