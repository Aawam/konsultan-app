import { getNamaPerusahaan, type ProyekDisplay } from '@/lib/types/proyek'
import {
  evaluateProjectCompleteness,
  getMissingProjectFieldLabels,
  type ProjectCompletenessInput,
} from '@/lib/project-completeness'

export type ProjectYearFilter = number | 'semua'
export type ProjectJenisFilter = 'Semua' | 'Perencanaan' | 'Pengawasan'
export type ProjectStatusFilter = 'Semua' | 'Work' | 'Borrowed' | 'Get Borrowed'
export type ProjectProgressFilter = 'semua' | 'berjalan' | 'selesai' | 'belum_mulai' | 'perlu_update'

export type ProjectFilters = {
  year: ProjectYearFilter
  jenis: ProjectJenisFilter
  status: ProjectStatusFilter
  progress: ProjectProgressFilter
  perusahaan: string
  search: string
}

export const DEFAULT_PROJECT_FILTERS: ProjectFilters = {
  year: 'semua',
  jenis: 'Semua',
  status: 'Semua',
  progress: 'semua',
  perusahaan: 'Semua',
  search: '',
}

export function getProjectProgressState(project: ProyekDisplay): Exclude<ProjectProgressFilter, 'semua' | 'perlu_update'> {
  const progress = project.persentase_progress ?? 0
  if (progress === 100) return 'selesai'
  if (!project.tahap_progress && progress === 0) return 'belum_mulai'
  return 'berjalan'
}

export function getMissingProjectFields(
  project: ProyekDisplay,
  options: { includeCommercial?: boolean } = { includeCommercial: false }
) {
  return getMissingProjectFieldLabels(toCompletenessInput(project), options)
}

export function needsProjectUpdate(
  project: ProyekDisplay,
  options: { includeCommercial?: boolean } = { includeCommercial: false }
) {
  return evaluateProjectCompleteness(toCompletenessInput(project), options).missingFields.length > 0
}

export function filterProjects(projects: ProyekDisplay[], filters: Partial<ProjectFilters>) {
  const normalized = { ...DEFAULT_PROJECT_FILTERS, ...filters }
  const query = normalized.search.trim().toLowerCase()

  return projects.filter((project) => {
    if (normalized.year !== 'semua' && project.tahun_anggaran !== normalized.year) return false
    if (normalized.jenis !== 'Semua' && project.jenis_pekerjaan !== normalized.jenis) return false
    if (normalized.status !== 'Semua' && project.status_proyek !== normalized.status) return false
    if (normalized.perusahaan !== 'Semua' && getNamaPerusahaan(project.perusahaan) !== normalized.perusahaan) return false

    if (normalized.progress === 'perlu_update' && !needsProjectUpdate(project, { includeCommercial: false })) return false
    if (
      normalized.progress !== 'semua' &&
      normalized.progress !== 'perlu_update' &&
      getProjectProgressState(project) !== normalized.progress
    ) {
      return false
    }

    if (!query) return true

    const searchable = [
      project.nama_proyek,
      project.dinas,
      project.lokasi_kecamatan,
      project.status_proyek,
      project.tahap_progress,
      getNamaPerusahaan(project.perusahaan),
    ]

    return searchable.some((value) => value?.toLowerCase().includes(query))
  })
}

export function getProjectStats(projects: ProyekDisplay[], options: { includeCommercial?: boolean } = {}) {
  const total = projects.length
  const selesai = projects.filter((project) => getProjectProgressState(project) === 'selesai').length
  const belumMulai = projects.filter((project) => getProjectProgressState(project) === 'belum_mulai').length
  const berjalan = projects.filter((project) => getProjectProgressState(project) === 'berjalan').length
  const perluUpdate = projects.filter((project) => needsProjectUpdate(project, options)).length
  const override = projects.filter((project) => project.pernah_dioverride).length
  const perencanaan = projects.filter((project) => project.jenis_pekerjaan === 'Perencanaan').length
  const pengawasan = projects.filter((project) => project.jenis_pekerjaan === 'Pengawasan').length
  const nilaiTotal = projects.reduce((sum, project) => sum + (project.nilai_penawaran ?? 0), 0)
  const avgProgress = total
    ? Math.round(projects.reduce((sum, project) => sum + (project.persentase_progress ?? 0), 0) / total)
    : 0

  return {
    total,
    berjalan,
    selesai,
    belumMulai,
    perluUpdate,
    override,
    perencanaan,
    pengawasan,
    nilaiTotal,
    avgProgress,
  }
}

function toCompletenessInput(project: ProyekDisplay): ProjectCompletenessInput {
  return {
    nama_proyek: project.nama_proyek,
    jenis_pekerjaan: project.jenis_pekerjaan,
    kategori_pekerjaan: project.kategori_pekerjaan,
    tahun_anggaran: project.tahun_anggaran,
    sumber_dana: project.sumber_dana,
    dinas: project.dinas,
    lokasi_kecamatan: project.lokasi_kecamatan,
    nama_ppk: project.nama_ppk,
    perusahaan_id: project.perusahaan_id,
    tanggal_mulai: project.tanggal_mulai,
    tanggal_selesai: project.tanggal_selesai,
    status_proyek: project.status_proyek,
    tahap_progress: project.tahap_progress,
    persentase_progress: project.persentase_progress,
    pagu_dana: project.pagu_dana,
    hps: project.hps,
    nilai_penawaran: project.nilai_penawaran,
  }
}

export function groupProjectsByCount(
  projects: ProyekDisplay[],
  getKey: (project: ProyekDisplay) => string,
  limit?: number
) {
  const groups = new Map<string, number>()

  for (const project of projects) {
    const key = getKey(project).trim() || '-'
    groups.set(key, (groups.get(key) ?? 0) + 1)
  }

  const sorted = [...groups.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
}

export function groupProjectsByValue(
  projects: ProyekDisplay[],
  getKey: (project: ProyekDisplay) => string,
  limit?: number
) {
  const groups = new Map<string, { count: number; value: number }>()

  for (const project of projects) {
    const key = getKey(project).trim() || '-'
    const current = groups.get(key) ?? { count: 0, value: 0 }
    groups.set(key, {
      count: current.count + 1,
      value: current.value + (project.nilai_penawaran ?? 0),
    })
  }

  const sorted = [...groups.entries()].sort((a, b) => b[1].value - a[1].value || b[1].count - a[1].count)
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
}

export function getProjectYears(projects: ProyekDisplay[]) {
  return [...new Set(projects.map((project) => project.tahun_anggaran))].sort((a, b) => b - a)
}

export function getProjectCompanyNames(projects: ProyekDisplay[]) {
  return [...new Set(projects.map((project) => getNamaPerusahaan(project.perusahaan)).filter((name) => name !== '-'))]
    .sort((a, b) => a.localeCompare(b))
}
