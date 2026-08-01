import { getPerusahaanDetailList } from '@/lib/actions/perusahaan'
import { getDaftarProyek, getDinasList } from '@/lib/actions/proyek'
import { PageError } from '@/components/ui/page-error'
import { DatabaseClient } from '@/components/database/database-client'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserCacheScope } from '@/lib/query-cache'

export default async function DatabasePage() {
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) redirect('/proyek')
  const cacheScope = getUserCacheScope(profile)

  const [perusahaanResult, proyekResult, dinasResult] = await Promise.all([
    getPerusahaanDetailList(),
    getDaftarProyek(),
    getDinasList({ cacheScope }),
  ])

  const error = perusahaanResult.error ?? proyekResult.error ?? dinasResult.error

  if (error) return <PageError error={error} />

  return (
    <DatabaseClient
      perusahaanList={perusahaanResult.data ?? []}
      proyekList={proyekResult.data ?? []}
      dinasList={dinasResult.data ?? []}
    />
  )
}
