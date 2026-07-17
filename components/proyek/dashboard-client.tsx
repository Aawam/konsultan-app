'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { ProyekDisplay, getNamaPerusahaan } from '@/lib/types/proyek'
import { BadgeJenis, BadgeTahap } from '@/components/proyek/badges'
import { formatRupiah } from '@/lib/utils'
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

function getCssColor(variable: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
}

const JENIS_TEXT: Record<string, string> = {
  Perencanaan: 'text-violet',
  Pengawasan:  'text-teal',
}

function JenisPieCard({
  filtered,
  jenisFilter,
  onToggle,
}: {
  filtered: ProyekDisplay[]
  jenisFilter: JenisFilter
  onToggle: (j: 'Perencanaan' | 'Pengawasan') => void
}) {
  const [fills, setFills] = useState({ Perencanaan: '', Pengawasan: '' })

  useEffect(() => {
    const update = () =>
      setFills({
        Perencanaan: getCssColor('--violet'),
        Pengawasan:  getCssColor('--teal'),
      })
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const data = useMemo(() => {
    return (['Perencanaan', 'Pengawasan'] as const).map((j) => {
      const proyek  = filtered.filter((p) => p.jenis_pekerjaan === j)
      const nilai   = proyek.reduce((s, p) => s + (p.nilai_penawaran ?? 0), 0)
      const count   = proyek.length
      return { name: j, nilai, count }
    })
  }, [filtered])

  const totalNilai = data.reduce((s, d) => s + d.nilai, 0)
  const totalCount = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="section-card">
      <div className="section-header"><p className="section-title">Komposisi Jenis</p></div>
      <div className="section-body flex flex-col items-center gap-4">
        <div className="flex justify-center">
          <PieChart width={160} height={160}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                cornerRadius={4}
                dataKey="nilai"
                isAnimationActive={false}
                onClick={(entry) => onToggle(entry.name as 'Perencanaan' | 'Pengawasan')}
                style={{ cursor: 'pointer' }}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={fills[entry.name as keyof typeof fills]}
                    opacity={jenisFilter === 'Semua' || jenisFilter === entry.name ? 1 : 0.3}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatRupiah(Number(value)), 'Nilai Kontrak']}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--border)' }}
              />
          </PieChart>
        </div>

        <div className="w-full space-y-2">
          {data.map((entry) => {
            const pctNilai = totalNilai ? Math.round((entry.nilai / totalNilai) * 100) : 0
            const pctCount = totalCount ? Math.round((entry.count / totalCount) * 100) : 0
            const active   = jenisFilter === entry.name
            const fill     = fills[entry.name as keyof typeof fills]
            return (
              <button
                key={entry.name}
                onClick={() => onToggle(entry.name as 'Perencanaan' | 'Pengawasan')}
                className={`w-full text-left rounded-lg px-3 py-2 transition-colors ${active ? 'bg-muted' : 'hover:bg-muted/50'}`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: fill }} />
                  <span className={`text-sm font-semibold ${JENIS_TEXT[entry.name]}`}>{entry.name}</span>
                  <span className="ml-auto text-[11px] font-mono text-muted-foreground">{entry.count} · {pctCount}%</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground pl-4 truncate">{formatRupiah(entry.nilai)} ({pctNilai}%)</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

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

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <MetricLinkCard label="Total Proyek" value={stats.total} color="text-foreground" sub="Sesuai filter" href={buildProjectListHref(filters)} />
        <MetricLinkCard label="Sedang Berjalan" value={stats.berjalan} color="text-brand" sub="Ada progress" href={buildProjectListHref(filters, { progress: 'berjalan' })} />
        <MetricLinkCard label="Selesai" value={stats.selesai} color="text-emerald" sub={`${pct(stats.selesai, stats.total)}% dari total`} href={buildProjectListHref(filters, { progress: 'selesai' })} />
        <MetricLinkCard label="Belum Mulai" value={stats.belumMulai} color="text-muted-foreground" sub="Belum ada tahap" href={buildProjectListHref(filters, { progress: 'belum_mulai' })} />
        <MetricLinkCard label="Perlu Update" value={stats.perluUpdate} color="text-amber" sub="Data penting kosong" href={buildProjectListHref(filters, { progress: 'perlu_update' })} />
        <StatCard label="Avg Progress"    value={`${stats.avgProgress}%`} color="text-violet" />
        {canViewCommercial && (
          <div className="stat-card col-span-2 sm:col-span-3 xl:col-span-6">
            <p className="stat-label">Total Kontrak</p>
            <p className="stat-value truncate text-amber">{formatRupiah(stats.nilaiTotal)}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Akumulasi nilai penawaran/kontrak yang tercatat</p>
          </div>
        )}
      </div>

      {/* ── Charts grid ── */}
      <div className="grid gap-4 xl:grid-cols-3">

        {/* Jenis komposisi — top-left */}
        {canViewCommercial && (
          <JenisPieCard filtered={filtered} jenisFilter={jenisFilter} onToggle={(jenis) => updateFilters({ jenis: jenisFilter === jenis ? 'Semua' : jenis })} />
        )}

        {/* Tahap breakdown */}
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

        {/* Top dinas */}
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

        {/* Nilai per tahun */}
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

        {/* Perusahaan */}
        <div className="section-card">
          <div className="section-header">
            <p className="section-title">Distribusi per Perusahaan</p>
          </div>
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

      {/* ── Recent projects ── */}
      <div className="section-card overflow-hidden">
        <div className="section-header flex items-center justify-between">
          <p className="section-title">Proyek Terbaru</p>
          <Link href="/proyek" className="text-xs text-brand hover:underline">Lihat semua →</Link>
        </div>
        <table className="w-full text-sm border-collapse">
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

    </div>
  )
}
