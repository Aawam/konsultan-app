'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { FASE_PERENCANAAN, FASE_PENGAWASAN } from '@/lib/constants/proyek'
import type { DinasOption, Perusahaan, ProyekFormData } from '@/lib/types/proyek'
import { formatNumberInput, parseNumberInput } from '@/lib/utils'
import {
  DRAFTS_STORAGE_KEY,
  STEPS,
  asPayload,
  buildDefaultValues,
  getDurasiHari,
  proyekFormSchema,
  readLocalDrafts,
  type LocalProjectDraft,
  type ProyekFormValues,
} from '@/components/proyek/form/proyek-form-schema'
import {
  ProyekDraftDialog,
  ProyekOverrideDialog,
} from '@/components/proyek/form/proyek-form-dialogs'
import {
  ProyekFormProgressPanel,
  ProyekFormSummaryPanel,
} from '@/components/proyek/form/proyek-form-panels'
import { ProyekFormStepContent } from '@/components/proyek/form/proyek-form-sections'

type Props = {
  perusahaanList: Perusahaan[]
  dinasList: DinasOption[]
  initialData?: ProyekFormData
  mode: 'create' | 'edit'
}

export function ProyekFormShell({ perusahaanList, dinasList, initialData, mode }: Props) {
  const router = useRouter()
  const initialDrafts = mode === 'create' ? readLocalDrafts() : []
  const [step, setStep] = useState(1)
  const [warnings, setWarnings] = useState<string[]>([])
  const [showOverrideDialog, setShowOverrideDialog] = useState(false)
  const [showDraftDialog, setShowDraftDialog] = useState(initialDrafts.length > 0)
  const [alasanOverride, setAlasanOverride] = useState('')
  const [durasiManuallyEdited, setDurasiManuallyEdited] = useState(false)
  const [drafts, setDrafts] = useState<LocalProjectDraft[]>(initialDrafts)
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null)

  const defaultPerusahaanId = perusahaanList[0]?.id ?? ''
  const baseDinasList = useMemo(
    () =>
      [...new Set(dinasList.map((item) => item.dinas.trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [dinasList]
  )

  const form = useForm<ProyekFormValues>({
    resolver: zodResolver(proyekFormSchema),
    defaultValues: buildDefaultValues(initialData, defaultPerusahaanId),
    mode: 'onBlur',
  })

  const {
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    trigger,
  } = form

  const [
    jenisPekerjaan,
    selectedDinas = '',
    tanggalMulai = '',
    tanggalSelesai = '',
    namaProyek = '',
    paketPekerjaanInduk = '',
    kategoriPekerjaan = '',
    paguDana = '',
    tahunAnggaran,
    sumberDana = '',
    lokasiKecamatan = '',
    perusahaanId = '',
    statusProyek = '',
    durasiHari = '',
    nilaiPenawaran = '',
  ] = useWatch({
    control,
    name: [
      'jenis_pekerjaan',
      'dinas',
      'tanggal_mulai',
      'tanggal_selesai',
      'nama_proyek',
      'paket_pekerjaan_induk',
      'kategori_pekerjaan',
      'pagu_dana',
      'tahun_anggaran',
      'sumber_dana',
      'lokasi_kecamatan',
      'perusahaan_id',
      'status_proyek',
      'durasi_hari',
      'nilai_penawaran',
    ],
  })

  const [isCustomDinas, setIsCustomDinas] = useState(
    Boolean(initialData?.dinas && !baseDinasList.includes(initialData.dinas.trim()))
  )

  const normalizedDinasList = useMemo(() => {
    const values = new Set(baseDinasList)
    if (selectedDinas.trim()) values.add(selectedDinas.trim())
    return [...values].sort((a, b) => a.localeCompare(b))
  }, [baseDinasList, selectedDinas])

  const faseList =
    jenisPekerjaan === 'Perencanaan'
      ? FASE_PERENCANAAN
      : jenisPekerjaan === 'Pengawasan'
        ? FASE_PENGAWASAN
        : []

  useEffect(() => {
    if (durasiManuallyEdited) return

    const durasiOtomatis =
      tanggalMulai && tanggalSelesai ? getDurasiHari(tanggalMulai, tanggalSelesai) : null
    setValue('durasi_hari', durasiOtomatis ? String(durasiOtomatis) : '', {
      shouldDirty: true,
      shouldValidate: false,
    })
  }, [durasiManuallyEdited, setValue, tanggalMulai, tanggalSelesai])

  const persistDrafts = (nextDrafts: LocalProjectDraft[]) => {
    setDrafts(nextDrafts)
    if (typeof window === 'undefined') return
    window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts))
  }

  const validateWarnings = () => {
    const values = getValues()
    const nextWarnings: string[] = []
    const pagu = parseNumberInput(values.pagu_dana)
    const hps = parseNumberInput(values.hps)
    const penawaran = parseNumberInput(values.nilai_penawaran)

    if (pagu && hps && hps > pagu) nextWarnings.push('HPS melebihi Pagu Dana')
    if (hps && penawaran && penawaran > hps) nextWarnings.push('Nilai Penawaran melebihi HPS')
    if (values.tanggal_mulai && values.tanggal_selesai && values.tanggal_selesai <= values.tanggal_mulai) {
      nextWarnings.push('Tanggal Selesai harus setelah Tanggal Mulai')
    }

    setWarnings(nextWarnings)
    return nextWarnings
  }

  const validateStep = async (currentStep: number) => {
    const fieldsByStep: Record<number, (keyof ProyekFormValues)[]> = {
      1: ['nama_proyek', 'paket_pekerjaan_induk', 'jenis_pekerjaan', 'kategori_pekerjaan'],
      2: ['tahun_anggaran', 'sumber_dana', 'pagu_dana', 'hps', 'nilai_penawaran'],
      3: ['dinas', 'lokasi_kecamatan'],
      4: ['perusahaan_id', 'status_proyek', 'tanggal_mulai', 'tanggal_selesai'],
    }

    const fieldLabels: Partial<Record<keyof ProyekFormValues, string>> = {
      nama_proyek: 'Nama proyek',
      paket_pekerjaan_induk: 'Paket pekerjaan induk',
      jenis_pekerjaan: 'Jenis pekerjaan',
      kategori_pekerjaan: 'Kategori pekerjaan',
      tahun_anggaran: 'Tahun anggaran',
      sumber_dana: 'Sumber dana',
      pagu_dana: 'Pagu dana',
      hps: 'HPS',
      nilai_penawaran: 'Nilai penawaran',
      dinas: 'Dinas / SKPD',
      lokasi_kecamatan: 'Lokasi kecamatan',
      perusahaan_id: 'Perusahaan',
      status_proyek: 'Status bendera',
      tanggal_mulai: 'Tanggal mulai',
      tanggal_selesai: 'Tanggal selesai',
    }

    const showValidationToast = (fields: (keyof ProyekFormValues)[]) => {
      const messages = fields
        .map((field) => {
          const state = form.getFieldState(field)
          if (!state.invalid) return null
          return state.error?.message ?? `${fieldLabels[field] ?? field} belum valid`
        })
        .filter(Boolean)
        .slice(0, 4)

      toast.error('Data belum lengkap', {
        description: messages.length > 0
          ? messages.join(' • ')
          : 'Lengkapi field wajib sebelum melanjutkan.',
      })
    }

    const valid = await trigger(fieldsByStep[currentStep], { shouldFocus: true })
    if (!valid) showValidationToast(fieldsByStep[currentStep])
    return valid
  }

  const goToStep = (nextStep: number) => {
    setStep(nextStep)
    if (nextStep !== 2) setWarnings([])
  }

  const next = async () => {
    if (await validateStep(step)) goToStep(Math.min(step + 1, STEPS.length))
  }

  const prev = () => goToStep(Math.max(step - 1, 1))

  const saveDraft = () => {
    if (typeof window === 'undefined') return
    const now = new Date().toISOString()
    const draftId = activeDraftId ?? `draft-${Date.now()}`
    const nextDraft: LocalProjectDraft = {
      id: draftId,
      updatedAt: now,
      data: getValues(),
    }
    const nextDrafts = [
      nextDraft,
      ...drafts.filter((draft) => draft.id !== draftId),
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    setActiveDraftId(draftId)
    persistDrafts(nextDrafts)
    toast.success('Draft proyek tersimpan di browser ini')
  }

  const resumeDraft = (draft: LocalProjectDraft) => {
    reset({
      ...buildDefaultValues(undefined, defaultPerusahaanId),
      ...draft.data,
    })
    setActiveDraftId(draft.id)
    setShowDraftDialog(false)
    toast.success('Draft proyek dipulihkan')
  }

  const deleteDraft = (draftId: string) => {
    const nextDrafts = drafts.filter((draft) => draft.id !== draftId)
    persistDrafts(nextDrafts)
    if (activeDraftId === draftId) setActiveDraftId(null)
    if (nextDrafts.length === 0) setShowDraftDialog(false)
    toast.success('Draft proyek dihapus')
  }

  const submitToApi = async (values: ProyekFormValues, alasan?: string) => {
    const endpoint = mode === 'edit' && values.id ? `/api/proyek/${values.id}` : '/api/proyek'
    let json: { data?: { id: string }; error?: string } = {}
    let ok = false

    try {
      const res = await fetch(endpoint, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asPayload(values)),
      })
      json = (await res.json()) as { data?: { id: string }; error?: string }
      ok = res.ok
    } catch (error) {
      json = { error: error instanceof Error ? error.message : 'Terjadi kesalahan koneksi' }
    }

    if (!ok || json.error || !json.data) {
      toast.error(`Gagal menyimpan: ${json.error ?? 'Terjadi kesalahan'}`)
      return
    }

    if (alasan) {
      let overrideJson: { error?: string } = {}
      let overrideOk = false

      try {
        const overrideRes = await fetch(`/api/proyek/${json.data.id}/override`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ warnings, alasan }),
        })
        overrideJson = (await overrideRes.json()) as { error?: string }
        overrideOk = overrideRes.ok
      } catch (error) {
        overrideJson = { error: error instanceof Error ? error.message : 'Terjadi kesalahan koneksi' }
      }

      if (!overrideOk || overrideJson.error) {
        toast.error(`Gagal menyimpan override: ${overrideJson.error ?? 'Terjadi kesalahan'}`)
        return
      }
    }

    toast.success(mode === 'edit' ? 'Proyek berhasil diperbarui' : 'Proyek berhasil ditambahkan')
    router.push(mode === 'edit' && values.id ? `/proyek/${values.id}` : '/proyek')
    router.refresh()
  }

  const submitFinalStep = handleSubmit(
    async (values) => {
      const nextWarnings = validateWarnings()
      if (nextWarnings.length > 0) {
        setShowOverrideDialog(true)
        return
      }

      await submitToApi(values)
    },
    () => {
      toast.error('Data belum lengkap', {
        description: 'Lengkapi field wajib pada setiap langkah sebelum menyimpan proyek.',
      })
    }
  )

  const submitWithOverride = handleSubmit(async (values) => {
    if (!alasanOverride.trim()) {
      toast.error('Alasan override wajib diisi')
      return
    }

    setShowOverrideDialog(false)
    await submitToApi(values, alasanOverride)
  })

  const handleMoneyChange = (field: 'pagu_dana' | 'hps' | 'nilai_penawaran', value: string) => {
    setValue(field, formatNumberInput(value), { shouldDirty: true, shouldValidate: true })
  }

  const fi = 'field-input aria-invalid:border-border aria-invalid:ring-0 dark:aria-invalid:border-white/10'
  const submitLabel = mode === 'edit' ? 'Perbarui Proyek' : 'Simpan Proyek'
  const stepTitles = ['Identitas Proyek', 'Anggaran', 'Pemberi Kerja', 'Pelaksanaan']
  const stepDescriptions = [
    'Mulai dari informasi yang paling sering diketahui di awal pekerjaan.',
    'Catat pagu, HPS, dan nilai kontrak agar kontrol anggaran tetap terlihat.',
    'Tentukan dinas, lokasi, dan penanggung jawab pekerjaan.',
    'Pilih perusahaan/bendera, tanggal kerja, dan tahap progress proyek.',
  ]
  const hasRequiredValue = (value: unknown) => value !== undefined && value !== null && String(value).trim() !== ''
  const stepCompletion = [
    Boolean(namaProyek.trim() && paketPekerjaanInduk.trim() && jenisPekerjaan && kategoriPekerjaan),
    hasRequiredValue(tahunAnggaran) && Boolean(sumberDana) && hasRequiredValue(paguDana),
    Boolean(selectedDinas.trim() && lokasiKecamatan.trim()),
    Boolean(perusahaanId && statusProyek),
  ]
  const checklist = [
    { label: 'Nama proyek', done: Boolean(namaProyek.trim()) },
    { label: 'Jenis & kategori', done: Boolean(jenisPekerjaan && kategoriPekerjaan) },
    { label: 'Tahun & sumber dana', done: hasRequiredValue(tahunAnggaran) && Boolean(sumberDana) },
    { label: 'Dinas / SKPD', done: Boolean(selectedDinas.trim()) },
    { label: 'Perusahaan bendera', done: Boolean(perusahaanId) },
    { label: 'Durasi pekerjaan', done: hasRequiredValue(durasiHari) },
  ]

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (step < STEPS.length) {
          void next()
          return
        }
        void submitFinalStep()
      }}
      className="space-y-6"
    >
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_280px]">
        <ProyekFormProgressPanel
          step={step}
          stepCompletion={stepCompletion}
          checklist={checklist}
          onStepChange={goToStep}
        />

        <div className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {step}. {stepTitles[step - 1]}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{stepDescriptions[step - 1]}</p>
          </div>

          <ProyekFormStepContent
            step={step}
            control={control}
            errors={errors}
            register={register}
            fieldClassName={fi}
            normalizedDinasList={normalizedDinasList}
            isCustomDinas={isCustomDinas}
            perusahaanList={perusahaanList}
            jenisPekerjaan={jenisPekerjaan}
            faseList={faseList}
            onCustomDinasChange={setIsCustomDinas}
            onMoneyChange={handleMoneyChange}
            onValidateWarnings={validateWarnings}
            onDurasiManualChange={setDurasiManuallyEdited}
          />

          {warnings.length > 0 && (
            <div className="space-y-1 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              {warnings.map((warning) => (
                <p key={warning} className="text-sm text-amber-700 dark:text-amber-300">
                  Peringatan: {warning}
                </p>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              onClick={prev}
              disabled={step === 1}
              className="h-11 border-brand/35 bg-brand/5 text-brand hover:bg-brand/10"
            >
              Sebelumnya
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={saveDraft}
              className="h-11 border-amber/35 bg-amber/10 text-amber hover:bg-amber/15"
            >
              Simpan Draft
            </Button>

            {step < STEPS.length ? (
              <Button type="button" onClick={next} className="h-11 bg-brand text-primary-foreground shadow-sm shadow-brand/20 hover:bg-brand/90">
                Selanjutnya
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isSubmitting}
                className="h-11 bg-brand text-primary-foreground shadow-sm shadow-brand/20 hover:bg-brand/90"
                onClick={() => {
                  void submitFinalStep()
                }}
              >
                {isSubmitting ? 'Menyimpan...' : submitLabel}
              </Button>
            )}
          </div>
        </div>

        <ProyekFormSummaryPanel
          namaProyek={namaProyek}
          jenisPekerjaan={jenisPekerjaan ?? ''}
          kategoriPekerjaan={kategoriPekerjaan}
          nilaiPenawaran={nilaiPenawaran}
          paguDana={paguDana}
          selectedDinas={selectedDinas}
          checklist={checklist}
        />
      </div>

      <ProyekDraftDialog
        open={showDraftDialog}
        drafts={drafts}
        onOpenChange={setShowDraftDialog}
        onResumeDraft={resumeDraft}
        onDeleteDraft={deleteDraft}
      />

      <ProyekOverrideDialog
        open={showOverrideDialog}
        onOpenChange={setShowOverrideDialog}
        warnings={warnings}
        alasanOverride={alasanOverride}
        fieldClassName={fi}
        onAlasanOverrideChange={setAlasanOverride}
        onConfirm={() => {
          void submitWithOverride()
        }}
      />
    </form>
  )
}
