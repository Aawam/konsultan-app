'use client'

import { useCallback, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ProyekDisplay, getNamaPerusahaan } from '@/lib/types/proyek'
import { BadgeJenis, BadgeTahap } from '@/components/proyek/badges'
import { formatCompactRupiah, formatRupiah } from '@/lib/utils'
import { TabGroup } from '@/components/ui/tab-group'
import { StatCard, MiniBar } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { buildProjectListHref, readDashboardFilters, type DashboardFilters } from '@/lib/dashboard-filters'
import {
  filterProjects,
  getProjectCompanyNames,
  getProjectStats,
  getProjectYears,
  groupProjectsByCount,
  groupProjectsByValue,
} from '@/lib/proyek-analytics'

type YearFilter = number | 'semua'
type JenisFilter = 'Semua' | 'Perencanaan' | 'Pengawasan'
type StatusFilter = 'Semua' | 'Work' | 'Borrowed' | 'Get Borrowed'

function pct(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

function MetricLinkCard({
  label,
  value,
  sub,
  color,
  href,
}: {
  label: string
  value: string | number
  sub?: string
  color: string
  href: string
}) {
  return (
    <Link href={href} className="stat-card transition-colors hover:border-brand/60 hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </Link>
  )
}

function ValueBar({
  label,
  count,
  value,
  total,
}: {
  label: string
  count: number
  value: number
  total: number
}) {
  const width = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="truncate text-[12px] font-medium text-foreground">{label}</span>
        <span className="shrink-0 text-[11px] font-mono text-muted-foreground">{count} proyek</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-amber" style={{ width: `${width}%` }} />
      </div>
      <p className="mt-1 text-[11px] font-mono text-muted-foreground">{formatRupiah(value)}</p>
    </div>
  )
}

// ── main ─────────────────────────────────────────────────────────────────────

export function DashboardClient({
  proyek,
  canViewCommercial = true,
}: {
  proyek: ProyekDisplay[]
  canViewCommercial?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const filters = readDashboardFilters(searchParams)
  const yearFilter = filters.year as YearFilter
  const jenisFilter = filters.jenis as JenisFilter
  const perusahaanFilter = filters.perusahaan
  const statusFilter = filters.status as StatusFilter

  const updateFilters = useCallback((patch: Partial<DashboardFilters>) => {
    const next = { ...filters, ...patch }
    const params = new URLSearchParams(searchParams.toString())

    for (const key of ['year', 'jenis', 'status', 'perusahaan']) params.delete(key)
    if (next.year !== 'semua') params.set('year', String(next.year))
    if (next.jenis !== 'Semua') params.set('jenis', next.jenis)
    if (next.status !== 'Semua') params.set('status', next.status)
    if (next.perusahaan !== 'Semua') params.set('perusahaan', next.perusahaan)

    const query = params.toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }, [filters, pathname, router, searchParams])

  const years = useMemo(
    () => getProjectYears(proyek),
    [proyek]
  )

  const perusahaanList = useMemo(() => {
    const names = getProjectCompanyNames(proyek)
    return ['Semua', ...names]
  }, [proyek])

  const filtered = useMemo(() => {
    return filterProjects(proyek, {
      year: yearFilter,
      jenis: jenisFilter,
      status: statusFilter,
      perusahaan: perusahaanFilter,
      progress: 'semua',
      search: '',
    })
  }, [proyek, yearFilter, jenisFilter, perusahaanFilter, statusFilter])

  const stats = useMemo(() => getProjectStats(filtered), [filtered])

  // By tahap
  const tahapGroups = useMemo(
    () => groupProjectsByCount(filtered, (p) => p.tahap_progress ?? 'Belum mulai'),
    [filtered]
  )

  // By dinas (top 8)
  const dinasGroups = useMemo(
    () => groupProjectsByCount(filtered, (p) => p.dinas, 8),
    [filtered]
  )

  // By perusahaan (top 6)
  const compGroups = useMemo(
    () => groupProjectsByCount(filtered, (p) => getNamaPerusahaan(p.perusahaan), 6),
    [filtered]
  )

  const yearValueGroups = useMemo(
    () => groupProjectsByValue(filtered, (p) => String(p.tahun_anggaran)),
    [filtered]
  )

  // Recent 8
  const recent = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => (b.updated_at ?? b.created_at ?? '').localeCompare(a.updated_at ?? a.created_at ?? ''))
        .slice(0, 8),
    [filtered]
  )

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={canViewCommercial ? 'Owner Overview' : 'Project Overview'}
        title="Dashboard Proyek"
        description={`${filtered.length} proyek sesuai filter aktif${isPending ? ' · memuat…' : ''}.`}
        actions={(
          <Link
            href="/proyek"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Buka Daftar Proyek
          </Link>
        )}
      />

      <section className="space-y-3" aria-labelledby="dashboard-attention-title">
        <div>
          <h2 id="dashboard-attention-title" className="section-title">Perlu Perhatian</h2>
          <p className="mt-1 text-sm text-muted-foreground">Mulai dari pekerjaan yang perlu diperbarui, lalu lanjutkan pekerjaan aktif.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricLinkCard label="Butuh Review" value={stats.perluUpdate} color="text-amber" sub="Data penting belum lengkap" href={buildProjectListHref(filters, { progress: 'perlu_update' })} />
          <MetricLinkCard label="Sedang Berjalan" value={stats.berjalan} color="text-brand" sub="Ada progress aktif" href={buildProjectListHref(filters, { progress: 'berjalan' })} />
          <MetricLinkCard label="Selesai" value={stats.selesai} color="text-emerald" sub={`${pct(stats.selesai, stats.total)}% dari total`} href={buildProjectListHref(filters, { progress: 'selesai' })} />
        </div>
        <div className={`grid gap-3 ${canViewCommercial ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          <MetricLinkCard label="Total Proyek" value={stats.total} color="text-foreground" sub="Sesuai filter" href={buildProjectListHref(filters)} />
          <StatCard label="Rata-rata Progress" value={`${stats.avgProgress}%`} color="text-violet" />
          {canViewCommercial && (
            <div className="stat-card">
              <p className="stat-label">Total Kontrak</p>
              <p className="stat-value text-amber">{formatCompactRupiah(stats.nilaiTotal)}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Akumulasi nilai tercatat</p>
            </div>
          )}
        </div>
      </section>

      <div className="space-y-3 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <p className="filter-label shrink-0">Periode</p>
          <TabGroup
            className="max-w-full overflow-x-auto"
            tabs={[
              { label: 'Semua', value: 'semua' as const },
              ...years.map((year) => ({ label: String(year), value: year })),
            ]}
            value={yearFilter}
            onChange={(value) => updateFilters({ year: value })}
          />
          <span className="text-sm text-muted-foreground lg:ml-auto">{filtered.length} proyek</span>
        </div>

        <div className="flex flex-col gap-2 border-t border-border-subtle pt-3 lg:flex-row lg:items-center">
          <p className="filter-label shrink-0">Filter</p>
          <TabGroup
            className="shrink-0"
            tabs={(['Semua', 'Perencanaan', 'Pengawasan'] as JenisFilter[]).map((jenis) => ({ label: jenis, value: jenis }))}
            value={jenisFilter}
            onChange={(value) => updateFilters({ jenis: value as JenisFilter })}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:ml-auto lg:flex lg:items-center">
            <Select value={perusahaanFilter} onValueChange={(value) => updateFilters({ perusahaan: value })}>
              <SelectTrigger className="h-9 min-w-[190px] border-input bg-background text-sm">
                <SelectValue placeholder="Semua perusahaan" />
              </SelectTrigger>
              <SelectContent className="select-content">
                {perusahaanList.map((name) => (
                  <SelectItem key={name} value={name} className="select-item">{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => updateFilters({ status: value as StatusFilter })}>
              <SelectTrigger className="h-9 min-w-[160px] border-input bg-background text-sm">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent className="select-content">
                {(['Semua', 'Work', 'Borrowed', 'Get Borrowed'] as StatusFilter[]).map((status) => (
                  <SelectItem key={status} value={status} className="select-item">{status === 'Semua' ? 'Semua status' : status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Decision distributions ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="section-card">
          <div className="section-header"><p className="section-title">Distribusi Tahap</p></div>
          <div className="section-body">
            {tahapGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada data</p>
            ) : (
              tahapGroups.map(([tahap, count]) => (
                <MiniBar key={tahap} label={tahap} count={count} total={stats.total} colorClass="bg-brand" />
              ))
            )}
          </div>
        </div>

        {canViewCommercial && (
          <div className="section-card">
            <div className="section-header"><p className="section-title">Nilai per Tahun</p></div>
            <div className="section-body">
              {yearValueGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada data</p>
              ) : (
                yearValueGroups.map(([year, data]) => (
                  <ValueBar key={year} label={year} count={data.count} value={data.value} total={stats.nilaiTotal} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Recent projects ── */}
      <div className="section-card overflow-hidden">
        <div className="section-header flex items-center justify-between">
          <p className="section-title">Proyek Terbaru</p>
          <Link href="/proyek" className="text-xs text-brand hover:underline">Lihat semua →</Link>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead className="border-b border-border bg-muted/45">
            <tr>
              <th scope="col" className="table-head px-5 py-3 text-left normal-case tracking-normal">Proyek</th>
              <th scope="col" className="table-head px-4 py-3 text-left normal-case tracking-normal">Jenis</th>
              <th scope="col" className="table-head px-4 py-3 text-left normal-case tracking-normal">Tahap</th>
              <th scope="col" className="table-head px-4 py-3 text-left normal-case tracking-normal">Dinas</th>
              {canViewCommercial && <th scope="col" className="table-head px-4 py-3 text-right normal-case tracking-normal">Nilai</th>}
            </tr>
          </thead>
          <tbody>
            {recent.map((p, i) => (
              <tr
                key={p.id}
                className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
              >
                <td className="px-5 py-3 max-w-[260px]">
                  <Link href={`/proyek/${p.id}`} className="font-medium text-foreground hover:text-brand transition-colors block truncate">
                    {p.nama_proyek}
                  </Link>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {getNamaPerusahaan(p.perusahaan)}
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap"><BadgeJenis jenis={p.jenis_pekerjaan} /></td>
                <td className="px-4 py-3 whitespace-nowrap"><BadgeTahap tahap={p.tahap_progress} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[140px]">{p.dinas}</td>
                {canViewCommercial && (
                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold whitespace-nowrap">
                    {p.nilai_penawaran ? formatRupiah(p.nilai_penawaran) : <span className="text-muted-foreground">—</span>}
                  </td>
                )}
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={canViewCommercial ? 5 : 4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  Tidak ada proyek
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section className="space-y-3" aria-labelledby="dashboard-supporting-title">
        <div>
          <h2 id="dashboard-supporting-title" className="section-title">Distribusi Pendukung</h2>
          <p className="mt-1 text-sm text-muted-foreground">Konteks portofolio setelah prioritas kerja dan proyek terbaru.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="section-card">
            <div className="section-header"><p className="section-title">Top Dinas / SKPD</p></div>
            <div className="section-body">
              {dinasGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada data</p>
              ) : (
                dinasGroups.map(([dinas, count]) => (
                  <MiniBar key={dinas} label={dinas} count={count} total={stats.total} colorClass="bg-violet" />
                ))
              )}
            </div>
          </div>
          <div className="section-card">
            <div className="section-header"><p className="section-title">Distribusi per Perusahaan</p></div>
            <div className="section-body space-y-1">
              {compGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada data</p>
              ) : (
                compGroups.map(([name, count]) => (
                  <MiniBar key={name} label={name} count={count} total={stats.total} colorClass="bg-teal" />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
