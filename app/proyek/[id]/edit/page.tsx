import { getDinasList, getProyekById, getPerusahaanList } from '@/lib/actions/proyek'
import { FormEditProyek } from '@/components/proyek/form-edit-proyek'
import { BackButton } from '@/components/ui/back-button'
import { notFound } from 'next/navigation'
import type { ProyekFormData } from '@/lib/types/proyek'

export default async function EditProyekPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [{ data: proyek }, { data: perusahaanList }, { data: dinasList }] = await Promise.all([
    getProyekById(id),
    getPerusahaanList(),
    getDinasList(),
  ])

  if (!proyek) notFound()

  const ordered = [...(perusahaanList ?? [])].sort((a, b) => {
    if (a.adalah_perusahaan_sendiri !== b.adalah_perusahaan_sendiri) {
      return a.adalah_perusahaan_sendiri ? -1 : 1
    }
    return a.nama_perusahaan.localeCompare(b.nama_perusahaan)
  })

  const initialData: ProyekFormData = {
    id: proyek.id,
    nama_proyek: proyek.nama_proyek,
    paket_pekerjaan_induk: proyek.paket_pekerjaan_induk ?? '',
    nomor_kontrak: proyek.nomor_kontrak ?? '',
    jenis_pekerjaan: proyek.jenis_pekerjaan as 'Perencanaan' | 'Pengawasan',
    kategori_pekerjaan: proyek.kategori_pekerjaan,
    tahun_anggaran: proyek.tahun_anggaran,
    sumber_dana: proyek.sumber_dana as 'APBD' | 'APBD-Perubahan',
    dinas: proyek.dinas,
    lokasi_kecamatan: proyek.lokasi_kecamatan ?? '',
    nama_ppk: proyek.nama_ppk ?? '',
    pagu_dana: String(proyek.pagu_dana ?? ''),
    hps: String(proyek.hps ?? ''),
    nilai_penawaran: String(proyek.nilai_penawaran ?? ''),
    perusahaan_id: proyek.perusahaan_id ?? '',
    tanggal_mulai: proyek.tanggal_mulai ?? '',
    tanggal_selesai: proyek.tanggal_selesai ?? '',
    durasi_hari: String(proyek.durasi_hari ?? ''),
    tahap_progress: proyek.tahap_progress ?? '',
    status_proyek: proyek.status_proyek ?? '',
    catatan: proyek.catatan ?? '',
  }

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {/* F1: BackButton was missing — present on /baru but absent here */}
      <BackButton href={`/proyek/${id}`} label="Kembali ke Detail Proyek" />
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Edit Proyek</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Field bertanda * wajib diisi. Field lainnya opsional.</p>
      </div>
      <FormEditProyek
        perusahaanList={ordered}
        dinasList={dinasList ?? []}
        initialData={initialData}
      />
    </div>
  )
}
