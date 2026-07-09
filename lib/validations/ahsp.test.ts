import { describe, expect, it } from 'vitest'

import {
  validateAhspDetailPayload,
  validateAhspItemPayload,
  validateKategoriPayload,
  validateMasterHargaPayload,
  validateSatuanPayload,
} from '@/lib/validations/ahsp'

describe('validateAhspItemPayload', () => {
  it('normalizes a valid AHSP item payload', () => {
    const result = validateAhspItemPayload({
      kode_analisa: '  A.1 ',
      uraian_pekerjaan: '  Galian tanah manual ',
      kategori_id: 'kategori-1',
      satuan_id: 'satuan-1',
      bidang: 'SDA',
      sub_bidang: ' Irigasi ',
      profit_persen_default: '12,5',
    })

    expect(result).toEqual({
      ok: true,
      data: {
        kode_analisa: 'A.1',
        uraian_pekerjaan: 'Galian tanah manual',
        kategori_id: 'kategori-1',
        satuan_id: 'satuan-1',
        bidang: 'SDA',
        sub_bidang: 'Irigasi',
        profit_persen_default: 12.5,
      },
    })
  })

  it('rejects invalid AHSP item payloads with existing API messages', () => {
    expect(validateAhspItemPayload({ kode_analisa: 'A' })).toEqual({
      ok: false,
      message: 'Kode analisa minimal 2 karakter.',
    })

    expect(validateAhspItemPayload({
      kode_analisa: 'A.1',
      uraian_pekerjaan: 'Galian',
      kategori_id: 'kategori-1',
      satuan_id: 'satuan-1',
      profit_persen_default: -1,
    })).toEqual({
      ok: false,
      message: 'Profit default tidak boleh negatif.',
    })
  })
})

describe('validateMasterHargaPayload', () => {
  it('normalizes a valid master harga payload', () => {
    expect(validateMasterHargaPayload({
      kind: 'bahan',
      nama: '  Semen Portland ',
      satuan_id: 'zak',
      harga_dasar: '95.000',
    })).toEqual({
      ok: true,
      data: {
        kind: 'bahan',
        nama: 'Semen Portland',
        satuan_id: 'zak',
        harga_dasar: 95000,
      },
    })
  })

  it('rejects invalid master harga payloads', () => {
    expect(validateMasterHargaPayload({ kind: 'jasa' })).toEqual({
      ok: false,
      message: 'Jenis harga tidak valid.',
    })
  })
})

describe('validateAhspDetailPayload', () => {
  it('normalizes a valid AHSP detail payload', () => {
    expect(validateAhspDetailPayload({
      komponen_tipe: 'upah',
      komponen_id: 'upah-1',
      koefisien: '1,25',
    })).toEqual({
      ok: true,
      data: {
        komponen_tipe: 'upah',
        komponen_id: 'upah-1',
        koefisien: 1.25,
      },
    })
  })

  it('rejects non-positive coefficients', () => {
    expect(validateAhspDetailPayload({
      komponen_tipe: 'alat',
      komponen_id: 'alat-1',
      koefisien: 0,
    })).toEqual({
      ok: false,
      message: 'Koefisien harus lebih dari 0.',
    })
  })
})

describe('validateKategoriPayload', () => {
  it('normalizes valid category names', () => {
    expect(validateKategoriPayload({ nama_kategori: '  Pekerjaan Tanah ' })).toEqual({
      ok: true,
      data: { nama_kategori: 'Pekerjaan Tanah' },
    })
  })

  it('rejects short category names', () => {
    expect(validateKategoriPayload({ nama_kategori: 'A' })).toEqual({
      ok: false,
      message: 'Nama kategori minimal 2 karakter.',
    })
  })
})

describe('validateSatuanPayload', () => {
  it('normalizes valid unit names', () => {
    expect(validateSatuanPayload({ nama_satuan: ' m2 ' })).toEqual({
      ok: true,
      data: { nama_satuan: 'm2' },
    })
  })

  it('rejects empty unit names', () => {
    expect(validateSatuanPayload({ nama_satuan: ' ' })).toEqual({
      ok: false,
      message: 'Nama satuan wajib diisi.',
    })
  })
})
