import { z } from 'zod'
import { KATEGORI_PEKERJAAN } from '@/lib/constants/proyek'

export const proyekSchema = z.object({
  nama_proyek:          z.string().min(3, 'Nama proyek minimal 3 karakter'),
  paket_pekerjaan_induk: z.string().min(3, 'Paket pekerjaan induk wajib diisi'),
  jenis_pekerjaan:      z.enum(['Perencanaan', 'Pengawasan']),
  kategori_pekerjaan:   z.enum(KATEGORI_PEKERJAAN),
  tahun_anggaran:       z.number().int().min(2000).max(2100),
  sumber_dana:          z.enum(['APBD', 'APBD-Perubahan']),
  dinas:                z.string().min(2, 'Dinas wajib diisi'),
  lokasi_kecamatan:     z.string().min(2, 'Lokasi kecamatan wajib diisi'),
  nama_ppk:             z.string().min(3, 'Nama PPK wajib diisi'),
  pagu_dana:            z.number().positive('Pagu dana harus lebih dari 0'),
  hps:                  z.number().positive().nullable().optional(),
  nilai_penawaran:      z.number().positive().nullable().optional(),
  perusahaan_id:        z.string().min(1, 'Perusahaan wajib dipilih'),
  tanggal_mulai:        z.string().nullable().optional(),
  tanggal_selesai:      z.string().nullable().optional(),
  tahap_progress:       z.string().nullable().optional(),
  status_proyek:        z.enum(['Work', 'Borrowed', 'Get Borrowed']).nullable().optional(),
  catatan:              z.string().nullable().optional(),
  durasi_hari:          z.coerce.number().min(1, "Durasi hari harus diisi"),
})

export type ProyekSchemaInput = z.infer<typeof proyekSchema>
