import { getProyekFormReferences } from '@/lib/actions/proyek'
import { FormCreateProyek } from '@/components/proyek/form-create-proyek'
import { BackButton } from '@/components/ui/back-button'
import { PageError } from '@/components/ui/page-error'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'
import { notFound } from 'next/navigation'

export default async function TambahProyekPage() {
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) notFound()

  const { data, error } = await getProyekFormReferences()

  if (error) return <PageError error={error} />

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daftar Proyek</p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-foreground lg:text-2xl">Tambah Proyek Baru</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Isi data berurutan. Nomor kontrak, HPS, dan tanggal bisa dikosongkan dulu jika belum tersedia.
          </p>
        </div>
        <BackButton href="/proyek" label="Kembali ke Daftar Proyek" />
      </div>
      <FormCreateProyek perusahaanList={data.perusahaanList} dinasList={data.dinasList} />
    </div>
  )
}
