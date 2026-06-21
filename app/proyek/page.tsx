import { getDaftarProyek } from '@/lib/actions/proyek'
import { ProyekTableClient } from '@/components/proyek/proyek-table-client'
import { PageError } from '@/components/ui/page-error'
import { Suspense } from 'react'

export default async function DaftarProyekPage() {
  const { data: proyek, error } = await getDaftarProyek()

  if (error) return <PageError error={error} />

  return (
    <div>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Memuat daftar proyek...</div>}>
        <ProyekTableClient
          proyek={proyek ?? []}
          title="Daftar Proyek"
        />
      </Suspense>
    </div>
  )
}
