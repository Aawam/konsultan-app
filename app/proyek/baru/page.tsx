import { getProyekFormReferences } from '@/lib/actions/proyek'
import { FormCreateProyek } from '@/components/proyek/form-create-proyek'
import { BackButton } from '@/components/ui/back-button'
import { PageError } from '@/components/ui/page-error'
import { PageHeader } from '@/components/ui/page-header'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { getUserCacheScope } from '@/lib/query-cache'

export default async function TambahProyekPage() {
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) notFound()

  const { data, error } = await getProyekFormReferences({
    cacheScope: getUserCacheScope(profile),
  })

  if (error || !data) return <PageError error={error ?? new Error('Referensi proyek tidak tersedia.')} />

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <PageHeader
        eyebrow="Monitoring / Proyek Baru"
        title="Buat Proyek Baru"
        description="Mulai dari data inti. Nomor kontrak, HPS, dan tanggal dapat dilengkapi kemudian."
        actions={<BackButton href="/proyek" label="Kembali ke Daftar Proyek" />}
      />
      <div className="mt-6">
        <FormCreateProyek perusahaanList={data.perusahaanList} dinasList={data.dinasList} />
      </div>
    </div>
  )
}
