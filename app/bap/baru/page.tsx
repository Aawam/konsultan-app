import { getDaftarProyek } from '@/lib/actions/proyek'
import { PageError } from '@/components/ui/page-error'
import { FormBAP } from '@/components/bap/form-bap'

export default async function BapBaruPage() {
  const { data: proyek, error } = await getDaftarProyek()
  if (error) return <PageError error={error} />

  // Only projects that have a contract value (relevant for BAP)
  const proyekBerkontrak = (proyek ?? []).filter((p) => p.nilai_penawaran)

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Buat Berita Acara Pembayaran</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Isi data BAP dalam 3 langkah lalu generate dokumen Word.
        </p>
      </div>
      <FormBAP proyekList={proyekBerkontrak} />
    </div>
  )
}
