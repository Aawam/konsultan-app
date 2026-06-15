'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { FormField } from '@/components/proyek/form-field'
import { Section } from '@/components/proyek/section'
import { formatRupiah } from '@/lib/utils'
import { ProyekDisplay, getNamaPerusahaan } from '@/lib/types/proyek'

// ── types ─────────────────────────────────────────────────────────────────────

type BapForm = {
  noBAP: string
  tgl: string
  proyekId: string
  periodeAwal: string
  periodeAkhir: string
  persenSelesai: string
  nilaiTagihan: string
  uraianPekerjaan: string
  kendalaDanSolusi: string
  catatanLainnya: string
  namaPPK: string
  jabatanPPK: string
  namaKonsultan: string
  jabatanKonsultan: string
}

const EMPTY: BapForm = {
  noBAP: '', tgl: new Date().toISOString().slice(0, 10),
  proyekId: '',
  periodeAwal: '', periodeAkhir: '',
  persenSelesai: '', nilaiTagihan: '',
  uraianPekerjaan: '', kendalaDanSolusi: '', catatanLainnya: '',
  namaPPK: '', jabatanPPK: 'Pejabat Pembuat Komitmen',
  namaKonsultan: '', jabatanKonsultan: 'Project Manager',
}

const STEPS = ['Info BAP', 'Pekerjaan & Progres', 'Penandatangan']

// ── component ─────────────────────────────────────────────────────────────────

export function FormBAP({ proyekList }: { proyekList: ProyekDisplay[] }) {
  const [step, setStep] = useState(1)
  const [f, setF] = useState<BapForm>(EMPTY)
  const [generating, setGenerating] = useState(false)

  const set = <K extends keyof BapForm>(k: K, v: BapForm[K]) =>
    setF((prev) => ({ ...prev, [k]: v }))

  const selProyek = proyekList.find((p) => p.id === f.proyekId)

  // Auto-fill PPK and perusahaan name when project selected
  const handleProyekChange = (id: string) => {
    const p = proyekList.find((x) => x.id === id)
    setF((prev) => ({
      ...prev,
      proyekId: id,
      namaKonsultan: prev.namaKonsultan || getNamaPerusahaan(p?.perusahaan ?? null),
    }))
  }

  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!f.noBAP || !f.tgl || !f.proyekId) {
        toast.error('Nomor BAP, tanggal, dan proyek wajib diisi')
        return false
      }
    }
    if (s === 2) {
      if (!f.periodeAwal || !f.periodeAkhir || !f.persenSelesai || !f.nilaiTagihan || !f.uraianPekerjaan) {
        toast.error('Semua field bertanda * wajib diisi')
        return false
      }
    }
    return true
  }

  const goNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length))
  }
  const goPrev = () => setStep((s) => Math.max(s - 1, 1))

  const handleGenerate = async () => {
    if (!f.namaPPK || !f.namaKonsultan) {
      toast.error('Nama PPK dan Nama Konsultan wajib diisi')
      return
    }
    setGenerating(true)
    try {
      // Build query params for the generate endpoint
      const params = new URLSearchParams({
        proyek_id:        f.proyekId,
        no_bap:           f.noBAP,
        tgl:              f.tgl,
        periode_awal:     f.periodeAwal,
        periode_akhir:    f.periodeAkhir,
        persen_selesai:   f.persenSelesai,
        nilai_tagihan:    f.nilaiTagihan,
        uraian:           f.uraianPekerjaan,
        kendala:          f.kendalaDanSolusi,
        catatan:          f.catatanLainnya,
        nama_ppk:         f.namaPPK,
        jabatan_ppk:      f.jabatanPPK,
        nama_konsultan:   f.namaKonsultan,
        jabatan_konsultan:f.jabatanKonsultan,
      })
      const link = document.createElement('a')
      link.href = `/api/bap/generate?${params.toString()}`
      link.download = `BAP-${f.noBAP.replace(/\//g, '-')}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Dokumen BAP berhasil digenerate')
    } catch {
      toast.error('Gagal generate dokumen')
    } finally {
      setGenerating(false)
    }
  }

  // ── step indicator ──────────────────────────────────────────────────────────
  const StepBar = () => (
    <div className="flex items-center mb-6">
      {STEPS.map((label, i) => {
        const n = i + 1
        const done    = step > n
        const current = step === n
        return (
          <div key={label} className="flex items-center" style={{ flex: n < STEPS.length ? 1 : 0 }}>
            <div
              onClick={() => done && setStep(n)}
              className={`flex items-center gap-2 ${done ? 'cursor-pointer' : ''}`}
            >
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                done    ? 'bg-emerald text-white'  : '',
                current ? 'bg-brand text-white'    : '',
                !done && !current ? 'bg-muted text-muted-foreground' : '',
              ].join(' ')}>
                {done ? '✓' : n}
              </div>
              <span className={`text-[12.5px] font-medium whitespace-nowrap ${current ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {n < STEPS.length && (
              <div className={`flex-1 h-px mx-3 ${done ? 'bg-brand' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="section-card section-body">
        <StepBar />
      </div>

      {/* ── Step 1 : Info BAP ── */}
      {step === 1 && (
        <Section title="Informasi BAP">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="No. BAP *">
              <Input className="field-input" value={f.noBAP} onChange={(e) => set('noBAP', e.target.value)} placeholder="001/BAP/YPC/V/2026" />
            </FormField>
            <FormField label="Tanggal BAP *">
              <Input className="field-input" type="date" value={f.tgl} onChange={(e) => set('tgl', e.target.value)} />
            </FormField>
            <FormField label="Pilih Proyek *" className="col-span-2">
              <Select value={f.proyekId} onValueChange={handleProyekChange}>
                <SelectTrigger className="field-input">
                  <SelectValue placeholder="Pilih proyek dari daftar" />
                </SelectTrigger>
                <SelectContent className="select-content">
                  {proyekList.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="select-item">
                      {p.nama_proyek} ({p.tahun_anggaran})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Info card for selected project */}
            {selProyek && (
              <div className="col-span-2 rounded-lg bg-brand/5 border border-brand/15 px-4 py-3 grid grid-cols-3 gap-3">
                {[
                  { l: 'Perusahaan',    v: getNamaPerusahaan(selProyek.perusahaan) },
                  { l: 'Nilai Kontrak', v: formatRupiah(selProyek.nilai_penawaran) },
                  { l: 'Dinas',         v: selProyek.dinas },
                ].map((m) => (
                  <div key={m.l}>
                    <p className="text-[9.5px] text-brand uppercase tracking-wide mb-0.5 font-mono">{m.l}</p>
                    <p className="text-[12.5px] font-semibold text-foreground truncate">{m.v}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Step 2 : Pekerjaan & Progres ── */}
      {step === 2 && (
        <Section title="Pekerjaan &amp; Progres">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Periode Awal *">
              <Input className="field-input" type="date" value={f.periodeAwal} onChange={(e) => set('periodeAwal', e.target.value)} />
            </FormField>
            <FormField label="Periode Akhir *">
              <Input className="field-input" type="date" value={f.periodeAkhir} onChange={(e) => set('periodeAkhir', e.target.value)} />
            </FormField>
            <FormField label="Persentase Selesai (%) *">
              <Input className="field-input" type="number" min="0" max="100" value={f.persenSelesai} onChange={(e) => set('persenSelesai', e.target.value)} placeholder="68" />
            </FormField>
            <FormField label="Nilai Tagihan (Rp) *">
              <Input className="field-input" type="number" value={f.nilaiTagihan} onChange={(e) => set('nilaiTagihan', e.target.value)} placeholder="400000000" />
            </FormField>
            <FormField label="Uraian Pekerjaan yang Diselesaikan *" className="col-span-2">
              <Textarea className="field-input" rows={5} value={f.uraianPekerjaan} onChange={(e) => set('uraianPekerjaan', e.target.value)} placeholder="Deskripsikan pekerjaan yang telah selesai pada periode ini…" />
            </FormField>
            <FormField label="Kendala &amp; Solusi" className="col-span-2">
              <Textarea className="field-input" rows={3} value={f.kendalaDanSolusi} onChange={(e) => set('kendalaDanSolusi', e.target.value)} placeholder="Kendala yang dihadapi dan solusi yang diambil (opsional)…" />
            </FormField>
            <FormField label="Catatan Lainnya" className="col-span-2">
              <Textarea className="field-input" rows={2} value={f.catatanLainnya} onChange={(e) => set('catatanLainnya', e.target.value)} placeholder="Catatan tambahan (opsional)…" />
            </FormField>
          </div>
        </Section>
      )}

      {/* ── Step 3 : Penandatangan ── */}
      {step === 3 && (
        <Section title="Data Penandatangan">
          <div className="grid grid-cols-2 gap-4">
            <p className="col-span-2 text-sm text-muted-foreground rounded-lg bg-muted/50 border border-border px-4 py-3">
              Data ini akan muncul di kolom tanda tangan dokumen BAP.
            </p>
            <FormField label="Nama PPK *">
              <Input className="field-input" value={f.namaPPK} onChange={(e) => set('namaPPK', e.target.value)} placeholder="Nama pejabat pembuat komitmen" />
            </FormField>
            <FormField label="Jabatan PPK">
              <Input className="field-input" value={f.jabatanPPK} onChange={(e) => set('jabatanPPK', e.target.value)} />
            </FormField>
            <FormField label="Nama Konsultan *">
              <Input className="field-input" value={f.namaKonsultan} onChange={(e) => set('namaKonsultan', e.target.value)} placeholder="Nama perusahaan / project manager" />
            </FormField>
            <FormField label="Jabatan Konsultan">
              <Input className="field-input" value={f.jabatanKonsultan} onChange={(e) => set('jabatanKonsultan', e.target.value)} />
            </FormField>
          </div>
        </Section>
      )}

      {/* ── Navigation ── */}
      <div className="flex justify-between items-center pt-1">
        <div>
          {step > 1 && (
            <button onClick={goPrev} className="px-4 py-2 text-sm border border-border rounded-lg bg-muted text-foreground hover:bg-accent transition-colors">
              ← Kembali
            </button>
          )}
        </div>
        <div>
          {step < STEPS.length ? (
            <button onClick={goNext} className="px-5 py-2 text-sm rounded-lg bg-brand text-white font-semibold hover:bg-brand/90 transition-colors">
              Lanjut →
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2 text-sm rounded-lg bg-emerald text-white font-semibold hover:bg-emerald/90 transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating…' : '↓ Generate Dokumen BAP'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
