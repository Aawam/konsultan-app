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
    <div className="max-w-3xl mx-auto pb-10">
      <BackButton href="/proyek" label="Kembali ke Daftar Proyek" />
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Tambah Proyek Baru</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Field bertanda * wajib diisi. Field lainnya opsional.</p>
      </div>
      <FormCreateProyek perusahaanList={ordered} dinasList={dinasList ?? []} />
    </div>
  )
}
