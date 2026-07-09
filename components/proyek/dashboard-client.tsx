'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { ProyekDisplay, getNamaPerusahaan } from '@/lib/types/proyek'
import { BadgeJenis, BadgeTahap } from '@/components/proyek/badges'
import { formatRupiah } from '@/lib/utils'
import { TabGroup } from '@/components/ui/tab-group'
import { StatCard, MiniBar } from '@/components/ui/stat-card'
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

function worklistHref(params: Record<string, string | number>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) search.set(key, String(value))
  return `/proyek?${search.toString()}`
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
    <Link href={href} className="stat-card transition-colors hover:border-brand/40 hover:bg-muted/30">
      <p className="stat-label">{label}</p>
      <p className={`text-2xl font-bold font-mono leading-tight ${color}`}>{value}</p>
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
  const [yearFilter, setYearFilter] = useState<YearFilter>('semua')
  const [jenisFilter, setJenisFilter] = useState<JenisFilter>('Semua')
  const [perusahaanFilter, setPerusahaanFilter] = useState<string>('Semua')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Semua')

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
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {canViewCommercial ? 'Owner Overview' : 'Project Overview'}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">Dashboard Proyek</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Ringkasan progress dan distribusi proyek untuk keputusan harian.
          </p>
        </div>
        <Link
          href="/proyek"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Buka Daftar Proyek
        </Link>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        {/* Year tabs */}
        <TabGroup
          className="overflow-x-auto shrink-0"
          tabs={[
            { label: 'Semua', value: 'semua' as const },
            ...years.map((y) => ({ label: String(y), value: y })),
          ]}
          value={yearFilter}
          onChange={(v) => setYearFilter(v)}
        />

        {/* Jenis tabs */}
        <TabGroup
          className="shrink-0"
          tabs={(['Semua', 'Perencanaan', 'Pengawasan'] as JenisFilter[]).map((j) => ({ label: j, value: j }))}
          value={jenisFilter}
          onChange={(v) => setJenisFilter(v as JenisFilter)}
        />

        {/* Perusahaan dropdown */}
        <select
          value={perusahaanFilter}
          onChange={(e) => setPerusahaanFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:border-brand shrink-0 max-w-[180px]"
        >
          {perusahaanList.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        {/* Status dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="text-xs px-3 py-1.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:border-brand shrink-0"
        >
          {(['Semua', 'Work', 'Borrowed', 'Get Borrowed'] as StatusFilter[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} proyek</span>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <MetricLinkCard label="Total Proyek" value={stats.total} color="text-foreground" sub="Sesuai filter" href="/proyek" />
        <MetricLinkCard label="Sedang Berjalan" value={stats.berjalan} color="text-brand" sub="Ada progress" href={worklistHref({ progress: 'berjalan' })} />
        <MetricLinkCard label="Selesai" value={stats.selesai} color="text-emerald" sub={`${pct(stats.selesai, stats.total)}% dari total`} href={worklistHref({ progress: 'selesai' })} />
        <MetricLinkCard label="Belum Mulai" value={stats.belumMulai} color="text-muted-foreground" sub="Belum ada tahap" href={worklistHref({ progress: 'belum_mulai' })} />
        <MetricLinkCard label="Perlu Update" value={stats.perluUpdate} color="text-amber" sub="Data penting kosong" href={worklistHref({ progress: 'perlu_update' })} />
        <StatCard label="Avg Progress"    value={`${stats.avgProgress}%`} color="text-violet" />
        {canViewCommercial && (
          <div className="stat-card col-span-2 sm:col-span-3 xl:col-span-6">
            <p className="stat-label">Total Kontrak</p>
            <p className="text-2xl font-bold font-mono leading-tight text-amber truncate">{formatRupiah(stats.nilaiTotal)}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Akumulasi nilai penawaran/kontrak yang tercatat</p>
          </div>
        )}
      </div>

      {/* ── Charts grid ── */}
      <div className="grid gap-4 xl:grid-cols-3">

        {/* Jenis komposisi — top-left */}
        {canViewCommercial && (
          <JenisPieCard filtered={filtered} jenisFilter={jenisFilter} onToggle={(j) => setJenisFilter((prev) => prev === j ? 'Semua' : j)} />
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
