import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AuditTimeline } from '@/components/proyek/audit-timeline'
import { BadgeJenis, BadgeTahap, BadgeWorkflow } from '@/components/proyek/badges'
import { RabAccessDeniedDialog } from '@/components/proyek/rab-access-denied-dialog'
import { RabMakerClient } from '@/components/proyek/rab-maker-client'
import { RabStatusActions } from '@/components/proyek/rab-status-actions'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { PageError } from '@/components/ui/page-error'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'
import { getKategoriPekerjaanMasterList } from '@/lib/actions/ahsp'
import { getProyekById } from '@/lib/actions/proyek'
import {
  canAccessRabProject,
  getAvailableAhspForRab,
  getRabAuditTimelineByProyekId,
  getRabMakerSnapshotByProyekId,
} from '@/lib/actions/rab'
import { evaluateProjectRabReadiness, getProjectWorkflowGate, type ProjectRabReadinessResult } from '@/lib/project-completeness'
import { getRabMakerLockState } from '@/lib/rab-lock'
import type { ProyekDetail } from '@/lib/types/proyek'
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

function RabWorkflowBlocked({
  projectId,
  proyek,
  readiness,
  canManageProject,
}: {
  projectId: string
  proyek: ProyekDetail
  readiness: ProjectRabReadinessResult
  canManageProject: boolean
}) {
  const gate = getProjectWorkflowGate(readiness.completeness)

  return (
    <div className="pb-10">
      <div className="mb-5">
        <PageHeader
          eyebrow="Estimasi / RAB"
          title="RAB / Engineering Estimate"
          description={proyek.nama_proyek}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/proyek/rab">Daftar RAB</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/proyek/${projectId}`}>Detail Proyek</Link>
              </Button>
              {canManageProject && (
                <Button asChild>
                  <Link href={`/proyek/${projectId}/edit`}>Lengkapi Data</Link>
                </Button>
              )}
            </>
          }
        />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <BadgeJenis jenis={proyek.jenis_pekerjaan} />
          <BadgeTahap tahap={proyek.tahap_progress} />
          <BadgeWorkflow status={readiness.completeness.status} gate={gate} />
        </div>
        <h2 className="mt-4 max-w-4xl text-xl font-bold leading-tight text-foreground">
          RAB belum bisa dibuka untuk proyek ini.
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Selesaikan gate workflow terlebih dahulu agar item AHSP tidak masuk ke proyek yang datanya belum siap.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aksi Berikutnya</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{readiness.completeness.nextAction}</p>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gate Saat Ini</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{gate}</p>
          </div>
        </div>

        {readiness.completeness.missingFields.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data Kurang</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {readiness.completeness.missingFields.map((field) => (
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

        {readiness.completeness.blockingReasons.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Butuh Review</p>
            <div className="mt-2 space-y-1">
              {readiness.completeness.blockingReasons.map((reason) => (
                <p key={reason} className="text-sm font-semibold text-violet">
                  {reason}
                </p>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default async function RabProjectPage({ params }: Props) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  const canManageProject = isOwnerAdmin(profile)
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

  const readiness = evaluateProjectRabReadiness(proyekResult.data, { includeCommercial: false })
  if (!readiness.allowed) {
    return (
      <RabWorkflowBlocked
        projectId={id}
        proyek={proyekResult.data}
        readiness={readiness}
        canManageProject={canManageProject}
      />
    )
  }

  const [
    { data: snapshot, error: snapshotError },
    { data: ahspOptions, error: ahspError },
    { data: kategoriOptions, error: kategoriError },
    { data: timelineEvents, error: timelineError },
  ] = await Promise.all([
    getRabMakerSnapshotByProyekId(id),
    getAvailableAhspForRab(id, { limit: 25 }),
    getKategoriPekerjaanMasterList(),
    getRabAuditTimelineByProyekId(id),
  ])

  if (snapshotError) return <PageError error={snapshotError} />
  if (ahspError) return <PageError error={ahspError} />
  if (kategoriError) return <PageError error={kategoriError} />
  if (timelineError) return <PageError error={timelineError} />

  const proyek = proyekResult.data
  const rabLock = getRabMakerLockState(snapshot.maker?.status)
  const canEditRab = access && !rabLock.locked
  const canExportPdf = snapshot.maker?.status === 'validated' || snapshot.maker?.status === 'final'
  const latestExport = timelineEvents.find((event) => event.source === 'export')

  return (
    <div className="pb-10">
      <div className="mb-5">
        <PageHeader
          eyebrow="Estimasi / RAB"
          title="RAB / Engineering Estimate"
          description={proyek.nama_proyek}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/proyek/rab">Daftar RAB</Link>
              </Button>
              <Button asChild>
                <Link href={`/api/proyek/${id}/rab/export`}>Export XLSX</Link>
              </Button>
              {canExportPdf ? (
                <Button asChild variant="outline">
                  <Link href={`/api/proyek/${id}/rab/export/pdf`}>Export PDF</Link>
                </Button>
              ) : (
                <Button type="button" variant="outline" disabled>
                  Export PDF
                </Button>
              )}
              <RabStatusActions
                projectId={id}
                status={snapshot.maker?.status ?? null}
                canManage={canManageProject}
                hasMaker={Boolean(snapshot.maker)}
              />
            </>
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
          {rabLock.locked && (
            <span className="rounded-full border border-amber/30 bg-amber/10 px-2.5 py-1 text-xs font-semibold text-amber">
              Terkunci
            </span>
          )}
          {latestExport && (
            <span className="rounded-full border border-emerald/30 bg-emerald/10 px-2.5 py-1 text-xs font-semibold text-emerald">
              Export terakhir: {latestExport.title.replace('Export ', '')}
            </span>
          )}
        </div>
        <h2 className="mt-4 max-w-4xl text-xl font-bold leading-tight text-foreground">{proyek.nama_proyek}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {proyek.dinas} · {proyek.lokasi_kecamatan ?? '-'} · Tahun {proyek.tahun_anggaran}
        </p>
        {rabLock.message && (
          <p className="mt-3 rounded-lg border border-amber/25 bg-amber/10 px-3 py-2 text-sm font-semibold text-amber">
            {rabLock.message}
          </p>
        )}
      </section>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <RekapCard label="Item Snapshot" value={String(snapshot.items.length)} />
        <RekapCard label="Subtotal" value={formatRupiah(snapshot.maker?.subtotal ?? 0)} />
        <RekapCard label="PPN" value={`${snapshot.maker?.ppn_persen ?? 11}%`} />
        <RekapCard label="Nilai PPN" value={formatRupiah(snapshot.maker?.ppn_nilai ?? 0)} />
        <RekapCard label="Total Final" value={formatRupiah(snapshot.maker?.total_final ?? 0)} />
      </div>

      <RabMakerClient
        projectId={id}
        ahspOptions={ahspOptions.rows}
        ahspTotal={ahspOptions.total}
        kategoriOptions={kategoriOptions}
        snapshot={snapshot}
        canManage={canEditRab}
      />

      <div className="mt-5">
        <AuditTimeline events={timelineEvents} />
      </div>
    </div>
  )
}
