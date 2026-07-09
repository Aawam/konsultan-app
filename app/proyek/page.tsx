import {
  DEFAULT_PROYEK_LIST_PAGE_SIZE,
  PROYEK_LIST_PAGE_SIZES,
  getDaftarProyekPage,
  getProyekListFilterOptions,
  type ProyekListFilters,
} from '@/lib/actions/proyek'
import { ProyekTableClient } from '@/components/proyek/proyek-table-client'
import { PageError } from '@/components/ui/page-error'
import type { ProjectJenisFilter, ProjectProgressFilter, ProjectStatusFilter } from '@/lib/proyek-analytics'
import { Suspense } from 'react'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseFilters(params: Awaited<SearchParams>): ProyekListFilters {
  const pageSize = Number(first(params.pageSize))
  const year = first(params.year)
  const jenis = first(params.jenis)
  const status = first(params.status)
  const progress = first(params.progress)
  const perusahaanId = first(params.perusahaan)
  const parsedYear = Number(year)

  return {
    page: Number(first(params.page)) || 1,
    pageSize: PROYEK_LIST_PAGE_SIZES.includes(pageSize as (typeof PROYEK_LIST_PAGE_SIZES)[number])
      ? pageSize
      : DEFAULT_PROYEK_LIST_PAGE_SIZE,
    year: year && year !== 'semua' && Number.isFinite(parsedYear) ? parsedYear : 'semua',
    jenis: jenis === 'Perencanaan' || jenis === 'Pengawasan' ? jenis as ProjectJenisFilter : 'Semua',
    status: status === 'Work' || status === 'Borrowed' || status === 'Get Borrowed' ? status as ProjectStatusFilter : 'Semua',
    progress:
      progress === 'berjalan' ||
      progress === 'selesai' ||
      progress === 'belum_mulai' ||
      progress === 'perlu_update'
        ? progress as ProjectProgressFilter
        : 'semua',
    perusahaanId: perusahaanId && perusahaanId !== 'Semua' ? perusahaanId : 'Semua',
    search: first(params.q)?.trim() ?? '',
  }
}

export default async function DaftarProyekPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams)
  const [{ data: proyekPage, error }, { data: filterOptions, error: filterError }] = await Promise.all([
    getDaftarProyekPage(filters),
    getProyekListFilterOptions(),
  ])

  if (error || filterError) return <PageError error={error ?? filterError} />

  return (
    <div>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Memuat daftar proyek...</div>}>
        <ProyekTableClient
          proyek={proyekPage?.rows ?? []}
          pagination={{
            page: proyekPage?.page ?? 1,
            pageSize: proyekPage?.pageSize ?? DEFAULT_PROYEK_LIST_PAGE_SIZE,
            total: proyekPage?.total ?? 0,
            pageCount: proyekPage?.pageCount ?? 1,
          }}
          filters={filters}
          filterOptions={filterOptions ?? { years: [], perusahaanList: [] }}
          title="Daftar Proyek"
          canViewCommercial={canViewCommercial}
          canManageProjects={canViewCommercial}
        />
      </Suspense>
    </div>
  )
}
