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
import {
  FASE_PERENCANAAN,
  FASE_PENGAWASAN,
  KATEGORI_PEKERJAAN,
} from '@/lib/constants/proyek'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { StepWizard } from '@/components/ui/step-wizard'

import type { Perusahaan, ProyekFormData } from '@/lib/types/proyek'
import { FormField } from '@/components/proyek/form-field'

const STEPS = ['Identitas', 'Anggaran', 'Pemberi Kerja', 'Pelaksanaan']

type Props = {
  perusahaanList: Perusahaan[]
  initialData?: ProyekFormData
  mode?: 'create' | 'edit'
}

export function FormProyek({ perusahaanList, initialData, mode = 'create' }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [showOverrideDialog, setShowOverrideDialog] = useState(false)

  const [alasanOverride, setAlasanOverride] = useState('')

  const defaultPerusahaanId = perusahaanList[0]?.id ?? ''

  const [form, setForm] = useState({
    nama_proyek: '',
    paket_pekerjaan_induk: '',
    jenis_pekerjaan: '' as 'Perencanaan' | 'Pengawasan' | '',
    kategori_pekerjaan: '',
    tahun_anggaran: new Date().getFullYear(),
    sumber_dana: 'APBD' as 'APBD' | 'APBD-Perubahan',
    dinas: '',
    lokasi_kecamatan: '',
    nama_ppk: '',
    pagu_dana: '',
    hps: '',
    nilai_penawaran: '',
    perusahaan_id: defaultPerusahaanId,
    tanggal_mulai: '',
    tanggal_selesai: '',
    durasi_hari: '',
    tahap_progress: '',
    status_proyek: '' as 'Work' | 'Borrowed' | 'Get Borrowed' | '',
    catatan: '',
    ...initialData,
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const faseList =
    form.jenis_pekerjaan === 'Perencanaan'
      ? FASE_PERENCANAAN
      : form.jenis_pekerjaan === 'Pengawasan'
      ? FASE_PENGAWASAN
      : []

  const validateWarnings = () => {
    const w: string[] = []
    const pagu = Number(form.pagu_dana)
    const hps = Number(form.hps)
    const penawaran = Number(form.nilai_penawaran)
    if (pagu && hps && hps > pagu) w.push('HPS melebihi Pagu Dana')
    if (hps && penawaran && penawaran > hps) w.push('Nilai Penawaran melebihi HPS')
    if (form.tanggal_mulai && form.tanggal_selesai && form.tanggal_selesai <= form.tanggal_mulai) {
      w.push('Tanggal Selesai harus setelah Tanggal Mulai')
    }
    setWarnings(w)
    return w
  }

  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!form.nama_proyek || !form.paket_pekerjaan_induk || !form.jenis_pekerjaan || !form.kategori_pekerjaan) {
        toast.error('Semua field bertanda * wajib diisi')
        return false
      }
    }
    if (s === 2) {
      if (!form.pagu_dana) {
        toast.error('Pagu Dana wajib diisi')
        return false
      }
    }
    if (s === 3) {
      if (!form.dinas || !form.lokasi_kecamatan || !form.nama_ppk) {
        toast.error('Semua field bertanda * wajib diisi')
        return false
      }
    }
    if (s === 4) {
      if (!form.perusahaan_id || !form.status_proyek) {
        toast.error('Perusahaan dan Status Bendera wajib dipilih')
        return false
      }
    }
    return true
  }

  const goToStep = (nextStep: number) => {
    setStep(nextStep)
    if (nextStep !== 2) setWarnings([])
  }

  const next = () => {
    if (validateStep(step)) goToStep(Math.min(step + 1, STEPS.length))
  }
  const prev = () => goToStep(Math.max(step - 1, 1))

  const doSubmit = async (alasan?: string) => {
    setSubmitting(true)
    const endpoint = mode === 'edit' && form.id ? `/api/proyek/${form.id}` : '/api/proyek'
    const res = await fetch(endpoint, {
      method: mode === 'edit' ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json() as { data?: { id: string }; error?: string }

    if (!res.ok || json.error || !json.data) {
      setSubmitting(false)
      toast.error(`Gagal menyimpan: ${json.error ?? 'Terjadi kesalahan'}`)
      return
    }

    if (alasan) {
      const overrideRes = await fetch(`/api/proyek/${json.data.id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warnings, alasan }),
      })
      const overrideJson = await overrideRes.json() as { error?: string }
      if (!overrideRes.ok || overrideJson.error) {
        setSubmitting(false)
        toast.error(`Gagal menyimpan override: ${overrideJson.error ?? 'Terjadi kesalahan'}`)
        return
      }
    }

    setSubmitting(false)
    toast.success(mode === 'edit' ? 'Proyek berhasil diperbarui' : 'Proyek berhasil ditambahkan')
    router.push('/proyek')
    router.refresh()
  }

  // ── Field shared classes ──────────────────────────────────────────────────────
  const fi = 'field-input'

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <StepWizard steps={STEPS} currentStep={step} />

      {/* ── Step 1: Identitas ── */}
      {step === 1 && (
        <div className="section-card">
          <div className="section-header"><p className="section-title">Identitas Proyek</p></div>
          <div className="section-body grid grid-cols-2 gap-4">
            <FormField label="Nama Proyek" required className="col-span-2">
              <Input className={fi} value={form.nama_proyek}
                onChange={(e) => set('nama_proyek', e.target.value)}
                placeholder="Contoh: Perencanaan Teknis Pembangunan ..." />
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
                onValueChange={(v) => set('kategori_pekerjaan', v)}>
                <SelectTrigger className={fi}><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent className="select-content">
                  {KATEGORI_PEKERJAAN.map((k) => (
                    <SelectItem key={k} value={k} className="select-item">{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </div>
      )}

      {/* ── Step 2: Anggaran ── */}
      {step === 2 && (
        <div className="section-card">
          <div className="section-header"><p className="section-title">Anggaran</p></div>
          <div className="section-body grid grid-cols-2 gap-4">
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
            <FormField label="Pagu Dana (Rp)" required>
              <Input className={fi} type="number" value={form.pagu_dana}
                onChange={(e) => set('pagu_dana', e.target.value)}
                placeholder="Contoh: 50000000" onBlur={validateWarnings} />
            </FormField>
            <FormField label="HPS (Rp)">
              <Input className={fi} type="number" value={form.hps}
                onChange={(e) => set('hps', e.target.value)}
                placeholder="Opsional" onBlur={validateWarnings} />
            </FormField>
            <FormField label="Nilai Penawaran / Kontrak (Rp)" className="col-span-2">
              <Input className={fi} type="number" value={form.nilai_penawaran}
                onChange={(e) => set('nilai_penawaran', e.target.value)}
                placeholder="Opsional" onBlur={validateWarnings} />
            </FormField>
          </div>
        </div>
      )}

      {/* ── Step 3: Pemberi Kerja ── */}
      {step === 3 && (
        <div className="section-card">
          <div className="section-header"><p className="section-title">Pemberi Kerja</p></div>
          <div className="section-body grid grid-cols-2 gap-4">
            <FormField label="Dinas" required>
              <Input className={fi} value={form.dinas}
                onChange={(e) => set('dinas', e.target.value)}
                placeholder="Contoh: Dinas PUPR" />
            </FormField>
            <FormField label="Lokasi Kecamatan" required>
              <Input className={fi} value={form.lokasi_kecamatan}
                onChange={(e) => set('lokasi_kecamatan', e.target.value)} />
            </FormField>
            <FormField label="Nama PPK" required className="col-span-2">
              <Input className={fi} value={form.nama_ppk}
                onChange={(e) => set('nama_ppk', e.target.value)}
                placeholder="Pejabat Pembuat Komitmen" />
            </FormField>
          </div>
        </div>
      )}

      {/* ── Step 4: Pelaksanaan ── */}
      {step === 4 && (
        <div className="section-card">
          <div className="section-header"><p className="section-title">Pelaksanaan</p></div>
          <div className="section-body grid grid-cols-2 gap-4">
            <FormField label="Perusahaan (Bendera)" required className="col-span-2">
              <Select value={form.perusahaan_id}
                onValueChange={(v) => set('perusahaan_id', v)}>
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
            <FormField label="Status Bendera" required className="col-span-2">
              <Select value={form.status_proyek}
                onValueChange={(v) => set('status_proyek', v as 'Work' | 'Borrowed' | 'Get Borrowed')}>
                <SelectTrigger className={fi}><SelectValue placeholder="Pilih status bendera" /></SelectTrigger>
                <SelectContent className="select-content">
                  <SelectItem value="Work" className="select-item">Work — Proyek milik sendiri (Yasa Pratama)</SelectItem>
                  <SelectItem value="Borrowed" className="select-item">Borrowed — Bendera Yasa Pratama dipinjam pihak lain</SelectItem>
                  <SelectItem value="Get Borrowed" className="select-item">Get Borrowed — Pinjam bendera perusahaan lain</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Tanggal Mulai">
              <Input className={fi} type="date" value={form.tanggal_mulai}
                onChange={(e) => set('tanggal_mulai', e.target.value)}
                onBlur={validateWarnings} />
            </FormField>
            <FormField label="Durasi (Hari)" required>
              <Input 
                type="number" 
                className="field-input" 
                value={form.durasi_hari}
                onChange={(e) => set('durasi_hari', e.target.value)}
              />
            </FormField>
            <FormField label="Tanggal Selesai">
              <Input className={fi} type="date" value={form.tanggal_selesai}
                onChange={(e) => set('tanggal_selesai', e.target.value)}
                onBlur={validateWarnings} />
            </FormField>
            <FormField label="Tahap Progress" className="col-span-2">
              <Select value={form.tahap_progress}
                onValueChange={(v) => set('tahap_progress', v)}
                disabled={!form.jenis_pekerjaan}>
                <SelectTrigger className={fi}>
                  <SelectValue placeholder={form.jenis_pekerjaan ? 'Pilih tahap' : 'Pilih Jenis Pekerjaan dulu'} />
                </SelectTrigger>
                <SelectContent className="select-content">
                  {faseList.map((f) => (
                    <SelectItem key={f.label} value={f.label} className="select-item">
                      {f.label} ({f.persentase}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Catatan" className="col-span-2">
              <Textarea className={fi} value={form.catatan}
                onChange={(e) => set('catatan', e.target.value)}
                placeholder="Catatan tambahan (opsional)" rows={3} />
            </FormField>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-sm text-amber-300">⚠️ {w}</p>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={step === 1}
          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Sebelumnya
        </button>

        {step < STEPS.length ? (
          <button
            type="button"
            onClick={next}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand/90 transition-colors"
          >
            Selanjutnya →
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              const w = validateWarnings()
              if (w.length > 0) { setShowOverrideDialog(true); return }
              doSubmit()
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Menyimpan…' : 'Simpan Proyek'}
          </button>
        )}
      </div>

      {/* Override Dialog */}
      <ConfirmDialog
        open={showOverrideDialog}
        onOpenChange={(open) => { setShowOverrideDialog(open); if (!open) setSubmitting(false) }}
        title="Ada pelanggaran aturan"
        confirmLabel="Simpan dengan Override"
        confirmClassName="bg-amber-500/15 text-amber-300 border border-amber-500/20 hover:bg-amber-500/25"
        onConfirm={() => {
          if (!alasanOverride.trim()) {
            toast.error('Alasan override wajib diisi')
            return
          }
          setShowOverrideDialog(false)
          doSubmit(alasanOverride)
        }}
      >
        {warnings.map((w, i) => (
          <p key={i} className="text-sm text-amber-300">⚠️ {w}</p>
        ))}
        <FormField label="Alasan override" required className="pt-2">
          <Textarea
            className={fi}
            value={alasanOverride}
            onChange={(e) => setAlasanOverride(e.target.value)}
            placeholder="Jelaskan alasan penyimpangan ini..."
            rows={3} />
        </FormField>
      </ConfirmDialog>
    </form>
  )
}
