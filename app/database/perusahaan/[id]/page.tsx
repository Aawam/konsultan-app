import { notFound } from 'next/navigation'
import { BackButton } from '@/components/ui/back-button'
import { KvField } from '@/components/ui/kv-field'
import { SectionCard } from '@/components/ui/section-card'
import { BadgeJenis } from '@/components/proyek/badges'
import { formatRupiah } from '@/lib/utils'
import { getPerusahaanById, getProyekByPerusahaan } from '@/lib/actions/perusahaan'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'

type Props = { params: Promise<{ id: string }> }

export default async function DetailPerusahaanPage({ params }: Props) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) notFound()

  const [{ data: perusahaan }, { data: proyek }] = await Promise.all([
    getPerusahaanById(id),
    getProyekByPerusahaan(id),
  ])

  if (!perusahaan) notFound()

  const totalProyek = proyek?.length ?? 0
  const totalPerencanaan = proyek?.filter((item) => item.jenis_pekerjaan === 'Perencanaan').length ?? 0
  const totalPengawasan = proyek?.filter((item) => item.jenis_pekerjaan === 'Pengawasan').length ?? 0
  const totalKontrak = proyek?.reduce((sum, item) => sum + (item.nilai_penawaran ?? 0), 0) ?? 0

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-12">
      <BackButton href="/database" label="Kembali ke Database" />

      <div className="space-y-1">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Referensi</p>
        <h1 className="text-2xl font-bold text-foreground">{perusahaan.nama_perusahaan}</h1>
        <p className="text-sm text-muted-foreground">
          {perusahaan.adalah_perusahaan_sendiri ? 'Perusahaan utama' : 'Perusahaan mitra / pendukung'}
        </p>
      </div>

      <SectionCard title="Ringkasan">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KvField label="Total Proyek" value={String(totalProyek)} mono accent />
          <KvField label="Perencanaan" value={String(totalPerencanaan)} mono />
          <KvField label="Pengawasan" value={String(totalPengawasan)} mono />
          <KvField label="Total Kontrak" value={totalKontrak ? formatRupiah(totalKontrak) : '—'} mono />
        </div>
      </SectionCard>

      <SectionCard title="Informasi Utama">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <KvField label="Direktur" value={perusahaan.nama_direktur} />
          <KvField label="Telepon" value={perusahaan.telepon} />
          <KvField label="Email" value={perusahaan.email} />
          <KvField label="Kota" value={perusahaan.kota} />
          <KvField label="Alamat" value={perusahaan.alamat} span2 />
        </div>
      </SectionCard>

      <SectionCard title="Proyek Terkait">
        <div className="space-y-3">
          {proyek && proyek.length > 0 ? proyek.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-background px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{item.nama_proyek}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.dinas} • {item.tahun_anggaran}
                  </p>
                </div>
                <BadgeJenis jenis={item.jenis_pekerjaan} />
              </div>
              <div className="mt-3 text-sm font-mono font-semibold text-foreground">
                {item.nilai_penawaran ? formatRupiah(item.nilai_penawaran) : '—'}
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              Belum ada proyek yang terhubung ke perusahaan ini.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
