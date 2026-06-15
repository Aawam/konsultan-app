import { getPerusahaanDetailList } from '@/lib/actions/perusahaan'
import { getDaftarProyek } from '@/lib/actions/proyek'
import { PageError } from '@/components/ui/page-error'
import { DatabaseClient } from '@/components/database/database-client'

export default async function DatabasePage() {
  const [{ data: perusahaan, error }, { data: proyek }] = await Promise.all([
    getPerusahaanDetailList(),
    getDaftarProyek(),
  ])

  if (error) return <PageError error={error} />

  return (
    <DatabaseClient
      perusahaanList={perusahaan ?? []}
      proyekList={proyek ?? []}
    />
  )
}
