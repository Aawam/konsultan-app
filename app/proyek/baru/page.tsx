import { getDinasList, getPerusahaanList } from '@/lib/actions/proyek'
import { FormCreateProyek } from '@/components/proyek/form-create-proyek'
import { BackButton } from '@/components/ui/back-button'
import { PageError } from '@/components/ui/page-error'

export default async function TambahProyekPage() {
  const [{ data: perusahaan, error }, { data: dinasList }] = await Promise.all([
    getPerusahaanList(),
    getDinasList(),
  ])

  if (error) return <PageError error={error} />

  const ordered = [...(perusahaan ?? [])].sort((a, b) => {
    if (a.adalah_perusahaan_sendiri !== b.adalah_perusahaan_sendiri) {
      return a.adalah_perusahaan_sendiri ? -1 : 1
    }
    return a.nama_perusahaan.localeCompare(b.nama_perusahaan)
  })

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daftar Proyek</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">Tambah Proyek Baru</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Isi data berurutan. Nomor kontrak, HPS, dan tanggal bisa dikosongkan dulu jika belum tersedia.
          </p>
        </div>
        <BackButton href="/proyek" label="Kembali ke Daftar Proyek" />
      </div>
      <FormCreateProyek perusahaanList={ordered} dinasList={dinasList ?? []} />
    </div>
  )
}
