import { getDaftarProyek } from '@/lib/actions/proyek'
import { ProyekTableClient } from '@/components/proyek/proyek-table-client'
import { PageError } from '@/components/ui/page-error'

export default async function DaftarProyekPage() {
  const { data: proyek, error } = await getDaftarProyek()

  if (error) return <PageError error={error} />

  return (
    <div>
      <ProyekTableClient
        proyek={proyek ?? []}
        title="Daftar Proyek"
      />
    </div>
  )
}
