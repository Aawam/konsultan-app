import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BadgeJenis, BadgeTahap } from '@/components/proyek/badges'
import { RabAccessDeniedDialog } from '@/components/proyek/rab-access-denied-dialog'
import { RabMakerClient } from '@/components/proyek/rab-maker-client'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { PageError } from '@/components/ui/page-error'
import { getCurrentUserProfile } from '@/lib/auth'
import { getProyekById } from '@/lib/actions/proyek'
import { canAccessRabProject, getAvailableAhspForRab, getRabMakerSnapshotByProyekId } from '@/lib/actions/rab'
import { formatRupiah } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

function RekapCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  )
}

export default async function RabProjectPage({ params }: Props) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  const [access, proyekResult] = await Promise.all([
    canAccessRabProject(id, profile),
    getProyekById(id, { includeSensitive: false }),
  ])

  if (!proyekResult.data) notFound()

  if (proyekResult.data.jenis_pekerjaan !== 'Perencanaan') {
    return <RabAccessDeniedDialog reason="not-planning" />
  }

  if (!access) {
    return <RabAccessDeniedDialog reason="forbidden" />
  }

  const [{ data: snapshot, error: snapshotError }, { data: ahspOptions, error: ahspError }] = await Promise.all([
    getRabMakerSnapshotByProyekId(id),
    getAvailableAhspForRab(id),
  ])

  if (snapshotError) return <PageError error={snapshotError} />
  if (ahspError) return <PageError error={ahspError} />

  const proyek = proyekResult.data

  return (
    <div className="pb-10">
      <div className="mb-5">
        <PageHeader
          eyebrow="Estimasi / RAB"
          title="RAB / Engineering Estimate"
          description={proyek.nama_proyek}
          actions={
          <Button asChild variant="outline">
            <Link href="/proyek/rab">Daftar RAB</Link>
          </Button>
          }
        />
      </div>

      <section className="mb-5 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <BadgeJenis jenis={proyek.jenis_pekerjaan} />
          <BadgeTahap tahap={proyek.tahap_progress} />
          <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            Status RAB: {snapshot.maker?.status ?? 'belum dibuat'}
          </span>
        </div>
        <h2 className="mt-4 max-w-4xl text-xl font-bold leading-tight text-foreground">{proyek.nama_proyek}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {proyek.dinas} · {proyek.lokasi_kecamatan ?? '-'} · Tahun {proyek.tahun_anggaran}
        </p>
      </section>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <RekapCard label="Item Snapshot" value={String(snapshot.items.length)} />
        <RekapCard label="Subtotal" value={formatRupiah(snapshot.maker?.subtotal ?? 0)} />
        <RekapCard label="PPN" value={`${snapshot.maker?.ppn_persen ?? 11}%`} />
        <RekapCard label="Nilai PPN" value={formatRupiah(snapshot.maker?.ppn_nilai ?? 0)} />
        <RekapCard label="Total Final" value={formatRupiah(snapshot.maker?.total_final ?? 0)} />
      </div>

      <RabMakerClient projectId={id} ahspOptions={ahspOptions} snapshot={snapshot} canManage={access} />
    </div>
  )
}
