'use client'

import { useState, useMemo, useRef, useEffect, useCallback, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { BadgeJenis, BadgeOverride } from '@/components/proyek/badges'
import { ProgressCell } from '@/components/proyek/progress-cell'
import {
  DEFAULT_PROJECT_FILTERS,
  getMissingProjectFields,
  getProjectStats,
  type ProjectProgressFilter,
  type ProjectStatusFilter,
} from '@/lib/proyek-analytics'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { toast } from 'sonner'
import { ProyekDisplay, getNamaPerusahaan } from '@/lib/types/proyek'
import { ProyekSlideover } from '@/components/proyek/proyek-slideover'
import type { ProyekListFilters } from '@/lib/actions/proyek'

type JenisFilter = 'Semua' | 'Perencanaan' | 'Pengawasan'
type ExportRow = {
  id: string
  nama_proyek: string
  paket_pekerjaan_induk: string | null
  jenis_pekerjaan: string
  kategori_pekerjaan: string
  tahun_anggaran: number
  sumber_dana: string
  dinas: string
  lokasi_kecamatan: string | null
  nama_ppk: string | null
  perusahaan: { nama_perusahaan: string } | { nama_perusahaan: string }[] | null
  status_proyek: string | null
  pagu_dana: number
  hps: number | null
  nilai_penawaran: number | null
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  durasi_hari: number | null
  tahap_progress: string | null
  persentase_progress: number | null
  catatan: string | null
  created_at: string | null
  updated_at: string | null
}

type ProyekTablePagination = {
  page: number
  pageSize: number
  total: number
  pageCount: number
}

type ProyekTableFilterOptions = {
  years: number[]
  perusahaanList: {
    id: string
    nama_perusahaan: string
  }[]
}

const INLINE_YEAR_LIMIT = 3

function escapeCsvValue(value: CsvValue) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function downloadCsv(rows: CsvRow[], filename: string) {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(',')),
  ].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function formatCompactRupiah(nilai: number) {
  if (nilai >= 1_000_000_000) {
    return `Rp ${(nilai / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`
  }
  if (nilai >= 1_000_000) {
    return `Rp ${(nilai / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
  }
  return formatRupiah(nilai)
}

function StatCard({
  label,
  value,
  caption,
  colorClass = 'text-foreground',
  onClick,
  active,
}: {
  label: string
  value: string | number
  caption: string
  colorClass?: string
  onClick?: () => void
  active?: boolean
}) {
  const content = (
    <>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold font-mono leading-none ${colorClass}`}>{value}</p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{caption}</p>
    </>
  )

  const className = [
    'rounded-xl border bg-card px-4 py-3.5 text-left transition-colors',
    active ? 'border-brand bg-brand/5' : 'border-border hover:border-muted-foreground/30',
  ].join(' ')

  if (onClick) {
    return (
      <button onClick={onClick} className={className}>
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}

function getProgressLabel(value: ProjectProgressFilter) {
  const labels: Record<ProjectProgressFilter, string> = {
    semua: 'Semua progress',
    berjalan: 'Sedang berjalan',
    selesai: 'Selesai',
    belum_mulai: 'Belum mulai',
    perlu_update: 'Perlu update',
  }
  return labels[value]
}

type SearchParamReader = {
  get(name: string): string | null
}

function getInitialYearFilter(searchParams: SearchParamReader): number | 'semua' {
  const year = searchParams.get('year')
  if (!year || year === 'semua') return 'semua'
  const parsed = Number(year)
  return Number.isFinite(parsed) ? parsed : 'semua'
}

function getInitialJenisFilter(searchParams: SearchParamReader): JenisFilter {
  const jenis = searchParams.get('jenis')
  return jenis === 'Perencanaan' || jenis === 'Pengawasan' || jenis === 'Semua' ? jenis : 'Semua'
}

function getInitialStatusFilter(searchParams: SearchParamReader): ProjectStatusFilter {
  const status = searchParams.get('status')
  return status === 'Work' || status === 'Borrowed' || status === 'Get Borrowed' || status === 'Semua'
    ? status
    : 'Semua'
}

function getInitialProgressFilter(searchParams: SearchParamReader): ProjectProgressFilter {
  const progress = searchParams.get('progress')
  return progress === 'berjalan' || progress === 'selesai' || progress === 'belum_mulai' || progress === 'perlu_update'
    ? progress
    : 'semua'
}

export function ProyekTableClient({
  proyek,
  pagination,
  filters,
  filterOptions,
  title,
  canViewCommercial = true,
  canManageProjects = true,
}: {
  proyek: ProyekDisplay[]
  pagination: ProyekTablePagination
  filters: ProyekListFilters
  filterOptions: ProyekTableFilterOptions
  title?: string
  canViewCommercial?: boolean
  canManageProjects?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [tahunFilter, setTahunFilter] = useState<number | 'semua'>(filters.year)
  const [jenisFilter, setJenisFilter] = useState<JenisFilter>(filters.jenis)
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>(filters.status)
  const [progressFilter, setProgressFilter] = useState<ProjectProgressFilter>(filters.progress)
  const [perusahaanFilter, setPerusahaanFilter] = useState(filters.perusahaanId)
  const [search, setSearch] = useState(filters.search)
  const [exporting, setExporting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false)
  const yearDropdownRef = useRef<HTMLDivElement>(null)

  const replaceQuery = useCallback((patch: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '' || value === 'Semua' || value === 'semua') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    }

    const query = params.toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }, [pathname, router, searchParams])

  const tahunList = filterOptions.years

  const inlineYears = tahunList.slice(0, INLINE_YEAR_LIMIT)
  const dropdownYears = tahunList.slice(INLINE_YEAR_LIMIT)
  const selectedYearIsInDropdown = typeof tahunFilter === 'number' && !inlineYears.includes(tahunFilter)
  const perusahaanById = useMemo(() => new Map(
    filterOptions.perusahaanList.map((perusahaan) => [perusahaan.id, perusahaan.nama_perusahaan])
  ), [filterOptions.perusahaanList])

  useEffect(() => {
    setTahunFilter(filters.year)
    setJenisFilter(filters.jenis)
    setStatusFilter(filters.status)
    setProgressFilter(filters.progress)
    setPerusahaanFilter(filters.perusahaanId)
    setSearch(filters.search)
  }, [filters])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setYearDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (search === filters.search) return
    const timeout = window.setTimeout(() => {
      replaceQuery({ q: search.trim(), page: null })
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [filters.search, replaceQuery, search])

  const stats = useMemo(() => getProjectStats(proyek), [proyek])
  const hasActiveFilters =
    tahunFilter !== DEFAULT_PROJECT_FILTERS.year ||
    jenisFilter !== DEFAULT_PROJECT_FILTERS.jenis ||
    statusFilter !== DEFAULT_PROJECT_FILTERS.status ||
    progressFilter !== DEFAULT_PROJECT_FILTERS.progress ||
    perusahaanFilter !== 'Semua' ||
    search.trim() !== ''

  function resetFilters() {
    setTahunFilter('semua')
    setJenisFilter('Semua')
    setStatusFilter('Semua')
    setProgressFilter('semua')
    setPerusahaanFilter('Semua')
    setSearch('')
    setYearDropdownOpen(false)
    replaceQuery({
      year: null,
      jenis: null,
      status: null,
      progress: null,
      perusahaan: null,
      q: null,
      page: null,
    })
  }

  async function handleExport() {
    if (!canViewCommercial) {
      toast.error('Export data komersial hanya untuk Owner/Admin.')
      return
    }
    setExporting(true)
    const res = await fetch('/api/proyek/export')
    const json = await res.json() as { data?: ExportRow[]; error?: string }
    if (!res.ok || json.error || !json.data) {
      toast.error('Gagal mengekspor data. Coba lagi.')
      setExporting(false)
      return
    }
    const data = json.data
    const visibleIds = new Set(proyek.map((p) => p.id))

    const rows = data
      .filter((p) => visibleIds.has(p.id))
      .map((p) => {
        const perusahaan = p.perusahaan
        const namaPerusahaan = Array.isArray(perusahaan)
          ? (perusahaan[0]?.nama_perusahaan ?? '')
          : ((perusahaan as { nama_perusahaan: string } | null)?.nama_perusahaan ?? '')
        return {
          'Nama Proyek': p.nama_proyek,
          'Paket Induk': p.paket_pekerjaan_induk,
          'Jenis': p.jenis_pekerjaan,
          'Kategori': p.kategori_pekerjaan,
          'Tahun Anggaran': p.tahun_anggaran,
          'Sumber Dana': p.sumber_dana,
          'Dinas': p.dinas,
          'Kecamatan': p.lokasi_kecamatan,
          'Nama PPK': p.nama_ppk,
          'Perusahaan': namaPerusahaan,
          'Status Bendera': p.status_proyek ?? '',
          'Pagu Dana': p.pagu_dana,
          'HPS': p.hps ?? '',
          ...(canViewCommercial ? { 'Nilai Kontrak': p.nilai_penawaran ?? '' } : {}),
          'Tanggal Mulai': p.tanggal_mulai ?? '',
          'Tanggal Selesai': p.tanggal_selesai ?? '',
          'Durasi (Hari)': p.durasi_hari ?? '',
          'Tahap Progress': p.tahap_progress ?? '',
          'Progress (%)': p.persentase_progress ?? 0,
          ...(canViewCommercial ? { 'Catatan': p.catatan ?? '' } : {}),
          'Dibuat': p.created_at,
          'Diperbarui': p.updated_at,
        }
      })

    downloadCsv(rows, tahunFilter === 'semua' ? 'proyek-semua.csv' : `proyek-${tahunFilter}.csv`)
    setExporting(false)
  }

  function toggleJenis(jenis: 'Perencanaan' | 'Pengawasan') {
    const next = jenisFilter === jenis ? 'Semua' : jenis
    setProgressFilter('semua')
    setJenisFilter(next)
    replaceQuery({ jenis: next, progress: null, page: null })
  }

  function updateYear(value: number | 'semua') {
    setTahunFilter(value)
    setYearDropdownOpen(false)
    replaceQuery({ year: value, page: null })
  }

  function updateJenis(value: JenisFilter) {
    setProgressFilter('semua')
    setJenisFilter(value)
    replaceQuery({ jenis: value, progress: null, page: null })
  }

  function updateProgress(value: ProjectProgressFilter) {
    setProgressFilter(value)
    replaceQuery({ progress: value, page: null })
  }

  function updateStatus(value: ProjectStatusFilter) {
    setStatusFilter(value)
    replaceQuery({ status: value, page: null })
  }

  function updatePerusahaan(value: string) {
    setPerusahaanFilter(value)
    replaceQuery({ perusahaan: value, page: null })
  }

  function updatePage(page: number) {
    replaceQuery({ page: Math.min(Math.max(page, 1), pagination.pageCount) })
  }

  function updatePageSize(pageSize: string) {
    replaceQuery({ pageSize, page: null })
  }

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      {title && (
        <PageHeader
          eyebrow="Monitoring"
          title={title}
          description="Pantau status proyek, progres, dan PIC dari satu halaman yang mudah discan."
          actions={
            <>
            {canViewCommercial && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                {exporting ? 'Mengekspor…' : 'Export CSV'}
              </button>
            )}
            {canManageProjects && (
              <Link
                href="/proyek/baru"
                className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
              >
                + Tambah Proyek
              </Link>
            )}
            </>
          }
        />
      )}

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_minmax(220px,1.45fr)]">
        <StatCard
          label="Sedang Berjalan"
          value={stats.berjalan}
          caption="Di halaman ini"
          colorClass="text-brand"
          onClick={() => {
            const next = progressFilter === 'berjalan' ? 'semua' : 'berjalan'
            setJenisFilter('Semua')
            setProgressFilter(next)
            replaceQuery({ jenis: null, progress: next, page: null })
          }}
          active={progressFilter === 'berjalan'}
        />
        <StatCard
          label="Selesai"
          value={stats.selesai}
          caption="Di halaman ini"
          colorClass="text-emerald"
          onClick={() => updateProgress(progressFilter === 'selesai' ? 'semua' : 'selesai')}
          active={progressFilter === 'selesai'}
        />
        <StatCard
          label="Perencanaan"
          value={stats.perencanaan}
          caption="Di halaman ini"
          colorClass="text-violet"
          onClick={() => toggleJenis('Perencanaan')}
          active={jenisFilter === 'Perencanaan'}
        />
        <StatCard
          label="Pengawasan"
          value={stats.pengawasan}
          caption="Di halaman ini"
          colorClass="text-teal"
          onClick={() => toggleJenis('Pengawasan')}
          active={jenisFilter === 'Pengawasan'}
        />
        <StatCard label="Total Proyek" value={pagination.total} caption="Sesuai filter" />
        <StatCard
          label="Total Kontrak"
          value={formatCompactRupiah(stats.nilaiTotal)}
          caption="Di halaman ini"
          colorClass="text-amber"
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-card p-3">

        {/* Year tabs: last 3 inline, older years in dropdown */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {[
            { label: 'Semua', value: 'semua' as const },
            ...inlineYears.map((t) => ({ label: String(t), value: t })),
          ].map((tab) => {
            const active = !selectedYearIsInDropdown && tahunFilter === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => updateYear(tab.value)}
                className={[
                  'h-9 rounded-full border px-4 text-sm font-semibold transition-colors',
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')}
              >
                {tab.label}
              </button>
            )
          })}
          {dropdownYears.length > 0 && (
            <div className="relative" ref={yearDropdownRef}>
              <button
                onClick={() => setYearDropdownOpen((o) => !o)}
                className={`flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
                  selectedYearIsInDropdown
                    ? 'bg-foreground text-background border-foreground font-semibold'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {selectedYearIsInDropdown ? String(tahunFilter) : 'Lainnya'}
                <svg
                  className={`w-3 h-3 transition-transform ${yearDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {yearDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[90px]">
                  {dropdownYears.map((y) => (
                    <button
                      key={y}
                      onClick={() => updateYear(y)}
                      className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-muted ${
                        tahunFilter === y ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama proyek, dinas, kecamatan…"
            className="h-10 w-full rounded-lg border border-border bg-muted pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-base leading-none"
            >
              ×
            </button>
          )}
        </div>

        <Select
          value={jenisFilter}
          onValueChange={(value) => updateJenis(value as JenisFilter)}
        >
          <SelectTrigger className="h-10 w-[180px] rounded-lg border-border bg-card px-4 text-sm font-semibold text-foreground">
            <SelectValue placeholder="Jenis pekerjaan" />
          </SelectTrigger>
          <SelectContent className="select-content">
            <SelectItem value="Semua" className="select-item">Jenis pekerjaan</SelectItem>
            <SelectItem value="Perencanaan" className="select-item">Perencanaan</SelectItem>
            <SelectItem value="Pengawasan" className="select-item">Pengawasan</SelectItem>
          </SelectContent>
        </Select>

        <Select value={progressFilter} onValueChange={(value) => updateProgress(value as ProjectProgressFilter)}>
          <SelectTrigger className="h-10 w-[170px] rounded-lg border-border bg-card px-4 text-sm font-semibold text-foreground">
            <SelectValue placeholder="Progress" />
          </SelectTrigger>
          <SelectContent className="select-content">
            {(['semua', 'berjalan', 'selesai', 'belum_mulai', 'perlu_update'] as ProjectProgressFilter[]).map((value) => (
              <SelectItem key={value} value={value} className="select-item">
                {getProgressLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value) => updateStatus(value as ProjectStatusFilter)}>
          <SelectTrigger className="h-10 w-[165px] rounded-lg border-border bg-card px-4 text-sm font-semibold text-foreground">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="select-content">
            <SelectItem value="Semua" className="select-item">Semua status</SelectItem>
            <SelectItem value="Work" className="select-item">Work</SelectItem>
            <SelectItem value="Borrowed" className="select-item">Borrowed</SelectItem>
            <SelectItem value="Get Borrowed" className="select-item">Get Borrowed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={perusahaanFilter} onValueChange={updatePerusahaan}>
          <SelectTrigger className="h-10 w-[210px] rounded-lg border-border bg-card px-4 text-sm font-semibold text-foreground">
            <SelectValue placeholder="Perusahaan" />
          </SelectTrigger>
          <SelectContent className="select-content">
            <SelectItem value="Semua" className="select-item">Semua perusahaan</SelectItem>
            {filterOptions.perusahaanList.map((perusahaan) => (
              <SelectItem key={perusahaan.id} value={perusahaan.id} className="select-item">
                {perusahaan.nama_perusahaan}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Reset
          </button>
        )}

        <span className="ml-auto text-sm text-muted-foreground shrink-0">
          {pagination.total} proyek{isPending ? ' · memuat...' : ''}
        </span>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Filter aktif:</span>
          {tahunFilter !== 'semua' && <span className="rounded-full bg-muted px-2.5 py-1">Tahun {tahunFilter}</span>}
          {jenisFilter !== 'Semua' && <span className="rounded-full bg-muted px-2.5 py-1">{jenisFilter}</span>}
          {progressFilter !== 'semua' && <span className="rounded-full bg-muted px-2.5 py-1">{getProgressLabel(progressFilter)}</span>}
          {statusFilter !== 'Semua' && <span className="rounded-full bg-muted px-2.5 py-1">{statusFilter}</span>}
          {perusahaanFilter !== 'Semua' && <span className="rounded-full bg-muted px-2.5 py-1">{perusahaanById.get(perusahaanFilter) ?? 'Perusahaan'}</span>}
          {search.trim() && <span className="rounded-full bg-muted px-2.5 py-1">Cari: {search}</span>}
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: '34%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '7%' }} />
            {canViewCommercial && <col style={{ width: '11%' }} />}
            <col style={{ width: '13%' }} />
            <col style={{ width: '11%' }} />
          </colgroup>
          <TableHeader>
            <TableRow className="border-border bg-card hover:bg-transparent">
              <TableHead className="table-head px-4 py-3.5 normal-case tracking-normal">Nama Proyek</TableHead>
              <TableHead className="table-head px-4 py-3.5 normal-case tracking-normal">Perusahaan</TableHead>
              <TableHead className="table-head px-4 py-3.5 normal-case tracking-normal">Jenis</TableHead>
              <TableHead className="table-head px-4 py-3.5 normal-case tracking-normal">Tahun</TableHead>
              <TableHead className="table-head px-4 py-3.5 normal-case tracking-normal">Kecamatan</TableHead>
              <TableHead className="table-head px-4 py-3.5 normal-case tracking-normal">Progress</TableHead>
              {canViewCommercial && (
                <TableHead className="table-head px-4 py-3.5 text-right normal-case tracking-normal">Nilai Kontrak</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {proyek.length > 0 ? (
              proyek.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer border-border transition-colors hover:bg-brand/5"
                  onClick={() => setSelectedId(p.id)}
                >
                  <TableCell className="px-4 py-4 whitespace-normal">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(event) => { event.stopPropagation(); setSelectedId(p.id) }}
                        className="block text-left text-sm font-semibold leading-tight text-foreground transition-colors hover:text-brand"
                      >
                        {p.nama_proyek}
                      </button>
                      {p.pernah_dioverride && <BadgeOverride />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.dinas}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        Update: {formatTanggal(p.updated_at ?? p.created_at ?? null)}
                      </span>
                      {getMissingProjectFields(p).slice(0, 2).map((field) => (
                        <span key={field} className="rounded-full border border-amber/30 bg-amber/10 px-2 py-0.5 text-[11px] font-medium text-amber">
                          Butuh {field}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm leading-tight text-muted-foreground whitespace-normal">
                    {getNamaPerusahaan(p.perusahaan)}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <BadgeJenis jenis={p.jenis_pekerjaan} />
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-muted-foreground font-mono">
                    {p.tahun_anggaran}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-muted-foreground whitespace-normal">
                    {p.lokasi_kecamatan ?? '—'}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <ProgressCell
                      tahap={p.tahap_progress ?? null}
                      persen={p.persentase_progress ?? null}
                    />
                  </TableCell>
                  {canViewCommercial && (
                    <TableCell className="px-4 py-4 text-sm font-mono text-right">
                      {p.nilai_penawaran ? (
                        <span className="text-foreground font-semibold">{formatRupiah(p.nilai_penawaran)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={canViewCommercial ? 7 : 6} className="text-center text-muted-foreground py-16 text-sm">
                  <div className="space-y-3">
                    <p>Tidak ada proyek yang sesuai filter</p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        Reset filter
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
        <div className="text-muted-foreground">
          Halaman <span className="font-semibold text-foreground">{pagination.page}</span> dari{' '}
          <span className="font-semibold text-foreground">{pagination.pageCount}</span>
          {' · '}
          {proyek.length} ditampilkan dari {pagination.total} proyek
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(pagination.pageSize)} onValueChange={updatePageSize}>
            <SelectTrigger className="h-9 w-[130px] rounded-lg border-border bg-card px-3 text-sm font-semibold text-foreground">
              <SelectValue placeholder="Per halaman" />
            </SelectTrigger>
            <SelectContent className="select-content">
              {['10', '25', '50', '100'].map((size) => (
                <SelectItem key={size} value={size} className="select-item">
                  {size} / halaman
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => updatePage(pagination.page - 1)}
            disabled={pagination.page <= 1 || isPending}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            onClick={() => updatePage(pagination.page + 1)}
            disabled={pagination.page >= pagination.pageCount || isPending}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      </div>

      <ProyekSlideover id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
