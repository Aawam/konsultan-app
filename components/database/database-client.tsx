'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PerusahaanDetail } from '@/lib/actions/perusahaan'
import { ProyekDisplay, getNamaPerusahaan } from '@/lib/types/proyek'
import { BadgeJenis } from '@/components/proyek/badges'
import { formatRupiah } from '@/lib/utils'

type Tab = 'perusahaan' | 'proyek' | 'dinas'

function TabBtn({
  id, label, count, active, onClick,
}: {
  id: Tab; label: string; count?: number; active: boolean; onClick: (id: Tab) => void
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={[
        'px-4 py-2.5 border-b-2 text-sm font-medium transition-colors',
        active
          ? 'border-brand text-brand'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      ].join(' ')}
    >
      {label}{count !== undefined && <span className="ml-1.5 text-xs text-muted-foreground">({count})</span>}
    </button>
  )
}

function Kv({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-[12px] ${value ? 'text-foreground' : 'text-muted-foreground'} ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </p>
    </div>
  )
}

function PerusahaanCard({
  comp, proyekCount, pengawasan, perencanaan, nilaiTotal,
}: {
  comp: PerusahaanDetail
  proyekCount: number
  pengawasan: number
  perencanaan: number
  nilaiTotal: number
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="section-card">
      {/* Header */}
      <div className="section-body">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-brand">
              {comp.inisial_perusahaan ?? comp.nama_perusahaan.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-bold text-foreground leading-tight">
              {comp.nama_perusahaan}
              {comp.adalah_perusahaan_sendiri && <span className="ml-1.5 text-amber">⭐</span>}
            </p>
            {comp.kota && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{comp.kota} {comp.kode_pos ?? ''}</p>
            )}
          </div>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Proyek',      value: proyekCount, color: 'text-foreground' },
            { label: 'Pengawasan',  value: pengawasan,  color: 'text-teal' },
            { label: 'Perencanaan', value: perencanaan, color: 'text-violet' },
          ].map((s) => (
            <div key={s.label} className="text-center rounded-lg bg-muted/50 py-2 border border-border">
              <p className="text-[9.5px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-muted-foreground mb-3">
          Total kontrak: <span className="text-foreground font-mono font-semibold">{formatRupiah(nilaiTotal)}</span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs text-brand hover:underline text-left"
        >
          {expanded ? '▲ Sembunyikan detail' : '▼ Lihat detail perusahaan'}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border section-body grid grid-cols-2 gap-x-6 gap-y-3">
          <Kv label="NPWP" value={comp.npwp} mono />
          <Kv label="Telepon" value={comp.telepon} />
          <Kv label="Email" value={comp.email} />
          <Kv label="Direktur" value={comp.nama_direktur} />
          <Kv label="NPWP Direktur" value={comp.npwp_direktur} mono />
          <Kv label="Alamat" value={comp.alamat} />
          <Kv label="Bank" value={comp.bank_nama} />
          <Kv label="No. Rekening" value={comp.bank_rekening} mono />
          <Kv label="Atas Nama Rekening" value={comp.bank_atas_nama} />
        </div>
      )}
    </div>
  )
}

export function DatabaseClient({
  perusahaanList,
  proyekList,
}: {
  perusahaanList: PerusahaanDetail[]
  proyekList: ProyekDisplay[]
}) {
  const [tab, setTab]       = useState<Tab>('perusahaan')
  const [search, setSearch] = useState('')
  const [tahun, setTahun]   = useState<number | 'semua'>('semua')

  const tahunList = useMemo(() => {
    const s = new Set(proyekList.map((p) => p.tahun_anggaran))
    return Array.from(s).sort((a, b) => b - a)
  }, [proyekList])

  const filteredProyek = useMemo(() => {
    let list = proyekList
    if (tahun !== 'semua') list = list.filter((p) => p.tahun_anggaran === tahun)
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
  }, [proyekList, tahun, search])

  // Dinas aggregation
  const dinasMap = useMemo(() => {
    const m = new Map<string, { total: number; nilai: number; pengawasan: number; perencanaan: number }>()
    proyekList.forEach((p) => {
      const d = p.dinas
      const existing = m.get(d) ?? { total: 0, nilai: 0, pengawasan: 0, perencanaan: 0 }
      m.set(d, {
        total:       existing.total + 1,
        nilai:       existing.nilai + (p.nilai_penawaran ?? 0),
        pengawasan:  existing.pengawasan  + (p.jenis_pekerjaan === 'Pengawasan'  ? 1 : 0),
        perencanaan: existing.perencanaan + (p.jenis_pekerjaan === 'Perencanaan' ? 1 : 0),
      })
    })
    return Array.from(m.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .filter(([d]) => !search || d.toLowerCase().includes(search.toLowerCase()))
  }, [proyekList, search])

  const filteredComp = useMemo(
    () =>
      perusahaanList.filter(
        (c) => !search || c.nama_perusahaan.toLowerCase().includes(search.toLowerCase())
      ),
    [perusahaanList, search]
  )

  return (
    <div className="space-y-4">

      {/* ── Tab bar + search ── */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex">
          <TabBtn id="perusahaan" label="Perusahaan"   count={perusahaanList.length} active={tab === 'perusahaan'} onClick={setTab} />
          <TabBtn id="proyek"     label="Semua Proyek" count={proyekList.length}     active={tab === 'proyek'}     onClick={setTab} />
          <TabBtn id="dinas"      label="Dinas / SKPD"                               active={tab === 'dinas'}      onClick={setTab} />
        </div>
        <div className="flex items-center gap-2 pb-2">
          {tab === 'proyek' && (
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted p-1">
              <button onClick={() => setTahun('semua')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${tahun === 'semua' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>Semua</button>
              {tahunList.map((y) => (
                <button key={y} onClick={() => setTahun(y)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${tahun === y ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>{y}</button>
              ))}
            </div>
          )}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari…"
              className="pl-7 pr-3 py-1.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand w-48"
            />
          </div>
        </div>
      </div>

      {/* ── Perusahaan tab ── */}
      {tab === 'perusahaan' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComp.map((comp) => {
            const compProyek = proyekList.filter((p) => p.perusahaan_id === comp.id)
            return (
              <PerusahaanCard
                key={comp.id}
                comp={comp}
                proyekCount={compProyek.length}
                pengawasan={compProyek.filter((p) => p.jenis_pekerjaan === 'Pengawasan').length}
                perencanaan={compProyek.filter((p) => p.jenis_pekerjaan === 'Perencanaan').length}
                nilaiTotal={compProyek.reduce((s, p) => s + (p.nilai_penawaran ?? 0), 0)}
              />
            )
          })}
          {filteredComp.length === 0 && (
            <p className="col-span-3 text-center text-sm text-muted-foreground py-16">
              Tidak ada perusahaan ditemukan
            </p>
          )}
        </div>
      )}

      {/* ── Proyek tab ── */}
      {tab === 'proyek' && (
        <div className="section-card overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {['Nama Proyek', 'Perusahaan', 'Dinas', 'Jenis', 'Tahun', 'Nilai Kontrak'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[10.5px] font-mono text-muted-foreground uppercase tracking-wider text-${i === 5 ? 'right' : 'left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProyek.length > 0 ? filteredProyek.map((p, i) => (
                <tr key={p.id} className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                  <td className="px-4 py-3 max-w-[240px]">
                    <Link href={`/proyek/${p.id}`} className="font-medium text-foreground hover:text-brand transition-colors block truncate">
                      {p.nama_proyek}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">{getNamaPerusahaan(p.perusahaan)}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[140px]">{p.dinas}</td>
                  <td className="px-4 py-3"><BadgeJenis jenis={p.jenis_pekerjaan} /></td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{p.tahun_anggaran}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {p.nilai_penawaran ? formatRupiah(p.nilai_penawaran) : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Tidak ada proyek</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Dinas tab ── */}
      {tab === 'dinas' && (
        <div className="section-card overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {['Dinas / SKPD', 'Jml Proyek', 'Pengawasan', 'Perencanaan', 'Total Nilai Kontrak'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[10.5px] font-mono text-muted-foreground uppercase tracking-wider text-${i >= 1 ? 'right' : 'left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dinasMap.length > 0 ? dinasMap.map(([dinas, info], i) => (
                <tr key={dinas} className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                  <td className="px-4 py-3 font-medium text-foreground max-w-[280px] truncate">{dinas}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-foreground">{info.total}</td>
                  <td className="px-4 py-3 text-right font-semibold text-teal">{info.pengawasan}</td>
                  <td className="px-4 py-3 text-right font-semibold text-violet">{info.perencanaan}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {info.nilai ? formatRupiah(info.nilai) : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">Tidak ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
