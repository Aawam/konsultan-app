import { RabProjectListClient } from '@/components/proyek/rab-project-list-client'
import { PageError } from '@/components/ui/page-error'
import { getCurrentUserProfile } from '@/lib/auth'
import {
  DEFAULT_RAB_PROJECT_LIST_PAGE_SIZE,
  RAB_PROJECT_LIST_PAGE_SIZES,
  getRabProjectListPage,
  type RabProjectListFilters,
} from '@/lib/actions/rab'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseFilters(params: Awaited<SearchParams>): RabProjectListFilters {
  const pageSize = Number(first(params.pageSize))

  return {
    page: Number(first(params.page)) || 1,
    pageSize: RAB_PROJECT_LIST_PAGE_SIZES.includes(pageSize as (typeof RAB_PROJECT_LIST_PAGE_SIZES)[number])
      ? pageSize
      : DEFAULT_RAB_PROJECT_LIST_PAGE_SIZE,
    search: first(params.q)?.trim() ?? '',
  }
}

export default async function RabProjectListPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams)
  const { profile } = await getCurrentUserProfile()
  const { data: projectsPage, error } = await getRabProjectListPage(profile, filters)

  if (error) return <PageError error={error} />

  return (
    <div className="pb-10">
      <RabProjectListClient projectsPage={projectsPage} filters={filters} />
    </div>
  )
}
