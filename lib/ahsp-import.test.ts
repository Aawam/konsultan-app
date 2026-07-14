import { describe, expect, it } from 'vitest'

import { analyzeAhspImportRows, previewAhspImportWorkbook } from '@/lib/ahsp-import'
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
        ['No', 'Kode Analisa', 'Uraian Pekerjaan'],
        [1, 'A.1', 'Galian tanah manual'],
        [2, 'A.1', 'Galian tanah duplikat'],
        [3, 'A.2', 'Urugan pasir'],
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
    expect(result.warnings).toContain('Workbook belum punya kolom eksplisit untuk kategori output dan satuan output AHSP.')
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
          ['No', 'Kode Analisa', 'Uraian Pekerjaan'],
          [1, 'A.1', 'Galian tanah manual'],
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
