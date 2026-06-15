'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import Link from 'next/link'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { BadgeJenis, BadgeOverride } from '@/components/proyek/badges'
import { ProgressCell } from '@/components/proyek/progress-cell'
import { formatRupiah } from '@/lib/utils'
import { toast } from 'sonner'
import { ProyekDisplay, getNamaPerusahaan } from '@/lib/types/proyek'
import { ProyekSlideover } from '@/components/proyek/proyek-slideover'
import { TabGroup } from '@/components/ui/tab-group'

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

function StripCell({
  children,
  onClick,
  active,
  activeClass = 'bg-muted/40',
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  activeClass?: string
  className?: string
}) {
  const base = 'flex-1 min-w-0 px-4 py-4 flex flex-col items-center justify-center gap-2'
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${base} transition-colors hover:bg-muted/50 focus:outline-none ${active ? activeClass : ''} ${className}`}
      >
        {children}
      </button>
    )
  }
  return <div className={`${base} ${className}`}>{children}</div>
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
    <div className="space-y-4">

      {/* ── Page header ── */}
      {title && (
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 text-sm font-semibold border border-border rounded-lg text-foreground bg-card hover:bg-muted transition-colors disabled:opacity-50"
            >
              {exporting ? 'Mengekspor…' : 'Export Excel'}
            </button>
            <Link
              href="/proyek/baru"
              className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand/90 transition-colors"
            >
              + Tambah Proyek
            </Link>
          </div>
        </div>
      )}

      {/* ── Stat strip ── */}
      <div className="flex items-stretch gap-3">

        {/* Left box: clickable stats */}
        <div className="flex flex-1 items-stretch rounded-xl border border-border bg-card overflow-hidden divide-x divide-border">

          {/* Sedang Berjalan */}
          <StripCell
            onClick={() => { setSelesaiFilter(false); setJenisFilter('Semua'); setBerjalanFilter((prev) => !prev) }}
            active={berjalanFilter}
            activeClass="bg-brand/10"
          >
            <p className="stat-label">Sedang Berjalan</p>
            <p className="text-4xl font-bold font-mono leading-tight text-brand">{stats.berjalan}</p>
          </StripCell>

          {/* Selesai */}
          <StripCell
            onClick={() => { setBerjalanFilter(false); setSelesaiFilter((prev) => !prev) }}
            active={selesaiFilter}
            activeClass="bg-emerald/10"
          >
            <p className="stat-label">Selesai</p>
            <p className="text-4xl font-bold font-mono leading-tight text-emerald">{stats.selesai}</p>
          </StripCell>

          {/* Perencanaan */}
          <StripCell
            onClick={() => toggleJenis('Perencanaan')}
            active={jenisFilter === 'Perencanaan'}
            activeClass="bg-violet/10"
          >
            <p className="stat-label">Perencanaan</p>
            <p className="text-4xl font-bold font-mono leading-tight text-violet">{stats.perencanaan}</p>
          </StripCell>

          {/* Pengawasan */}
          <StripCell
            onClick={() => toggleJenis('Pengawasan')}
            active={jenisFilter === 'Pengawasan'}
            activeClass="bg-teal/10"
          >
            <p className="stat-label">Pengawasan</p>
            <p className="text-4xl font-bold font-mono leading-tight text-teal">{stats.pengawasan}</p>
          </StripCell>

        </div>

        {/* Right box: non-clickable totals stacked vertically */}
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden divide-y divide-border min-w-[160px]">

          <div className="flex-1 px-4 py-2 flex flex-col gap-0.5">
            <p className="stat-label">Total Proyek</p>
            <p className="text-xl font-bold font-mono leading-tight text-foreground">{stats.total}</p>
          </div>

          <div className="flex-1 px-4 py-2 flex flex-col gap-0.5">
            <p className="stat-label">Total Kontrak</p>
            <p className="text-sm font-bold font-mono leading-tight text-amber truncate">{formatRupiah(stats.nilaiTotal)}</p>
          </div>

        </div>

      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Year tabs: last 3 inline, older years in dropdown */}
        <div className="flex items-center gap-1 shrink-0">
          <TabGroup
            className="shrink-0"
            tabs={[
              { label: 'Semua', value: 'semua' as const },
              ...inlineYears.map((t) => ({ label: String(t), value: t })),
            ]}
            value={selectedYearIsInDropdown ? 'semua' : tahunFilter}
            onChange={(v) => { setTahunFilter(v as number | 'semua'); setYearDropdownOpen(false) }}
          />
          {dropdownYears.length > 0 && (
            <div className="relative" ref={yearDropdownRef}>
              <button
                onClick={() => setYearDropdownOpen((o) => !o)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  selectedYearIsInDropdown
                    ? 'bg-foreground text-background border-foreground font-semibold'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
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
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, dinas, perusahaan…"
            className="w-full pl-8 pr-8 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
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

        <span className="text-xs text-muted-foreground shrink-0">
          {filtered.length} proyek
        </span>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: '380px' }} />
            <col style={{ width: '155px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '62px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '150px' }} />
            <col style={{ width: '145px' }} />
          </colgroup>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent bg-muted/40">
              <TableHead className="table-head">Nama Proyek</TableHead>
              <TableHead className="table-head">Perusahaan</TableHead>
              <TableHead className="table-head">Jenis</TableHead>
              <TableHead className="table-head">Tahun</TableHead>
              <TableHead className="table-head">Kecamatan</TableHead>
              <TableHead className="table-head">Progress</TableHead>
              <TableHead className="table-head text-right">Nilai Kontrak</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <TableRow key={p.id} className="border-border hover:bg-muted/40 transition-colors">
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedId(p.id)}
                        className="text-sm font-medium text-foreground hover:text-brand truncate block max-w-[380px] transition-colors text-left"
                      >
                        {p.nama_proyek}
                      </button>
                      {p.pernah_dioverride && <BadgeOverride />}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{p.dinas}</p>
                  </TableCell>
                  <TableCell className="py-3.5 text-sm text-muted-foreground truncate">
                    {getNamaPerusahaan(p.perusahaan)}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <BadgeJenis jenis={p.jenis_pekerjaan} />
                  </TableCell>
                  <TableCell className="py-3.5 text-sm text-muted-foreground font-mono">
                    {p.tahun_anggaran}
                  </TableCell>
                  <TableCell className="py-3.5 text-sm text-muted-foreground truncate">
                    {p.lokasi_kecamatan ?? '—'}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <ProgressCell
                      tahap={p.tahap_progress ?? null}
                      persen={p.persentase_progress ?? null}
                    />
                  </TableCell>
                  <TableCell className="py-3.5 text-sm font-mono text-right">
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
