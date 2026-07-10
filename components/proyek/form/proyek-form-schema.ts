import { z } from 'zod'

import { KATEGORI_PEKERJAAN } from '@/lib/constants/proyek'
import type { ProyekFormData } from '@/lib/types/proyek'
import { formatNumberInput, parseNumberInput } from '@/lib/utils'

export const STEPS = ['Identitas', 'Anggaran', 'Pemberi Kerja', 'Pelaksanaan']
export const NEW_DINAS_VALUE = '__new__'
export const DRAFTS_STORAGE_KEY = 'konsultan-app:proyek-drafts'

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

export const proyekFormSchema = z
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

export type ProyekFormValues = z.infer<typeof proyekFormSchema>

export type LocalProjectDraft = {
  id: string
  updatedAt: string
  data: Partial<ProyekFormValues>
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return Date.UTC(year, month - 1, day)
}

export function getDurasiHari(tanggalMulai: string, tanggalSelesai: string) {
  const mulai = parseDateInput(tanggalMulai)
  const selesai = parseDateInput(tanggalSelesai)
  if (mulai === null || selesai === null || selesai <= mulai) return null
  return Math.round((selesai - mulai) / 86400000)
}

export function buildDefaultValues(
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

export function asPayload(values: ProyekFormValues): ProyekFormData {
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

export function readLocalDrafts() {
  if (typeof window === 'undefined') return []

  const rawDrafts = window.localStorage.getItem(DRAFTS_STORAGE_KEY)
  if (!rawDrafts) return []

  try {
    const parsed = JSON.parse(rawDrafts) as LocalProjectDraft[]
    return Array.isArray(parsed)
      ? parsed
          .filter((draft) => draft.id && draft.updatedAt && draft.data)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      : []
  } catch {
    window.localStorage.removeItem(DRAFTS_STORAGE_KEY)
    return []
  }
}
