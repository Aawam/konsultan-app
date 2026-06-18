import { getPerusahaanDetailList } from '@/lib/actions/perusahaan'
import { getDaftarProyek, getDinasList } from '@/lib/actions/proyek'
import { PageError } from '@/components/ui/page-error'
import { DatabaseClient } from '@/components/database/database-client'

export default async function DatabasePage() {
  const [{ data: perusahaan, error }, { data: proyek }, { data: dinasList }] = await Promise.all([
    getPerusahaanDetailList(),
    getDaftarProyek(),
    getDinasList(),
  ])

  if (error) return <PageError error={error} />

  return (
    <DatabaseClient
      perusahaanList={perusahaan ?? []}
      proyekList={proyek ?? []}
      dinasList={dinasList ?? []}
    />
  )
}
