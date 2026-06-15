'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { FormField } from '@/components/proyek/form-field'
import { StepWizard } from '@/components/ui/step-wizard'
import { KATEGORI_PEKERJAAN } from '@/lib/constants/proyek'
import type { Perusahaan } from '@/lib/types/proyek'
import { formatRupiah } from '@/lib/utils'

// ── types ─────────────────────────────────────────────────────────────────────

type Personil = {
  id: string
  nama_lengkap: string
  klasifikasi_skk: string | null
  nomor_skk: string | null
}

type PengalamanPerusahaan = {
  id: string
  nama_paket: string
  pemberi_kerja: string
  lokasi: string | null
  nilai_kontrak: number | null
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  nomor_kontrak: string | null
  kategori_pekerjaan: string | null
}

type PersonilTerpilih = {
  personil_id: string
  nama_lengkap: string
  posisi: string
  durasi_bulan: number
}

type Props = {
  perusahaanList: Perusahaan[]
  personilList: Personil[]
  pengalamanList: PengalamanPerusahaan[]
}

const STEPS = ['Identitas Proyek', 'Pemberi Kerja & Pelaksanaan', 'Personil', 'Pengalaman']

// ── component ─────────────────────────────────────────────────────────────────

export function FormPenawaran({ perusahaanList, personilList, pengalamanList }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const defaultPerusahaanId =
    perusahaanList.find((p) => p.adalah_perusahaan_sendiri)?.id ?? ''

  const [form, setForm] = useState({
    nama_proyek: '',
    paket_pekerjaan_induk: '',
    jenis_pekerjaan: '' as 'Perencanaan' | 'Pengawasan' | '',
    kategori_pekerjaan: '' as string,
    tahun_anggaran: new Date().getFullYear(),
    sumber_dana: 'APBD' as 'APBD' | 'APBD-Perubahan',
    dinas: '',
    alamat_dinas: '',
    lokasi_kecamatan: '',
    nama_ppk: '',
    pagu_dana: '',
    hps: '',
    perusahaan_id: defaultPerusahaanId,
    tanggal_mulai: '',
    tanggal_selesai: '',
    catatan: '',
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  // Personil state
  const [personilTerpilih, setPersonilTerpilih] = useState<PersonilTerpilih[]>([])
  const [personilBaruId, setPersonilBaruId] = useState('')
  const [personilBaruPosisi, setPersonilBaruPosisi] = useState('')
  const [personilBaruDurasi, setPersonilBaruDurasi] = useState('')

  // Pengalaman state
  const [pengalamanTerpilih, setPengalamanTerpilih] = useState<string[]>([])
  const [pengalamanDinamis, setPengalamanDinamis] = useState(pengalamanList)

  const handlePerusahaanChange = async (perusahaanId: string) => {
    set('perusahaan_id', perusahaanId)
    setPengalamanTerpilih([])
    const res = await fetch(`/api/pengalaman?perusahaan_id=${perusahaanId}`)
    const json = await res.json()
    setPengalamanDinamis(json.data ?? [])
  }

  const pengalamanFiltered = form.kategori_pekerjaan
    ? pengalamanDinamis.filter((p) => p.kategori_pekerjaan === form.kategori_pekerjaan)
    : pengalamanDinamis

  const tambahPersonil = () => {
    if (!personilBaruId || !personilBaruPosisi || !personilBaruDurasi) {
      toast.error('Isi semua field personil terlebih dahulu')
      return
    }
    if (personilTerpilih.find((p) => p.personil_id === personilBaruId)) {
      toast.error('Personil sudah ditambahkan')
      return
    }
    const personil = personilList.find((p) => p.id === personilBaruId)
    if (!personil) return
    setPersonilTerpilih((prev) => [
      ...prev,
      { personil_id: personilBaruId, nama_lengkap: personil.nama_lengkap, posisi: personilBaruPosisi, durasi_bulan: Number(personilBaruDurasi) },
    ])
    setPersonilBaruId('')
    setPersonilBaruPosisi('')
    setPersonilBaruDurasi('')
  }

  const hapusPersonil = (id: string) => {
    setPersonilTerpilih((prev) => prev.filter((p) => p.personil_id !== id))
  }

  const togglePengalaman = (id: string) => {
    setPengalamanTerpilih((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!form.nama_proyek || !form.paket_pekerjaan_induk || !form.jenis_pekerjaan || !form.kategori_pekerjaan || !form.pagu_dana) {
        toast.error('Semua field bertanda * wajib diisi')
        return false
      }
    }
    if (s === 2) {
      if (!form.dinas || !form.lokasi_kecamatan || !form.nama_ppk || !form.perusahaan_id) {
        toast.error('Semua field bertanda * wajib diisi')
        return false
      }
    }
    if (s === 3) {
      if (personilTerpilih.length === 0) {
        toast.error('Minimal 1 personil harus ditambahkan')
        return false
      }
    }
    return true
  }

  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length))
  }
  const prev = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setSubmitting(true)
    const res = await fetch('/api/penawaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form: { ...form, nilai_penawaran: '' },
        personilList: personilTerpilih.map((p) => ({
          personil_id: p.personil_id,
          posisi: p.posisi,
          durasi_bulan: p.durasi_bulan,
        })),
      }),
    })
    const json = await res.json() as { data?: { id: string }; error?: string }

    if (!res.ok || json.error || !json.data) {
      setSubmitting(false)
      toast.error(`Gagal menyimpan: ${json.error ?? 'Terjadi kesalahan'}`)
      return
    }

    toast.success('Dokumen penawaran berhasil disimpan')
    const link = document.createElement('a')
    link.href = `/api/penawaran/generate?proyek_id=${json.data.id}`
    link.download = ''
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    router.push('/proyek')
    router.refresh()
  }

  const fi = 'field-input'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <StepWizard steps={STEPS} currentStep={step} />

      {/* ── Step 1: Identitas Proyek ── */}
      {step === 1 && (
        <div className="section-card">
          <div className="section-header"><p className="section-title">Identitas Proyek</p></div>
          <div className="section-body grid grid-cols-2 gap-4">
            <FormField label="Nama Proyek" required className="col-span-2">
              <Input className={fi} value={form.nama_proyek}
                onChange={(e) => set('nama_proyek', e.target.value)}
                placeholder="Perencanaan Pembangunan ..." />
            </FormField>
            <FormField label="Paket Pekerjaan Induk" required className="col-span-2">
              <Input className={fi} value={form.paket_pekerjaan_induk}
                onChange={(e) => set('paket_pekerjaan_induk', e.target.value)}
                placeholder="Nama paket fisik induk" />
            </FormField>
            <FormField label="Jenis Pekerjaan" required>
              <Select value={form.jenis_pekerjaan}
                onValueChange={(v) => set('jenis_pekerjaan', v as 'Perencanaan' | 'Pengawasan')}>
                <SelectTrigger className={fi}><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                <SelectContent className="select-content">
                  <SelectItem value="Perencanaan" className="select-item">Perencanaan</SelectItem>
                  <SelectItem value="Pengawasan" className="select-item">Pengawasan</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Kategori Pekerjaan" required>
              <Select value={form.kategori_pekerjaan}
                onValueChange={(v) => { set('kategori_pekerjaan', v); setPengalamanTerpilih([]) }}>
                <SelectTrigger className={fi}><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent className="select-content">
                  {KATEGORI_PEKERJAAN.map((k) => (
                    <SelectItem key={k} value={k} className="select-item">{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Tahun Anggaran" required>
              <Input className={fi} type="number" value={form.tahun_anggaran}
                onChange={(e) => set('tahun_anggaran', Number(e.target.value))} />
            </FormField>
            <FormField label="Sumber Dana" required>
              <Select value={form.sumber_dana}
                onValueChange={(v) => set('sumber_dana', v as 'APBD' | 'APBD-Perubahan')}>
                <SelectTrigger className={fi}><SelectValue /></SelectTrigger>
                <SelectContent className="select-content">
                  <SelectItem value="APBD" className="select-item">APBD</SelectItem>
                  <SelectItem value="APBD-Perubahan" className="select-item">APBD-Perubahan</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Pagu Dana (Rp)" required className="col-span-2">
              <Input className={fi} type="number" value={form.pagu_dana}
                onChange={(e) => set('pagu_dana', e.target.value)}
                placeholder="Contoh: 50000000" />
            </FormField>
            <FormField label="HPS (Rp)" className="col-span-2">
              <Input className={fi} type="number" value={form.hps}
                onChange={(e) => set('hps', e.target.value)}
                placeholder="Opsional" />
            </FormField>
          </div>
        </div>
      )}

      {/* ── Step 2: Pemberi Kerja & Pelaksanaan ── */}
      {step === 2 && (
        <div className="section-card">
          <div className="section-header"><p className="section-title">Pemberi Kerja & Pelaksanaan</p></div>
          <div className="section-body grid grid-cols-2 gap-4">
            <FormField label="Dinas" required className="col-span-2">
              <Input className={fi} value={form.dinas}
                onChange={(e) => set('dinas', e.target.value)}
                placeholder="Contoh: Dinas Pendidikan" />
            </FormField>
            <FormField label="Alamat Dinas" className="col-span-2">
              <Input className={fi} value={form.alamat_dinas}
                onChange={(e) => set('alamat_dinas', e.target.value)}
                placeholder="Opsional" />
            </FormField>
            <FormField label="Nama PPK" required className="col-span-2">
              <Input className={fi} value={form.nama_ppk}
                onChange={(e) => set('nama_ppk', e.target.value)}
                placeholder="Pejabat Pembuat Komitmen" />
            </FormField>
            <FormField label="Lokasi Kecamatan" required className="col-span-2">
              <Input className={fi} value={form.lokasi_kecamatan}
                onChange={(e) => set('lokasi_kecamatan', e.target.value)} />
            </FormField>
            <FormField label="Perusahaan (Bendera)" required className="col-span-2">
              <Select value={form.perusahaan_id} onValueChange={handlePerusahaanChange}>
                <SelectTrigger className={fi}><SelectValue placeholder="Pilih perusahaan" /></SelectTrigger>
                <SelectContent className="select-content">
                  {perusahaanList.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="select-item">
                      {p.nama_perusahaan}{p.adalah_perusahaan_sendiri && ' ⭐'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Tanggal Mulai">
              <Input className={fi} type="date" value={form.tanggal_mulai}
                onChange={(e) => set('tanggal_mulai', e.target.value)} />
            </FormField>
            <FormField label="Tanggal Selesai">
              <Input className={fi} type="date" value={form.tanggal_selesai}
                onChange={(e) => set('tanggal_selesai', e.target.value)} />
            </FormField>
            <FormField label="Catatan" className="col-span-2">
              <Textarea className={fi} value={form.catatan}
                onChange={(e) => set('catatan', e.target.value)}
                placeholder="Opsional" rows={3} />
            </FormField>
          </div>
        </div>
      )}

      {/* ── Step 3: Personil ── */}
      {step === 3 && (
        <div className="section-card">
          <div className="section-header"><p className="section-title">Personil</p></div>
          <div className="section-body space-y-4">
            {/* Input tambah */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <Select value={personilBaruId} onValueChange={setPersonilBaruId}>
                  <SelectTrigger className={fi}><SelectValue placeholder="Pilih personil" /></SelectTrigger>
                  <SelectContent className="select-content">
                    {personilList.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="select-item">
                        {p.nama_lengkap}
                        {p.klasifikasi_skk && <span className="text-muted-foreground ml-1 text-xs">— {p.klasifikasi_skk}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input className={fi} value={personilBaruPosisi}
                onChange={(e) => setPersonilBaruPosisi(e.target.value)}
                placeholder="Posisi (Team Leader)" />
              <div className="flex gap-2">
                <Input className={fi} type="number" value={personilBaruDurasi}
                  onChange={(e) => setPersonilBaruDurasi(e.target.value)}
                  placeholder="Durasi (bln)" />
                <button type="button" onClick={tambahPersonil}
                  className="px-3 py-2 text-sm text-white border border-brand/20 rounded-lg bg-brand/15 hover:bg-brand/25 transition-colors whitespace-nowrap">
                  + Tambah
                </button>
              </div>
            </div>

            {/* Tabel personil */}
            {personilTerpilih.length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wider">Nama</th>
                      <th className="text-left px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wider">Posisi</th>
                      <th className="text-left px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wider">Durasi</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {personilTerpilih.map((p) => (
                      <tr key={p.personil_id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2 text-foreground font-medium">{p.nama_lengkap}</td>
                        <td className="px-4 py-2 text-muted-foreground">{p.posisi}</td>
                        <td className="px-4 py-2 text-muted-foreground">{p.durasi_bulan} bulan</td>
                        <td className="px-4 py-2 text-right">
                          <button type="button" onClick={() => hapusPersonil(p.personil_id)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada personil ditambahkan.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: Pengalaman ── */}
      {step === 4 && (
        <div className="section-card">
          <div className="section-header"><p className="section-title">Pengalaman Perusahaan</p></div>
          <div className="section-body">
            {!form.kategori_pekerjaan ? (
              <p className="text-sm text-muted-foreground">Pilih kategori pekerjaan di Step 1 untuk memfilter pengalaman.</p>
            ) : pengalamanFiltered.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada pengalaman untuk kategori <span className="text-foreground">{form.kategori_pekerjaan}</span>.
              </p>
            ) : (
              <div className="space-y-2">
                {pengalamanFiltered.map((p) => {
                  const dipilih = pengalamanTerpilih.includes(p.id)
                  return (
                    <div key={p.id} onClick={() => togglePengalaman(p.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        dipilih ? 'border-brand/30 bg-brand/10' : 'border-border bg-muted/10 hover:bg-muted/30'
                      }`}>
                      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        dipilih ? 'border-brand bg-brand/30' : 'border-border'
                      }`}>
                        {dipilih && <span className="text-brand text-[10px]">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{p.nama_paket}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.pemberi_kerja}</p>
                        {p.nilai_kontrak && (
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{formatRupiah(p.nilai_kontrak)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={prev} disabled={step === 1}
          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          ← Sebelumnya
        </button>

        {step < STEPS.length ? (
          <button type="button" onClick={next}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand/90 transition-colors">
            Selanjutnya →
          </button>
        ) : (
          <button type="submit" disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50">
            {submitting ? 'Menyimpan…' : 'Simpan & Generate Dokumen'}
          </button>
        )}
      </div>
    </form>
  )
}
