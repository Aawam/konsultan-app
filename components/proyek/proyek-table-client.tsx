'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { BadgeJenis, BadgeOverride } from '@/components/proyek/badges'
import { ProgressCell } from '@/components/proyek/progress-cell'
import { formatRupiah } from '@/lib/utils'
import { toast } from 'sonner'
import { ProyekDisplay, getNamaPerusahaan } from '@/lib/types/proyek'
import { ProyekSlideover } from '@/components/proyek/proyek-slideover'

type JenisFilter = 'Semua' | 'Perencanaan' | 'Pengawasan'
type ExportRow = {
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

const INLINE_YEAR_LIMIT = 3

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

export function ProyekTableClient({
  proyek,
  title,
}: {
  proyek: ProyekDisplay[]
  title?: string
}) {
  const [tahunFilter, setTahunFilter] = useState<number | 'semua'>('semua')
  const [jenisFilter, setJenisFilter] = useState<JenisFilter>('Semua')
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selesaiFilter, setSelesaiFilter] = useState(false)
  const [berjalanFilter, setBerjalanFilter] = useState(false)
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false)
  const yearDropdownRef = useRef<HTMLDivElement>(null)

  const tahunList = useMemo(() => {
    const set = new Set(proyek.map((p) => p.tahun_anggaran))
    return Array.from(set).sort((a, b) => b - a)
  }, [proyek])

  const inlineYears = tahunList.slice(0, INLINE_YEAR_LIMIT)
  const dropdownYears = tahunList.slice(INLINE_YEAR_LIMIT)
  const selectedYearIsInDropdown = typeof tahunFilter === 'number' && !inlineYears.includes(tahunFilter)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setYearDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = useMemo(() => {
    let list = proyek
    if (tahunFilter !== 'semua') list = list.filter((p) => p.tahun_anggaran === tahunFilter)
    if (berjalanFilter) list = list.filter((p) => p.tahap_progress != null && p.persentase_progress !== 100)
    if (selesaiFilter) list = list.filter((p) => p.persentase_progress === 100)
    if (jenisFilter !== 'Semua') list = list.filter((p) => p.jenis_pekerjaan === jenisFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.nama_proyek.toLowerCase().includes(q) ||
          p.dinas.toLowerCase().includes(q) ||
          getNamaPerusahaan(p.perusahaan).toLowerCase().includes(q)
      )
    }
    return list
  }, [proyek, tahunFilter, berjalanFilter, selesaiFilter, jenisFilter, search])

  const stats = useMemo(() => ({
    total:       proyek.length,
    berjalan:    proyek.filter((p) => p.tahap_progress && p.persentase_progress !== 100).length,
    selesai:     proyek.filter((p) => p.persentase_progress === 100).length,
    perencanaan: proyek.filter((p) => p.jenis_pekerjaan === 'Perencanaan').length,
    pengawasan:  proyek.filter((p) => p.jenis_pekerjaan === 'Pengawasan').length,
    nilaiTotal:  proyek.reduce((s, p) => s + (p.nilai_penawaran ?? 0), 0),
  }), [proyek])

  async function handleExport() {
    setExporting(true)
    const res = await fetch('/api/proyek/export')
    const json = await res.json() as { data?: ExportRow[]; error?: string }
    if (!res.ok || json.error || !json.data) {
      toast.error('Gagal mengekspor data. Coba lagi.')
      setExporting(false)
      return
    }
    const data = json.data

    const rows = (tahunFilter === 'semua' ? data : data.filter((p) => p.tahun_anggaran === tahunFilter))
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
          'Nilai Kontrak': p.nilai_penawaran ?? '',
          'Tanggal Mulai': p.tanggal_mulai ?? '',
          'Tanggal Selesai': p.tanggal_selesai ?? '',
          'Durasi (Hari)': p.durasi_hari ?? '',
          'Tahap Progress': p.tahap_progress ?? '',
          'Progress (%)': p.persentase_progress ?? 0,
          'Catatan': p.catatan ?? '',
          'Dibuat': p.created_at,
          'Diperbarui': p.updated_at,
        }
      })

    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Proyek')
    XLSX.writeFile(wb, tahunFilter === 'semua' ? 'proyek-semua.xlsx' : `proyek-${tahunFilter}.xlsx`)
    setExporting(false)
  }

  function toggleJenis(jenis: 'Perencanaan' | 'Pengawasan') {
    setBerjalanFilter(false)
    setSelesaiFilter(false)
    setJenisFilter((prev) => prev === jenis ? 'Semua' : jenis)
  }

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      {title && (
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monitoring</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Pantau status proyek, progres, nilai kontrak, dan PIC dari satu halaman yang mudah discan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {exporting ? 'Mengekspor…' : 'Export Excel'}
            </button>
            <Link
              href="/proyek/baru"
              className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
            >
              + Tambah Proyek
            </Link>
          </div>
        </div>
      )}

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_minmax(220px,1.45fr)]">
        <StatCard
          label="Sedang Berjalan"
          value={stats.berjalan}
          caption="Proyek aktif"
          colorClass="text-brand"
          onClick={() => { setSelesaiFilter(false); setJenisFilter('Semua'); setBerjalanFilter((prev) => !prev) }}
          active={berjalanFilter}
        />
        <StatCard
          label="Selesai"
          value={stats.selesai}
          caption="Arsip selesai"
          colorClass="text-emerald"
          onClick={() => { setBerjalanFilter(false); setSelesaiFilter((prev) => !prev) }}
          active={selesaiFilter}
        />
        <StatCard
          label="Perencanaan"
          value={stats.perencanaan}
          caption="Dokumen rencana"
          colorClass="text-violet"
          onClick={() => toggleJenis('Perencanaan')}
          active={jenisFilter === 'Perencanaan'}
        />
        <StatCard
          label="Pengawasan"
          value={stats.pengawasan}
          caption="Proyek lapangan"
          colorClass="text-teal"
          onClick={() => toggleJenis('Pengawasan')}
          active={jenisFilter === 'Pengawasan'}
        />
        <StatCard label="Total Proyek" value={stats.total} caption="Semua tahun" />
        <StatCard
          label="Total Kontrak"
          value={formatCompactRupiah(stats.nilaiTotal)}
          caption="Nilai kontrak tercatat"
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
                onClick={() => { setTahunFilter(tab.value); setYearDropdownOpen(false) }}
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
                      onClick={() => { setTahunFilter(y); setYearDropdownOpen(false) }}
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
            placeholder="Cari nama, dinas, perusahaan…"
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
          onValueChange={(value) => {
            setBerjalanFilter(false)
            setSelesaiFilter(false)
            setJenisFilter(value as JenisFilter)
          }}
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

        <span className="ml-auto text-sm text-muted-foreground shrink-0">
          {filtered.length} proyek
        </span>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: '34%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '11%' }} />
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
              <TableHead className="table-head px-4 py-3.5 text-right normal-case tracking-normal">Nilai Kontrak</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((p) => (
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
                  <TableCell className="px-4 py-4 text-sm font-mono text-right">
                    {p.nilai_penawaran ? (
                      <span className="text-foreground font-semibold">{formatRupiah(p.nilai_penawaran)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-16 text-sm">
                  Tidak ada proyek yang sesuai filter
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProyekSlideover id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
