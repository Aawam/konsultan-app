import { getProyekById, getOverrideLogsByProyekId } from '@/lib/actions/proyek'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BadgeJenis, BadgeTahap, BadgeOverride, BadgeWorkflow } from '@/components/proyek/badges'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { TAHAP_BAR_COLOR } from '@/lib/constants/proyek'
import { TombolAksi } from '@/components/proyek/proyek-actions'
import { WorkflowTransitionAction } from '@/components/proyek/workflow-transition-action'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'
import { evaluateProjectCompleteness, getProjectWorkflowGate } from '@/lib/project-completeness'
import { evaluateProjectWorkflowTransition } from '@/lib/project-workflow'

type Props = { params: Promise<{ id: string }> }

function MetricCard({
  label,
  value,
  caption,
  accent,
}: {
  label: string
  value: string
  caption?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-xl font-bold leading-tight ${accent ?? 'text-foreground'}`}>{value}</p>
      {caption && <p className="mt-1.5 text-[11px] text-muted-foreground">{caption}</p>}
    </div>
  )
}

function DetailCard({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)]">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="min-w-0 break-words text-sm font-semibold text-foreground">{value || '-'}</p>
    </div>
  )
}

export default async function DetailProyekPage({ params }: Props) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  const canViewCommercial = isOwnerAdmin(profile)

  const [{ data: proyek }, { data: overrideLogs }] = await Promise.all([
    getProyekById(id, { includeSensitive: canViewCommercial }),
    getOverrideLogsByProyekId(id),
  ])

  if (!proyek) notFound()

  const perusahaan = proyek.perusahaan as {
    nama_perusahaan: string
    adalah_perusahaan_sendiri: boolean
  } | null

  const persen = proyek.persentase_progress ?? 0
  const isSelesai = persen === 100
  const barColor = isSelesai
    ? 'bg-emerald'
    : TAHAP_BAR_COLOR[proyek.tahap_progress ?? ''] ?? 'bg-brand'
  const namaPerusahaan = perusahaan
    ? `${perusahaan.nama_perusahaan}${perusahaan.adalah_perusahaan_sendiri ? ' ★' : ''}`
    : undefined
  const completeness = evaluateProjectCompleteness(proyek, { includeCommercial: false })
  const workflowGate = getProjectWorkflowGate(completeness)
  const rabTransition = evaluateProjectWorkflowTransition(proyek, 'mark_rab_ready', { includeCommercial: false })

  return (
    <div className="pb-10">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monitoring / Detail Proyek</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">Detail Proyek</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/proyek"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            ← Kembali
          </Link>
          {proyek.jenis_pekerjaan === 'Perencanaan' && (
            <Link
              href={`/proyek/${id}/rab`}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              RAB / EE
            </Link>
          )}
          {canViewCommercial && <TombolAksi id={id} />}
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card px-6 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <BadgeJenis jenis={proyek.jenis_pekerjaan} />
          <BadgeTahap tahap={proyek.tahap_progress} />
          <BadgeWorkflow status={completeness.status} gate={workflowGate} />
          {proyek.pernah_dioverride && <BadgeOverride />}
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_120px] lg:items-end">
          <div>
            <h2 className="max-w-3xl text-2xl font-bold leading-tight text-foreground">
              {proyek.nama_proyek}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Paket: {proyek.paket_pekerjaan_induk ?? '-'}
              {namaPerusahaan && <> · {namaPerusahaan}</>}
            </p>
            <div className="mt-5">
              <p className="text-xs font-medium text-muted-foreground">Progress keseluruhan</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${persen}%` }} />
              </div>
            </div>
          </div>
          <p className={`text-right text-3xl font-bold font-mono ${isSelesai ? 'text-emerald' : 'text-brand'}`}>
            {persen}%
          </p>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {canViewCommercial && (
          <>
            <MetricCard label="Pagu Dana" value={formatRupiah(proyek.pagu_dana)} caption={proyek.sumber_dana} />
            <MetricCard label="HPS" value={formatRupiah(proyek.hps)} caption="Harga Perkiraan Sendiri" />
            <MetricCard label="Nilai Kontrak" value={formatRupiah(proyek.nilai_penawaran ?? null)} caption="Efisiensi terhadap pagu" accent="text-teal" />
          </>
        )}
        <MetricCard label="Tahun Anggaran" value={String(proyek.tahun_anggaran)} caption={isSelesai ? 'Selesai' : 'Berjalan'} />
        <MetricCard label="Sumber Dana" value={proyek.sumber_dana} caption="Pemerintah daerah" accent="text-violet" />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ringkasan proyek</p>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DetailCard title="Kesiapan Workflow" className="xl:col-span-2">
          <InfoRow label="Gate Saat Ini" value={workflowGate} />
          <InfoRow label="Aksi Berikutnya" value={completeness.nextAction} />
          {canViewCommercial && rabTransition.allowed && (
            <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)]">
              <p className="text-xs font-bold text-muted-foreground">Transisi</p>
              <div>
                <WorkflowTransitionAction projectId={id} />
              </div>
            </div>
          )}
          {completeness.missingFields.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)]">
              <p className="text-xs font-bold text-muted-foreground">Data Kurang</p>
              <div className="flex flex-wrap gap-1.5">
                {completeness.missingFields.map((field) => (
                  <span
                    key={field.key}
                    className="rounded-full border border-amber/30 bg-amber/10 px-2 py-0.5 text-[11px] font-semibold text-amber"
                  >
                    {field.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          {completeness.blockingReasons.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)]">
              <p className="text-xs font-bold text-muted-foreground">Butuh Review</p>
              <div className="space-y-1">
                {completeness.blockingReasons.map((reason) => (
                  <p key={reason} className="text-sm font-semibold text-violet">
                    {reason}
                  </p>
                ))}
              </div>
            </div>
          )}
        </DetailCard>

        <DetailCard title="Identitas Proyek">
          <InfoRow label="Jenis Pekerjaan" value={proyek.jenis_pekerjaan} />
          <InfoRow label="Kategori" value={proyek.kategori_pekerjaan} />
          <InfoRow label="Nomor Kontrak" value={proyek.nomor_kontrak} />
          <InfoRow label="Perusahaan" value={namaPerusahaan} />
        </DetailCard>

        <DetailCard title="Pemberi Kerja">
          <InfoRow label="Dinas / SKPD" value={proyek.dinas} />
          <InfoRow label="Lokasi" value={proyek.lokasi_kecamatan} />
          <InfoRow label="Nama PPK" value={proyek.nama_ppk} />
          <InfoRow label="Kecamatan" value={proyek.lokasi_kecamatan} />
        </DetailCard>

        <DetailCard title="Pelaksanaan Kerja">
          <InfoRow label="Tanggal Mulai" value={formatTanggal(proyek.tanggal_mulai)} />
          <InfoRow label="Tanggal Selesai" value={formatTanggal(proyek.tanggal_selesai)} />
          <InfoRow label="Durasi Pelaksanaan" value={proyek.durasi_hari ? `${proyek.durasi_hari} Hari Kerja` : undefined} />
          <InfoRow label="Status Bendera" value={proyek.status_proyek} />
          <InfoRow label="Jalur Masuk" value={proyek.jalur_masuk} />
        </DetailCard>

        {canViewCommercial && (
          <DetailCard title="Catatan Kerja" className="min-h-52">
            <div className="min-h-36 rounded-xl border border-border p-4">
              <p className="text-sm font-medium leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {proyek.catatan || 'Belum ada catatan untuk proyek ini.'}
              </p>
            </div>
          </DetailCard>
        )}

        {(overrideLogs ?? []).length > 0 && (
          <DetailCard title="Riwayat Override" className="xl:col-span-2">
            {(overrideLogs ?? []).map((log) => (
              <div key={log.id} className="flex flex-col gap-2 border-l-2 border-amber/30 pl-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{log.field_dioverride}</p>
                  <p className="text-sm text-muted-foreground">{log.alasan}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(log.dilakukan_pada).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </DetailCard>
        )}
      </div>
    </div>
  )
}
