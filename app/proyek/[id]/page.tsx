import { getProyekById, getOverrideLogsByProyekId } from '@/lib/actions/proyek'
import { notFound } from 'next/navigation'
import { BackButton } from '@/components/ui/back-button'
import { KvField } from '@/components/ui/kv-field'
import { SectionCard } from '@/components/ui/section-card'
import { BadgeJenis, BadgeTahap, BadgeOverride } from '@/components/proyek/badges'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { TAHAP_BAR_COLOR } from '@/lib/constants/proyek'
import { TombolAksi } from '@/components/proyek/proyek-actions'

type Props = { params: Promise<{ id: string }> }

export default async function DetailProyekPage({ params }: Props) {
  const { id } = await params

  const [{ data: proyek }, { data: overrideLogs }] = await Promise.all([
    getProyekById(id),
    getOverrideLogsByProyekId(id),
  ])

  if (!proyek) notFound()

  const perusahaan = proyek.perusahaan as {
    nama_perusahaan: string
    adalah_perusahaan_sendiri: boolean
  } | null

  const persen    = proyek.persentase_progress ?? 0
  const isSelesai = persen === 100
  const barColor  = isSelesai
    ? 'bg-emerald'
    : TAHAP_BAR_COLOR[proyek.tahap_progress ?? ''] ?? 'bg-brand'

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <BackButton href="/proyek" label="Kembali ke Daftar Proyek" />

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <BadgeJenis jenis={proyek.jenis_pekerjaan} />
            <BadgeTahap tahap={proyek.tahap_progress} />
            {proyek.pernah_dioverride && <BadgeOverride />}
          </div>
          <h1 className="text-xl font-bold text-foreground leading-snug">
            {proyek.nama_proyek}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {proyek.paket_pekerjaan_induk}
          </p>
        </div>
        <TombolAksi id={id} />
      </div>

      {/* ── Progress bar ── */}
      <div className="section-card mb-5">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Progress keseluruhan</span>
            <span className={`text-sm font-mono font-bold ${isSelesai ? 'text-emerald' : 'text-brand'}`}>
              {persen}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${persen}%` }} />
          </div>
          {proyek.tahap_progress && (
            <p className="text-xs text-muted-foreground mt-2">{proyek.tahap_progress}</p>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="space-y-4">

        <SectionCard title="Identitas Proyek">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <KvField label="Jenis Pekerjaan"  value={proyek.jenis_pekerjaan} />
            <KvField label="Kategori"          value={proyek.kategori_pekerjaan} />
            <KvField label="Tahun Anggaran"    value={String(proyek.tahun_anggaran)} mono />
            <KvField label="Sumber Dana"       value={proyek.sumber_dana} />
            <KvField label="Status Bendera"    value={proyek.status_proyek} />
            <KvField label="Jalur Masuk"       value={proyek.jalur_masuk} />
            <KvField label="Perusahaan"
              value={perusahaan
                ? `${perusahaan.nama_perusahaan}${perusahaan.adalah_perusahaan_sendiri ? ' ⭐' : ''}`
                : undefined}
              span2 />
          </div>
        </SectionCard>

        <SectionCard title="Anggaran">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <KvField label="Pagu Dana"     value={formatRupiah(proyek.pagu_dana)} mono accent />
            <KvField label="HPS"           value={formatRupiah(proyek.hps)} mono />
            <KvField label="Nilai Kontrak" value={formatRupiah(proyek.nilai_penawaran)} mono />
          </div>
        </SectionCard>

        <SectionCard title="Pemberi Kerja">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <KvField label="Dinas / SKPD" value={proyek.dinas} span2 />
            <KvField label="Lokasi"        value={proyek.lokasi_kecamatan} />
            <KvField label="Nama PPK"      value={proyek.nama_ppk} />
          </div>
        </SectionCard>

        <SectionCard title="Pelaksanaan">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <KvField label="Tanggal Mulai"   value={formatTanggal(proyek.tanggal_mulai)} />
            <KvField label="Tanggal Selesai" value={formatTanggal(proyek.tanggal_selesai)} />
          </div>
        </SectionCard>

        {proyek.catatan && (
          <SectionCard title="Catatan">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {proyek.catatan}
            </p>
          </SectionCard>
        )}

        {(overrideLogs ?? []).length > 0 && (
          <SectionCard title="Riwayat Override">
            <div className="space-y-3">
              {(overrideLogs ?? []).map((log) => (
                <div key={log.id} className="flex gap-4 items-start border-l-2 border-amber/30 pl-4">
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{log.field_dioverride}</p>
                    <p className="text-xs text-muted-foreground">{log.alasan}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(log.dilakukan_pada).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        <SectionCard title="Metadata">
          <div className="grid grid-cols-2 gap-4">
            <KvField label="Dibuat pada"       value={new Date(proyek.created_at).toLocaleString('id-ID')} mono />
            <KvField label="Terakhir diupdate" value={new Date(proyek.updated_at).toLocaleString('id-ID')} mono />
          </div>
        </SectionCard>

      </div>
    </div>
  )
}
