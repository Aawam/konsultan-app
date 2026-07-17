import type {
  ProjectFilters,
  ProjectJenisFilter,
  ProjectProgressFilter,
  ProjectStatusFilter,
  ProjectYearFilter,
} from '@/lib/proyek-analytics'

export type DashboardFilters = Pick<ProjectFilters, 'year' | 'jenis' | 'status' | 'perusahaan'>

const JENIS_FILTERS: readonly ProjectJenisFilter[] = ['Semua', 'Perencanaan', 'Pengawasan']
const STATUS_FILTERS: readonly ProjectStatusFilter[] = ['Semua', 'Work', 'Borrowed', 'Get Borrowed']

function isJenisFilter(value: string | null): value is ProjectJenisFilter {
  return value !== null && JENIS_FILTERS.includes(value as ProjectJenisFilter)
}

function isStatusFilter(value: string | null): value is ProjectStatusFilter {
  return value !== null && STATUS_FILTERS.includes(value as ProjectStatusFilter)
}

function readYear(value: string | null): ProjectYearFilter {
  const year = Number(value)
  return Number.isInteger(year) && year > 0 ? year : 'semua'
}

export function readDashboardFilters(searchParams: URLSearchParams): DashboardFilters {
  const perusahaan = searchParams.get('perusahaan')?.trim()

  return {
    year: readYear(searchParams.get('year')),
    jenis: isJenisFilter(searchParams.get('jenis')) ? searchParams.get('jenis') as ProjectJenisFilter : 'Semua',
    status: isStatusFilter(searchParams.get('status')) ? searchParams.get('status') as ProjectStatusFilter : 'Semua',
    perusahaan: perusahaan || 'Semua',
  }
}

export function buildProjectListHref(
  filters: DashboardFilters,
  patch: Partial<Pick<ProjectFilters, 'progress'>> = {}
) {
  const params = new URLSearchParams()
  const progress: ProjectProgressFilter = patch.progress ?? 'semua'

  if (filters.year !== 'semua') params.set('year', String(filters.year))
  if (filters.jenis !== 'Semua') params.set('jenis', filters.jenis)
  if (filters.status !== 'Semua') params.set('status', filters.status)
  if (filters.perusahaan !== 'Semua') params.set('perusahaan', filters.perusahaan)
  if (progress !== 'semua') params.set('progress', progress)

  const query = params.toString()
  return query ? `/proyek?${query}` : '/proyek'
}
