'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { ProyekDisplay, getNamaPerusahaan } from '@/lib/types/proyek'
import { BadgeJenis, BadgeTahap } from '@/components/proyek/badges'
import { formatRupiah } from '@/lib/utils'
import { TabGroup } from '@/components/ui/tab-group'
import { StatCard, MiniBar } from '@/components/ui/stat-card'

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

// ── main ─────────────────────────────────────────────────────────────────────

export function DashboardClient({ proyek }: { proyek: ProyekDisplay[] }) {
  const [yearFilter, setYearFilter] = useState<YearFilter>('semua')
  const [jenisFilter, setJenisFilter] = useState<JenisFilter>('Semua')
  const [perusahaanFilter, setPerusahaanFilter] = useState<string>('Semua')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Semua')

  const years = useMemo(
    () => Array.from(new Set(proyek.map((p) => p.tahun_anggaran))).sort((a, b) => b - a),
    [proyek]
  )

  const perusahaanList = useMemo(() => {
    const names = Array.from(new Set(proyek.map((p) => getNamaPerusahaan(p.perusahaan)))).sort()
    return ['Semua', ...names]
  }, [proyek])

  const filtered = useMemo(() => {
    let list = proyek
    if (yearFilter !== 'semua') list = list.filter((p) => p.tahun_anggaran === yearFilter)
    if (jenisFilter !== 'Semua') list = list.filter((p) => p.jenis_pekerjaan === jenisFilter)
    if (perusahaanFilter !== 'Semua') list = list.filter((p) => getNamaPerusahaan(p.perusahaan) === perusahaanFilter)
    if (statusFilter !== 'Semua') list = list.filter((p) => p.status_proyek === statusFilter)
    return list
  }, [proyek, yearFilter, jenisFilter, perusahaanFilter, statusFilter])

  const stats = useMemo(() => {
    const total       = filtered.length
    const selesai     = filtered.filter((p) => p.persentase_progress === 100).length
    const berjalan    = filtered.filter((p) => (p.persentase_progress ?? 0) > 0 && p.persentase_progress !== 100).length
    const belumMulai  = filtered.filter((p) => !p.persentase_progress).length
    const nilaiTotal  = filtered.reduce((s, p) => s + (p.nilai_penawaran ?? 0), 0)
    const avgProgress = total ? Math.round(filtered.reduce((s, p) => s + (p.persentase_progress ?? 0), 0) / total) : 0
    return { total, selesai, berjalan, belumMulai, nilaiTotal, avgProgress }
  }, [filtered])

  // By tahap
  const tahapGroups = useMemo(() => {
    const m = new Map<string, number>()
    filtered.forEach((p) => {
      const key = p.tahap_progress ?? 'Belum mulai'
      m.set(key, (m.get(key) ?? 0) + 1)
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [filtered])

  // By dinas (top 8)
  const dinasGroups = useMemo(() => {
    const m = new Map<string, number>()
    filtered.forEach((p) => { m.set(p.dinas, (m.get(p.dinas) ?? 0) + 1) })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [filtered])

  // By perusahaan (top 6)
  const compGroups = useMemo(() => {
    const m = new Map<string, number>()
    filtered.forEach((p) => {
      const name = getNamaPerusahaan(p.perusahaan)
      m.set(name, (m.get(name) ?? 0) + 1)
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [filtered])

  // Recent 8
  const recent = useMemo(() => [...filtered].slice(0, 8), [filtered])

  return (
    <div className="space-y-5">

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Sedang Berjalan" value={stats.berjalan}   color="text-brand"   sub="Ada progress" />
        <StatCard label="Selesai"         value={stats.selesai}    color="text-emerald" sub={`${pct(stats.selesai, stats.total)}% dari total`} />
        <StatCard label="Belum Mulai"     value={stats.belumMulai} color="text-muted-foreground" />
        <StatCard label="Avg Progress"    value={`${stats.avgProgress}%`} color="text-violet" />
        <div className="stat-card col-span-1">
          <p className="stat-label">Total Kontrak</p>
          <p className="text-2xl font-bold font-mono leading-tight text-amber truncate">{formatRupiah(stats.nilaiTotal)}</p>
        </div>
      </div>

      {/* ── Charts grid ── */}
      <div className="grid grid-cols-3 grid-rows-2 gap-4">

        {/* Jenis komposisi — top-left */}
        <JenisPieCard filtered={filtered} jenisFilter={jenisFilter} onToggle={(j) => setJenisFilter((prev) => prev === j ? 'Semua' : j)} />

        {/* Tahap breakdown — middle column, spans 2 rows */}
        <div className="section-card row-span-2">
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

        {/* Top dinas — right column, spans 2 rows */}
        <div className="section-card row-span-2">
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

        {/* Perusahaan — bottom-left */}
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
                <td className="px-4 py-3 text-right font-mono text-xs font-semibold whitespace-nowrap">
                  {p.nilai_penawaran ? formatRupiah(p.nilai_penawaran) : <span className="text-muted-foreground">—</span>}
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
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
