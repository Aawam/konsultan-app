'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StepWizard } from '@/components/ui/step-wizard'
import { Textarea } from '@/components/ui/textarea'
import {
  FASE_PERENCANAAN,
  FASE_PENGAWASAN,
  KATEGORI_PEKERJAAN,
} from '@/lib/constants/proyek'
import type { DinasOption, Perusahaan, ProyekFormData } from '@/lib/types/proyek'
import { formatNumberInput, parseNumberInput } from '@/lib/utils'

const STEPS = ['Identitas', 'Anggaran', 'Pemberi Kerja', 'Pelaksanaan']
const NEW_DINAS_VALUE = '__new__'

const moneySchema = z
  .string()
  .trim()
  .min(1, 'Wajib diisi')
  .refine((value) => parseNumberInput(value) > 0, 'Nominal harus lebih dari 0')

const optionalMoneySchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || parseNumberInput(value) > 0, 'Nominal harus lebih dari 0')

const proyekFormSchema = z
  .object({
    id: z.string().optional(),
    nama_proyek: z.string().trim().min(3, 'Nama proyek minimal 3 karakter'),
    paket_pekerjaan_induk: z.string().trim().min(3, 'Paket pekerjaan induk wajib diisi'),
    nomor_kontrak: z.string().trim().optional(),
    jenis_pekerjaan: z.enum(['Perencanaan', 'Pengawasan'], {
      error: 'Jenis pekerjaan wajib dipilih',
    }),
    kategori_pekerjaan: z.enum(KATEGORI_PEKERJAAN, {
      error: 'Kategori pekerjaan wajib dipilih',
    }),
    tahun_anggaran: z.number().int().min(2000).max(2100),
    sumber_dana: z.enum(['APBD', 'APBD-Perubahan']),
    dinas: z.string().trim().min(2, 'Dinas wajib diisi'),
    lokasi_kecamatan: z.string().trim().min(2, 'Lokasi kecamatan wajib diisi'),
    nama_ppk: z.string().trim().optional(),
    pagu_dana: moneySchema,
    hps: optionalMoneySchema,
    nilai_penawaran: optionalMoneySchema,
    perusahaan_id: z.string().trim().min(1, 'Perusahaan wajib dipilih'),
    tanggal_mulai: z.string().optional(),
    tanggal_selesai: z.string().optional(),
    durasi_hari: z.string().optional(),
    tahap_progress: z.string().optional(),
    status_proyek: z.enum(['Work', 'Borrowed', 'Get Borrowed'], {
      error: 'Status bendera wajib dipilih',
    }),
    catatan: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tanggal_mulai && data.tanggal_selesai && data.tanggal_selesai <= data.tanggal_mulai) {
      ctx.addIssue({
        code: 'custom',
        path: ['tanggal_selesai'],
        message: 'Tanggal selesai harus setelah tanggal mulai',
      })
    }
  })

type ProyekFormValues = z.infer<typeof proyekFormSchema>

type Props = {
  perusahaanList: Perusahaan[]
  dinasList: DinasOption[]
  initialData?: ProyekFormData
  mode: 'create' | 'edit'
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return Date.UTC(year, month - 1, day)
}

function getDurasiHari(tanggalMulai: string, tanggalSelesai: string) {
  const mulai = parseDateInput(tanggalMulai)
  const selesai = parseDateInput(tanggalSelesai)
  if (mulai === null || selesai === null || selesai <= mulai) return null
  return Math.round((selesai - mulai) / 86400000)
}

function buildDefaultValues(
  initialData: ProyekFormData | undefined,
  defaultPerusahaanId: string
): Partial<ProyekFormValues> {
  return {
    id: initialData?.id,
    nama_proyek: initialData?.nama_proyek ?? '',
    paket_pekerjaan_induk: initialData?.paket_pekerjaan_induk ?? '',
    nomor_kontrak: initialData?.nomor_kontrak ?? '',
    jenis_pekerjaan: initialData?.jenis_pekerjaan || undefined,
    kategori_pekerjaan: initialData?.kategori_pekerjaan as ProyekFormValues['kategori_pekerjaan'] | undefined,
    tahun_anggaran: initialData?.tahun_anggaran ?? new Date().getFullYear(),
    sumber_dana: initialData?.sumber_dana ?? 'APBD',
    dinas: initialData?.dinas ?? '',
    lokasi_kecamatan: initialData?.lokasi_kecamatan ?? '',
    nama_ppk: initialData?.nama_ppk ?? '',
    pagu_dana: formatNumberInput(initialData?.pagu_dana ?? ''),
    hps: formatNumberInput(initialData?.hps ?? ''),
    nilai_penawaran: formatNumberInput(initialData?.nilai_penawaran ?? ''),
    perusahaan_id: initialData?.perusahaan_id ?? defaultPerusahaanId,
    tanggal_mulai: initialData?.tanggal_mulai ?? '',
    tanggal_selesai: initialData?.tanggal_selesai ?? '',
    durasi_hari: initialData?.durasi_hari ?? '',
    tahap_progress: initialData?.tahap_progress ?? '',
    status_proyek: initialData?.status_proyek || undefined,
    catatan: initialData?.catatan ?? '',
  }
}

function asPayload(values: ProyekFormValues): ProyekFormData {
  return {
    ...values,
    nomor_kontrak: values.nomor_kontrak ?? '',
    nama_ppk: values.nama_ppk ?? '',
    tanggal_mulai: values.tanggal_mulai ?? '',
    tanggal_selesai: values.tanggal_selesai ?? '',
    durasi_hari: values.durasi_hari ?? '',
    tahap_progress: values.tahap_progress ?? '',
    catatan: values.catatan ?? '',
  }
}

export function ProyekFormShell({ perusahaanList, dinasList, initialData, mode }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [warnings, setWarnings] = useState<string[]>([])
  const [showOverrideDialog, setShowOverrideDialog] = useState(false)
  const [alasanOverride, setAlasanOverride] = useState('')
  const [durasiManuallyEdited, setDurasiManuallyEdited] = useState(false)

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
    setValue,
    trigger,
  } = form

  const [jenisPekerjaan, selectedDinas = '', tanggalMulai = '', tanggalSelesai = ''] = useWatch({
    control,
    name: ['jenis_pekerjaan', 'dinas', 'tanggal_mulai', 'tanggal_selesai'],
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

    const valid = await trigger(fieldsByStep[currentStep], { shouldFocus: true })
    if (!valid) toast.error('Periksa kembali field yang wajib diisi')
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

  const submitToApi = async (values: ProyekFormValues, alasan?: string) => {
    const endpoint = mode === 'edit' && values.id ? `/api/proyek/${values.id}` : '/api/proyek'
    const res = await fetch(endpoint, {
      method: mode === 'edit' ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asPayload(values)),
    })
    const json = (await res.json()) as { data?: { id: string }; error?: string }

    if (!res.ok || json.error || !json.data) {
      toast.error(`Gagal menyimpan: ${json.error ?? 'Terjadi kesalahan'}`)
      return
    }

    if (alasan) {
      const overrideRes = await fetch(`/api/proyek/${json.data.id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warnings, alasan }),
      })
      const overrideJson = (await overrideRes.json()) as { error?: string }

      if (!overrideRes.ok || overrideJson.error) {
        toast.error(`Gagal menyimpan override: ${overrideJson.error ?? 'Terjadi kesalahan'}`)
        return
      }
    }

    toast.success(mode === 'edit' ? 'Proyek berhasil diperbarui' : 'Proyek berhasil ditambahkan')
    router.push(mode === 'edit' && values.id ? `/proyek/${values.id}` : '/proyek')
    router.refresh()
  }

  const submitFinalStep = handleSubmit(async (values) => {
    const nextWarnings = validateWarnings()
    if (nextWarnings.length > 0) {
      setShowOverrideDialog(true)
      return
    }

    await submitToApi(values)
  })

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

  const fi = 'field-input'
  const submitLabel = mode === 'edit' ? 'Perbarui Proyek' : 'Simpan Proyek'

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
      className="mx-auto max-w-3xl space-y-6"
    >
      <StepWizard steps={STEPS} currentStep={step} />

      {step === 1 && (
        <div className="section-card">
          <div className="section-header">
            <p className="section-title">Identitas Proyek</p>
          </div>
          <FieldGroup className="section-body grid-cols-1 gap-4 md:grid-cols-2">
            <Field className="md:col-span-2" data-invalid={Boolean(errors.nama_proyek)}>
              <FieldLabel htmlFor="nama_proyek">Nama Proyek *</FieldLabel>
              <Input
                id="nama_proyek"
                className={fi}
                aria-invalid={Boolean(errors.nama_proyek)}
                placeholder="Contoh: Perencanaan Teknis Pembangunan ..."
                {...register('nama_proyek')}
              />
              <FieldError errors={[errors.nama_proyek]} />
            </Field>

            <Field className="md:col-span-2" data-invalid={Boolean(errors.paket_pekerjaan_induk)}>
              <FieldLabel htmlFor="paket_pekerjaan_induk">Paket Pekerjaan Induk *</FieldLabel>
              <Input
                id="paket_pekerjaan_induk"
                className={fi}
                aria-invalid={Boolean(errors.paket_pekerjaan_induk)}
                placeholder="Nama paket fisik induk"
                {...register('paket_pekerjaan_induk')}
              />
              <FieldError errors={[errors.paket_pekerjaan_induk]} />
            </Field>

            <Field className="md:col-span-2" data-invalid={Boolean(errors.nomor_kontrak)}>
              <FieldLabel htmlFor="nomor_kontrak">Nomor Kontrak</FieldLabel>
              <Input
                id="nomor_kontrak"
                className={fi}
                aria-invalid={Boolean(errors.nomor_kontrak)}
                placeholder="Opsional"
                {...register('nomor_kontrak')}
              />
              <FieldError errors={[errors.nomor_kontrak]} />
            </Field>

            <Field data-invalid={Boolean(errors.jenis_pekerjaan)}>
              <FieldLabel>Jenis Pekerjaan *</FieldLabel>
              <Controller
                control={control}
                name="jenis_pekerjaan"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fi} aria-invalid={Boolean(errors.jenis_pekerjaan)}>
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent className="select-content">
                      <SelectItem value="Perencanaan" className="select-item">
                        Perencanaan
                      </SelectItem>
                      <SelectItem value="Pengawasan" className="select-item">
                        Pengawasan
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.jenis_pekerjaan]} />
            </Field>

            <Field data-invalid={Boolean(errors.kategori_pekerjaan)}>
              <FieldLabel>Kategori Pekerjaan *</FieldLabel>
              <Controller
                control={control}
                name="kategori_pekerjaan"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fi} aria-invalid={Boolean(errors.kategori_pekerjaan)}>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent className="select-content">
                      {KATEGORI_PEKERJAAN.map((kategori) => (
                        <SelectItem key={kategori} value={kategori} className="select-item">
                          {kategori}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.kategori_pekerjaan]} />
            </Field>
          </FieldGroup>
        </div>
      )}

      {step === 2 && (
        <div className="section-card">
          <div className="section-header">
            <p className="section-title">Anggaran</p>
          </div>
          <FieldGroup className="section-body grid-cols-1 gap-4 md:grid-cols-2">
            <Field data-invalid={Boolean(errors.tahun_anggaran)}>
              <FieldLabel htmlFor="tahun_anggaran">Tahun Anggaran *</FieldLabel>
              <Input
                id="tahun_anggaran"
                className={fi}
                type="number"
                aria-invalid={Boolean(errors.tahun_anggaran)}
                {...register('tahun_anggaran', { valueAsNumber: true })}
              />
              <FieldError errors={[errors.tahun_anggaran]} />
            </Field>

            <Field data-invalid={Boolean(errors.sumber_dana)}>
              <FieldLabel>Sumber Dana *</FieldLabel>
              <Controller
                control={control}
                name="sumber_dana"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fi} aria-invalid={Boolean(errors.sumber_dana)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="select-content">
                      <SelectItem value="APBD" className="select-item">
                        APBD
                      </SelectItem>
                      <SelectItem value="APBD-Perubahan" className="select-item">
                        APBD-Perubahan
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.sumber_dana]} />
            </Field>

            <Field data-invalid={Boolean(errors.pagu_dana)}>
              <FieldLabel htmlFor="pagu_dana">Pagu Dana (Rp) *</FieldLabel>
              <Input
                id="pagu_dana"
                className={fi}
                inputMode="numeric"
                aria-invalid={Boolean(errors.pagu_dana)}
                placeholder="Contoh: 50.000.000"
                {...register('pagu_dana', {
                  onChange: (event) => handleMoneyChange('pagu_dana', event.target.value),
                  onBlur: validateWarnings,
                })}
              />
              <FieldError errors={[errors.pagu_dana]} />
            </Field>

            <Field data-invalid={Boolean(errors.hps)}>
              <FieldLabel htmlFor="hps">HPS (Rp)</FieldLabel>
              <Input
                id="hps"
                className={fi}
                inputMode="numeric"
                aria-invalid={Boolean(errors.hps)}
                placeholder="Opsional"
                {...register('hps', {
                  onChange: (event) => handleMoneyChange('hps', event.target.value),
                  onBlur: validateWarnings,
                })}
              />
              <FieldError errors={[errors.hps]} />
            </Field>

            <Field className="md:col-span-2" data-invalid={Boolean(errors.nilai_penawaran)}>
              <FieldLabel htmlFor="nilai_penawaran">Nilai Penawaran / Kontrak (Rp)</FieldLabel>
              <Input
                id="nilai_penawaran"
                className={fi}
                inputMode="numeric"
                aria-invalid={Boolean(errors.nilai_penawaran)}
                placeholder="Opsional"
                {...register('nilai_penawaran', {
                  onChange: (event) => handleMoneyChange('nilai_penawaran', event.target.value),
                  onBlur: validateWarnings,
                })}
              />
              <FieldError errors={[errors.nilai_penawaran]} />
            </Field>
          </FieldGroup>
        </div>
      )}

      {step === 3 && (
        <div className="section-card">
          <div className="section-header">
            <p className="section-title">Pemberi Kerja</p>
          </div>
          <FieldGroup className="section-body grid-cols-1 gap-4 md:grid-cols-2">
            <Field data-invalid={Boolean(errors.dinas)}>
              <FieldLabel>Dinas *</FieldLabel>
              <Controller
                control={control}
                name="dinas"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Select
                      value={isCustomDinas ? NEW_DINAS_VALUE : field.value || undefined}
                      onValueChange={(value) => {
                        if (value === NEW_DINAS_VALUE) {
                          setIsCustomDinas(true)
                          if (normalizedDinasList.includes(field.value)) field.onChange('')
                          return
                        }
                        setIsCustomDinas(false)
                        field.onChange(value)
                      }}
                    >
                      <SelectTrigger className={fi} aria-invalid={Boolean(errors.dinas)}>
                        <SelectValue placeholder="Pilih dinas" />
                      </SelectTrigger>
                      <SelectContent className="select-content">
                        {normalizedDinasList.map((dinas) => (
                          <SelectItem key={dinas} value={dinas} className="select-item">
                            {dinas}
                          </SelectItem>
                        ))}
                        <SelectItem value={NEW_DINAS_VALUE} className="select-item">
                          + Tambah dinas baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {isCustomDinas && (
                      <Input
                        className={fi}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Ketik nama dinas baru"
                      />
                    )}
                  </div>
                )}
              />
              <FieldError errors={[errors.dinas]} />
            </Field>

            <Field data-invalid={Boolean(errors.lokasi_kecamatan)}>
              <FieldLabel htmlFor="lokasi_kecamatan">Lokasi Kecamatan *</FieldLabel>
              <Input
                id="lokasi_kecamatan"
                className={fi}
                aria-invalid={Boolean(errors.lokasi_kecamatan)}
                {...register('lokasi_kecamatan')}
              />
              <FieldError errors={[errors.lokasi_kecamatan]} />
            </Field>

            <Field className="md:col-span-2" data-invalid={Boolean(errors.nama_ppk)}>
              <FieldLabel htmlFor="nama_ppk">Nama PPK</FieldLabel>
              <Input
                id="nama_ppk"
                className={fi}
                aria-invalid={Boolean(errors.nama_ppk)}
                placeholder="Opsional"
                {...register('nama_ppk')}
              />
              <FieldError errors={[errors.nama_ppk]} />
            </Field>
          </FieldGroup>
        </div>
      )}

      {step === 4 && (
        <div className="section-card">
          <div className="section-header">
            <p className="section-title">Pelaksanaan</p>
          </div>
          <FieldGroup className="section-body grid-cols-1 gap-4 md:grid-cols-2">
            <Field className="md:col-span-2" data-invalid={Boolean(errors.perusahaan_id)}>
              <FieldLabel>Perusahaan (Bendera) *</FieldLabel>
              <Controller
                control={control}
                name="perusahaan_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fi} aria-invalid={Boolean(errors.perusahaan_id)}>
                      <SelectValue placeholder="Pilih perusahaan" />
                    </SelectTrigger>
                    <SelectContent className="select-content">
                      {perusahaanList.map((perusahaan) => (
                        <SelectItem key={perusahaan.id} value={perusahaan.id} className="select-item">
                          {perusahaan.nama_perusahaan}
                          {perusahaan.adalah_perusahaan_sendiri && ' *'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.perusahaan_id]} />
            </Field>

            <Field className="md:col-span-2" data-invalid={Boolean(errors.status_proyek)}>
              <FieldLabel>Status Bendera *</FieldLabel>
              <Controller
                control={control}
                name="status_proyek"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fi} aria-invalid={Boolean(errors.status_proyek)}>
                      <SelectValue placeholder="Pilih status bendera" />
                    </SelectTrigger>
                    <SelectContent className="select-content">
                      <SelectItem value="Work" className="select-item">
                        Work - Proyek milik sendiri
                      </SelectItem>
                      <SelectItem value="Borrowed" className="select-item">
                        Borrowed - Bendera dipinjam pihak lain
                      </SelectItem>
                      <SelectItem value="Get Borrowed" className="select-item">
                        Get Borrowed - Pinjam bendera perusahaan lain
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.status_proyek]} />
            </Field>

            <Field data-invalid={Boolean(errors.tanggal_mulai)}>
              <FieldLabel htmlFor="tanggal_mulai">Tanggal Mulai</FieldLabel>
              <Input
                id="tanggal_mulai"
                className={fi}
                type="date"
                aria-invalid={Boolean(errors.tanggal_mulai)}
                {...register('tanggal_mulai', { onBlur: validateWarnings })}
              />
              <FieldError errors={[errors.tanggal_mulai]} />
            </Field>

            <Field data-invalid={Boolean(errors.durasi_hari)}>
              <FieldLabel htmlFor="durasi_hari">Durasi (Hari)</FieldLabel>
              <Input
                id="durasi_hari"
                className={fi}
                type="number"
                aria-invalid={Boolean(errors.durasi_hari)}
                placeholder="Otomatis dari tanggal, bisa diubah manual"
                {...register('durasi_hari', {
                  onChange: (event) => {
                    setDurasiManuallyEdited(Boolean(event.target.value))
                  },
                })}
              />
              <FieldError errors={[errors.durasi_hari]} />
            </Field>

            <Field data-invalid={Boolean(errors.tanggal_selesai)}>
              <FieldLabel htmlFor="tanggal_selesai">Tanggal Selesai</FieldLabel>
              <Input
                id="tanggal_selesai"
                className={fi}
                type="date"
                aria-invalid={Boolean(errors.tanggal_selesai)}
                {...register('tanggal_selesai', { onBlur: validateWarnings })}
              />
              <FieldError errors={[errors.tanggal_selesai]} />
            </Field>

            <Field className="md:col-span-2" data-invalid={Boolean(errors.tahap_progress)}>
              <FieldLabel>Tahap Progress</FieldLabel>
              <Controller
                control={control}
                name="tahap_progress"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!jenisPekerjaan}>
                    <SelectTrigger className={fi} aria-invalid={Boolean(errors.tahap_progress)}>
                      <SelectValue placeholder={jenisPekerjaan ? 'Pilih tahap' : 'Pilih jenis pekerjaan dulu'} />
                    </SelectTrigger>
                    <SelectContent className="select-content">
                      {faseList.map((fase) => (
                        <SelectItem key={fase.label} value={fase.label} className="select-item">
                          {fase.label} ({fase.persentase}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.tahap_progress]} />
            </Field>

            <Field className="md:col-span-2" data-invalid={Boolean(errors.catatan)}>
              <FieldLabel htmlFor="catatan">Catatan</FieldLabel>
              <Textarea
                id="catatan"
                className={fi}
                aria-invalid={Boolean(errors.catatan)}
                placeholder="Catatan tambahan (opsional)"
                rows={3}
                {...register('catatan')}
              />
              <FieldError errors={[errors.catatan]} />
            </Field>
          </FieldGroup>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-1 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          {warnings.map((warning) => (
            <p key={warning} className="text-sm text-amber-700 dark:text-amber-300">
              Peringatan: {warning}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={prev} disabled={step === 1}>
          Sebelumnya
        </Button>

        {step < STEPS.length ? (
          <Button type="button" onClick={next}>
            Selanjutnya
          </Button>
        ) : (
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              void submitFinalStep()
            }}
          >
            {isSubmitting ? 'Menyimpan...' : submitLabel}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={showOverrideDialog}
        onOpenChange={setShowOverrideDialog}
        title="Ada pelanggaran aturan"
        confirmLabel="Simpan dengan Override"
        confirmClassName="bg-amber-500/15 text-amber-700 border border-amber-500/20 hover:bg-amber-500/25 dark:text-amber-300"
        onConfirm={() => {
          void submitWithOverride()
        }}
      >
        {warnings.map((warning) => (
          <p key={warning} className="text-sm text-amber-700 dark:text-amber-300">
            Peringatan: {warning}
          </p>
        ))}
        <Field className="pt-2">
          <FieldLabel htmlFor="alasan_override">Alasan override *</FieldLabel>
          <Textarea
            id="alasan_override"
            className={fi}
            value={alasanOverride}
            onChange={(event) => setAlasanOverride(event.target.value)}
            placeholder="Jelaskan alasan penyimpangan ini..."
            rows={3}
          />
        </Field>
      </ConfirmDialog>
    </form>
  )
}
