import { getDinasList, getProyekById, getPerusahaanList } from '@/lib/actions/proyek'
import { FormEditProyek } from '@/components/proyek/form-edit-proyek'
import { notFound } from 'next/navigation'
import type { ProyekFormData } from '@/lib/types/proyek'
import Link from 'next/link'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'

export default async function EditProyekPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) notFound()

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
    <div className="mx-auto max-w-7xl pb-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daftar Proyek</p>
          <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-foreground">Edit Proyek</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Data ditampilkan read-only. Ubah section tertentu melalui sheet kanan.
          </p>
        </div>
        <Link
          href={`/proyek/${id}`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
        >
          ← Kembali ke Detail Proyek
        </Link>
      </div>
      <FormEditProyek
        perusahaanList={ordered}
        dinasList={dinasList ?? []}
        initialData={initialData}
        metadata={{
          createdAt: proyek.created_at,
          updatedAt: proyek.updated_at,
        }}
      />
    </div>
  )
}
