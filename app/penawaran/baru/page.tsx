import { getPerusahaanList, getPersonilList, getPengalamanPerusahaan } from '@/lib/actions/proyek'
import { FormPenawaran } from '@/components/penawaran/form-penawaran'


export default async function PenawaranBaruPage() {
  const [
    { data: perusahaanList },
    { data: personilList },
    { data: pengalamanList },
  ] = await Promise.all([
    getPerusahaanList(),
    getPersonilList(),
    getPengalamanPerusahaan(),
  ])

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Buat Dokumen Penawaran</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Data akan otomatis tersimpan ke database proyek
        </p>
      </div>

      <FormPenawaran
        perusahaanList={perusahaanList ?? []}
        pengalamanList={pengalamanList ?? []}
        personilList={personilList ?? []}
        />
    </div>
  )
}