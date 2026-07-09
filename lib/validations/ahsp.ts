import type { AhspComponentType, MasterHargaKind } from '@/lib/types/ahsp'
import { parseNumberInput } from '@/lib/utils'

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string }

export type AhspItemPayload = {
  kode_analisa: string
  uraian_pekerjaan: string
  kategori_id: string
  satuan_id: string
  bidang: 'CK' | 'SDA'
  sub_bidang: string | null
  profit_persen_default: number
}

export type MasterHargaPayload = {
  kind: MasterHargaKind
  nama: string
  satuan_id: string
  harga_dasar: number
}

export type AhspDetailPayload = {
  komponen_tipe: AhspComponentType
  komponen_id: string
  koefisien: number
}

export type KategoriPayload = {
  nama_kategori: string
}

export type SatuanPayload = {
  nama_satuan: string
}

type AhspItemInput = Partial<Record<keyof AhspItemPayload, unknown>>
type MasterHargaInput = Partial<Record<keyof MasterHargaPayload, unknown>>
type AhspDetailInput = Partial<Record<keyof AhspDetailPayload, unknown>>
type KategoriInput = Partial<Record<keyof KategoriPayload, unknown>>
type SatuanInput = Partial<Record<keyof SatuanPayload, unknown>>

function parseDecimal(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string' || !value) return 0
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function trimString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isHargaKind(value: unknown): value is MasterHargaKind {
  return value === 'upah' || value === 'bahan' || value === 'alat'
}

function isComponentType(value: unknown): value is AhspComponentType {
  return isHargaKind(value)
}

export function validateAhspItemPayload(input: AhspItemInput): ValidationResult<AhspItemPayload> {
  const kodeAnalisa = trimString(input.kode_analisa)
  const uraianPekerjaan = trimString(input.uraian_pekerjaan)
  const kategoriId = trimString(input.kategori_id)
  const satuanId = trimString(input.satuan_id)
  const bidang = input.bidang === 'SDA' ? 'SDA' : 'CK'
  const subBidang = trimString(input.sub_bidang) || null
  const profitPersenDefault = parseDecimal(input.profit_persen_default)

  if (!kodeAnalisa || kodeAnalisa.length < 2) {
    return { ok: false, message: 'Kode analisa minimal 2 karakter.' }
  }

  if (!uraianPekerjaan || uraianPekerjaan.length < 5) {
    return { ok: false, message: 'Uraian pekerjaan minimal 5 karakter.' }
  }

  if (!kategoriId) {
    return { ok: false, message: 'Kategori wajib dipilih.' }
  }

  if (!satuanId) {
    return { ok: false, message: 'Satuan wajib dipilih.' }
  }

  if (profitPersenDefault < 0) {
    return { ok: false, message: 'Profit default tidak boleh negatif.' }
  }

  return {
    ok: true,
    data: {
      kode_analisa: kodeAnalisa,
      uraian_pekerjaan: uraianPekerjaan,
      kategori_id: kategoriId,
      satuan_id: satuanId,
      bidang,
      sub_bidang: subBidang,
      profit_persen_default: profitPersenDefault,
    },
  }
}

export function validateMasterHargaPayload(input: MasterHargaInput): ValidationResult<MasterHargaPayload> {
  const nama = trimString(input.nama)
  const satuanId = trimString(input.satuan_id)
  const hargaDasar = parseNumberInput(input.harga_dasar as string | number | null | undefined)

  if (!isHargaKind(input.kind)) {
    return { ok: false, message: 'Jenis harga tidak valid.' }
  }

  if (!nama || nama.length < 2) {
    return { ok: false, message: 'Nama item minimal 2 karakter.' }
  }

  if (!satuanId) {
    return { ok: false, message: 'Satuan wajib dipilih.' }
  }

  if (hargaDasar < 0) {
    return { ok: false, message: 'Harga dasar tidak boleh negatif.' }
  }

  return {
    ok: true,
    data: {
      kind: input.kind,
      nama,
      satuan_id: satuanId,
      harga_dasar: hargaDasar,
    },
  }
}

export function validateAhspDetailPayload(input: AhspDetailInput): ValidationResult<AhspDetailPayload> {
  const komponenId = trimString(input.komponen_id)
  const koefisien = parseDecimal(input.koefisien)

  if (!isComponentType(input.komponen_tipe)) {
    return { ok: false, message: 'Jenis komponen tidak valid.' }
  }

  if (!komponenId) {
    return { ok: false, message: 'Komponen wajib dipilih.' }
  }

  if (koefisien <= 0) {
    return { ok: false, message: 'Koefisien harus lebih dari 0.' }
  }

  return {
    ok: true,
    data: {
      komponen_tipe: input.komponen_tipe,
      komponen_id: komponenId,
      koefisien,
    },
  }
}

export function validateKategoriPayload(input: KategoriInput): ValidationResult<KategoriPayload> {
  const namaKategori = trimString(input.nama_kategori)

  if (!namaKategori || namaKategori.length < 2) {
    return { ok: false, message: 'Nama kategori minimal 2 karakter.' }
  }

  return { ok: true, data: { nama_kategori: namaKategori } }
}

export function validateSatuanPayload(input: SatuanInput): ValidationResult<SatuanPayload> {
  const namaSatuan = trimString(input.nama_satuan)

  if (!namaSatuan || namaSatuan.length < 1) {
    return { ok: false, message: 'Nama satuan wajib diisi.' }
  }

  return { ok: true, data: { nama_satuan: namaSatuan } }
}
