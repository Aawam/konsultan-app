import { describe, expect, it } from 'vitest'

import {
  analyzeAhspImportRows,
  buildAhspImportPayload,
  previewAhspImportWorkbook,
} from '@/lib/ahsp-import'
import { createXlsxWorkbook } from '@/lib/simple-xlsx'

describe('analyzeAhspImportRows', () => {
  it('summarizes workbook rows and reports safe-import blockers', () => {
    const result = analyzeAhspImportRows({
      MASTER_UPAH: [
        ['No', 'Kode', 'Tenaga Kerja', 'Satuan', 'Harga Per Hari'],
        [1, 'L.01', 'Pekerja', 'OH', 176000],
      ],
      MASTER_BAHAN: [
        ['No', 'Bahan', 'Satuan', 'Harga Satuan'],
        [1, 'Pasir', 'm3', 250000],
      ],
      MASTER_ALAT: [
        ['No', 'Kode', 'Nama Alat', 'Satuan', 'Harga Satuan'],
        [1, 'AL.001', 'Dump Truck', 'jam', 300000],
      ],
      AHSP_ITEMS: [
        ['No', 'Kode Analisa', 'Uraian Pekerjaan', 'Kategori', 'Satuan'],
        [1, 'A.1', 'Galian tanah manual', 'Tanah', 'm3'],
        [2, 'A.1', 'Galian tanah duplikat', 'Tanah', 'm3'],
        [3, 'A.2', 'Urugan pasir', 'Tanah', 'm3'],
      ],
      AHSP_DETAILS: [
        ['No', 'Kode AHSP', 'Jenis', 'Uraian Komponen', 'Kode Komponen', 'Satuan', 'Koefisien'],
        [1, 'A.1', 'TENAGA', 'Pekerja', 'L.01', 'OH', 0.5],
        [2, 'A.3', 'BAHAN', 'Semen', '', 'zak', 1],
      ],
    })

    expect(result.totals).toEqual({
      masterUpah: 1,
      masterBahan: 1,
      masterAlat: 1,
      ahspItems: 3,
      ahspDetails: 2,
    })
    expect(result.duplicateAhspCodes).toEqual(['A.1'])
    expect(result.itemsWithoutDetails).toEqual(['A.2'])
    expect(result.detailsWithoutItem).toEqual(['A.3'])
    expect(result.missingComponentReferences).toEqual([
      { kodeAhsp: 'A.3', jenis: 'BAHAN', komponen: 'Semen' },
    ])
    expect(result.blockers).toContain('Ada Kode Analisa duplikat.')
    expect(result.canImport).toBe(false)
  })

  it('builds normalized payload rows for transactional import', () => {
    const { preview, payload } = buildAhspImportPayload({
      MASTER_UPAH: [
        ['No', 'Kode', 'Tenaga Kerja', 'Satuan', 'Harga Per Hari'],
        [1, 'L.01', 'Pekerja', 'OH', 176000],
      ],
      MASTER_BAHAN: [
        ['No', 'Bahan', 'Satuan', 'Harga Satuan'],
        [1, 'Pasir', 'm3', 250000],
      ],
      MASTER_ALAT: [
        ['No', 'Kode', 'Nama Alat', 'Satuan', 'Harga Satuan'],
        [1, 'AL.001', 'Dump Truck', 'jam', 300000],
      ],
      AHSP_ITEMS: [
        ['No', 'Kode Analisa', 'Uraian Pekerjaan', 'Kategori', 'Satuan', 'Bidang', 'Profit Default (%)'],
        [1, 'A.1', 'Galian tanah manual', 'Tanah', 'm3', 'CK', '10,5'],
      ],
      AHSP_DETAILS: [
        ['No', 'Kode AHSP', 'Jenis', 'Uraian Komponen', 'Kode Komponen', 'Satuan', 'Koefisien'],
        [1, 'A.1', 'TENAGA', 'Pekerja', 'L.01', 'OH', '0,5'],
      ],
    })

    expect(preview.blockers).toEqual([])
    expect(payload.satuan).toEqual(['jam', 'm3', 'OH'])
    expect(payload.kategori).toEqual(['Tanah'])
    expect(payload.ahspItems[0]).toMatchObject({
      kode_analisa: 'A.1',
      kategori: 'Tanah',
      satuan: 'm3',
      profit_persen_default: 10.5,
    })
    expect(payload.ahspDetails[0]).toMatchObject({
      kode_ahsp: 'A.1',
      komponen_tipe: 'upah',
      nama_komponen: 'Pekerja',
      koefisien: 0.5,
    })
  })
})

describe('previewAhspImportWorkbook', () => {
  it('parses xlsx buffers and returns an import preview', () => {
    const workbook = createXlsxWorkbook([
      {
        name: 'MASTER_UPAH',
        rows: [
          ['No', 'Kode', 'Tenaga Kerja', 'Satuan', 'Harga Per Hari'],
          [1, 'L.01', 'Pekerja', 'OH', 176000],
        ],
      },
      {
        name: 'MASTER_BAHAN',
        rows: [
          ['No', 'Bahan', 'Satuan', 'Harga Satuan'],
          [1, 'Pasir', 'm3', 250000],
        ],
      },
      {
        name: 'MASTER_ALAT',
        rows: [
          ['No', 'Kode', 'Nama Alat', 'Satuan', 'Harga Satuan'],
          [1, 'AL.001', 'Dump Truck', 'jam', 300000],
        ],
      },
      {
        name: 'AHSP_ITEMS',
        rows: [
          ['No', 'Kode Analisa', 'Uraian Pekerjaan', 'Kategori', 'Satuan'],
          [1, 'A.1', 'Galian tanah manual', 'Tanah', 'm3'],
        ],
      },
      {
        name: 'AHSP_DETAILS',
        rows: [
          ['No', 'Kode AHSP', 'Jenis', 'Uraian Komponen', 'Kode Komponen', 'Satuan', 'Koefisien'],
          [1, 'A.1', 'TENAGA', 'Pekerja', 'L.01', 'OH', 0.5],
        ],
      },
    ])

    expect(previewAhspImportWorkbook(workbook).totals.ahspItems).toBe(1)
    expect(previewAhspImportWorkbook(workbook).blockers).toEqual([])
  })
})
