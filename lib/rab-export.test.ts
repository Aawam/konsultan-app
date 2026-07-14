import { describe, expect, it } from 'vitest'

import { buildRabExportFilename, buildRabExportSheets, createRabXlsx } from '@/lib/rab-export'
import type { XlsxRow } from '@/lib/simple-xlsx'
import type { RabMakerSnapshot } from '@/lib/types/ahsp'
import type { ProyekDetail } from '@/lib/types/proyek'

const project = {
  id: 'project-1',
  nama_proyek: 'Perencanaan Drainase Pasar Baru',
  paket_pekerjaan_induk: null,
  nomor_kontrak: null,
  jenis_pekerjaan: 'Perencanaan',
  kategori_pekerjaan: 'SDA',
  tahun_anggaran: 2026,
  sumber_dana: 'APBD',
  dinas: 'Dinas PUPR',
  lokasi_kecamatan: 'Tanjung Redeb',
  nama_ppk: 'PPK',
  pagu_dana: null,
  hps: null,
  nilai_penawaran: null,
  perusahaan_id: 'company-1',
  tanggal_mulai: '2026-01-01',
  tanggal_selesai: '2026-02-01',
  durasi_hari: 30,
  tahap_progress: 'Penyusunan Laporan Akhir & RAB',
  persentase_progress: 80,
  pernah_dioverride: false,
  status_proyek: 'Work',
  jalur_masuk: 'manual',
  catatan: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  is_deleted: false,
  perusahaan: null,
} satisfies ProyekDetail

const snapshot = {
  maker: {
    id: 'maker-1',
    proyek_id: 'project-1',
    status: 'draft',
    ppn_persen: 11,
    subtotal: 100000,
    ppn_nilai: 11000,
    total_final: 111000,
    updated_at: '2026-01-01',
  },
  items: [
    {
      id: 'item-1',
      rab_maker_id: 'maker-1',
      source_ahsp_item_id: 'ahsp-1',
      kode_analisa_snapshot: '1.1',
      uraian_pekerjaan_snapshot: 'Galian tanah',
      bidang_snapshot: 'SDA',
      sub_bidang_snapshot: 'Drainase',
      kategori_snapshot: 'Pekerjaan Tanah',
      satuan_snapshot: 'm3',
      volume: 10,
      profit_persen_default: 10,
      profit_persen_final: 10,
      profit_override_reason: null,
      harga_dasar_total: 9000,
      profit_nilai: 900,
      harga_satuan: 9900,
      jumlah_harga: 99000,
      koefisien_locked: true,
      urutan: 1,
    },
    {
      id: 'item-2',
      rab_maker_id: 'maker-1',
      source_ahsp_item_id: 'ahsp-2',
      kode_analisa_snapshot: '1.2',
      uraian_pekerjaan_snapshot: 'Urugan pasir',
      bidang_snapshot: 'SDA',
      sub_bidang_snapshot: 'Drainase',
      kategori_snapshot: 'Pekerjaan Tanah',
      satuan_snapshot: 'm3',
      volume: 2,
      profit_persen_default: 10,
      profit_persen_final: 12,
      profit_override_reason: 'Lokasi jauh',
      harga_dasar_total: 50000,
      profit_nilai: 6000,
      harga_satuan: 56000,
      jumlah_harga: 112000,
      koefisien_locked: true,
      urutan: 2,
    },
    {
      id: 'item-3',
      rab_maker_id: 'maker-1',
      source_ahsp_item_id: 'ahsp-3',
      kode_analisa_snapshot: '2.1',
      uraian_pekerjaan_snapshot: 'Beton mutu sedang',
      bidang_snapshot: 'CK',
      sub_bidang_snapshot: 'Struktur',
      kategori_snapshot: 'Pekerjaan Beton',
      satuan_snapshot: 'm3',
      volume: 1,
      profit_persen_default: 10,
      profit_persen_final: 10,
      profit_override_reason: null,
      harga_dasar_total: 100000,
      profit_nilai: 10000,
      harga_satuan: 110000,
      jumlah_harga: 110000,
      koefisien_locked: true,
      urutan: 3,
    },
  ],
  detailsByItem: {
    'item-1': [
      {
        id: 'detail-1',
        rab_maker_item_id: 'item-1',
        komponen_tipe: 'upah',
        nama_komponen_snapshot: 'Pekerja',
        satuan_snapshot: 'OH',
        koefisien_snapshot: 0.5,
        koefisien_locked: true,
        harga_dasar_default: 100000,
        harga_dasar_final: 100000,
        harga_override_reason: null,
        jumlah_harga_dasar: 50000,
        urutan: 1,
      },
    ],
    'item-2': [
      {
        id: 'detail-2',
        rab_maker_item_id: 'item-2',
        komponen_tipe: 'bahan',
        nama_komponen_snapshot: 'Pasir urug',
        satuan_snapshot: 'm3',
        koefisien_snapshot: 1.2,
        koefisien_locked: true,
        harga_dasar_default: 200000,
        harga_dasar_final: 210000,
        harga_override_reason: 'Harga lokal',
        jumlah_harga_dasar: 252000,
        urutan: 1,
      },
      {
        id: 'detail-3',
        rab_maker_item_id: 'item-2',
        komponen_tipe: 'alat',
        nama_komponen_snapshot: 'Dump Truck',
        satuan_snapshot: 'jam',
        koefisien_snapshot: 0.25,
        koefisien_locked: true,
        harga_dasar_default: 300000,
        harga_dasar_final: 300000,
        harga_override_reason: null,
        jumlah_harga_dasar: 75000,
        urutan: 2,
      },
    ],
    'item-3': [
      {
        id: 'detail-4',
        rab_maker_item_id: 'item-3',
        komponen_tipe: 'bahan',
        nama_komponen_snapshot: 'Semen portland',
        satuan_snapshot: 'kg',
        koefisien_snapshot: 30,
        koefisien_locked: true,
        harga_dasar_default: 1800,
        harga_dasar_final: 1800,
        harga_override_reason: null,
        jumlah_harga_dasar: 54000,
        urutan: 1,
      },
    ],
  },
} satisfies RabMakerSnapshot

function rowValues(row: XlsxRow) {
  return row.map((cell) => {
    if (cell !== null && typeof cell === 'object' && 'value' in cell) {
      return cell.value
    }

    return cell
  })
}

function sheetValues(sheet: { rows: XlsxRow[] }) {
  return sheet.rows.map(rowValues)
}

function cellStyle(row: XlsxRow, index: number) {
  const cell = row[index]
  if (cell !== null && typeof cell === 'object' && 'style' in cell) {
    return cell.style
  }

  return undefined
}

function cellFormula(row: XlsxRow, index: number) {
  const cell = row[index]
  if (cell !== null && typeof cell === 'object' && 'formula' in cell) {
    return cell.formula
  }

  return undefined
}

describe('buildRabExportFilename', () => {
  it('creates a safe xlsx filename', () => {
    expect(buildRabExportFilename(project)).toBe('rab-perencanaan-drainase-pasar-baru-2026.xlsx')
  })
})

describe('buildRabExportSheets', () => {
  it('builds rekap, RAB, and detail sheets from a snapshot', () => {
    const sheets = buildRabExportSheets(project, snapshot)

    expect(sheets.map((sheet) => sheet.name)).toEqual([
      'Rekap',
      'RAB',
      'Rekap AHSP',
      'Pekerjaan Tanah',
      'Pekerjaan Beton',
      'Harga',
    ])

    expect(sheetValues(sheets[0])).toContainEqual(['Subtotal', 100000])
    expect(sheetValues(sheets[1])).toContainEqual(['Pekerjaan Tanah', '', '', '', '', '', '', '', ''])
    expect(sheetValues(sheets[1])).toContainEqual([1, '1.1', 'Galian tanah', 'm3', 10, 9000, 10, 9900, 99000])
    expect(sheetValues(sheets[2])).toContainEqual(['Pekerjaan Tanah', '', '', '', 2, 211000])
    expect(sheetValues(sheets[3])).toContainEqual(['A', 'TENAGA KERJA', '', '', '', '', '', '', ''])
    expect(sheetValues(sheets[3])).toContainEqual([1, 'Pekerja', '', 'OH', 0.5, 100000, 50000, '', ''])
    expect(sheetValues(sheets[3])).toContainEqual(['JUMLAH HARGA BAHAN', '', '', '', '', '', 252000, '', ''])
    expect(sheetValues(sheets[4])).toContainEqual(['2.1', 'Beton mutu sedang', '', '', '', '', '', 'Harga Satuan Final', 110000])
    expect(sheetValues(sheets[5])).toContainEqual(['UPAH', '', '', '', '', '', '', ''])
    expect(sheetValues(sheets[5])).toContainEqual(['upah', 1, 'Pekerja', 'OH', 100000, 100000, '1.1', 1])
    expect(sheetValues(sheets[5])).toContainEqual(['BAHAN', '', '', '', '', '', '', ''])
    expect(sheetValues(sheets[5])).toContainEqual(['bahan', 1, 'Pasir urug', 'm3', 200000, 210000, '1.2', 1])
    expect(sheetValues(sheets[5])).toContainEqual(['ALAT', '', '', '', '', '', '', ''])
    expect(sheetValues(sheets[5])).toContainEqual(['alat', 1, 'Dump Truck', 'jam', 300000, 300000, '1.2', 1])

    expect(sheets[1].merges).toEqual(['A1:I1'])
    expect(sheets[1].freezePane).toEqual({ ySplit: 3, topLeftCell: 'A4' })
    expect(sheets[1].columns?.[2]).toEqual({ width: 42 })
    expect(sheets[2].merges).toEqual(['A1:F1'])
    expect(sheets[2].columns).toHaveLength(6)
    expect(sheets[5].merges).toEqual(['A1:H1'])

    const rabItemRow = sheets[1].rows.find((row) => rowValues(row)[1] === '1.1')
    expect(rabItemRow).toBeDefined()
    const rabItemRowNumber = sheets[1].rows.indexOf(rabItemRow!) + 1
    expect(cellStyle(rabItemRow!, 0)).toBe('number')
    expect(cellStyle(rabItemRow!, 4)).toBe('volume')
    expect(cellFormula(rabItemRow!, 7)).toMatch(/^'Pekerjaan Tanah'!\$G\$\d+$/)
    expect(cellFormula(rabItemRow!, 8)).toBe(`E${rabItemRowNumber}*H${rabItemRowNumber}`)

    const ahspDetailRow = sheets[3].rows.find((row) => rowValues(row)[1] === 'Pekerja')
    expect(ahspDetailRow).toBeDefined()
    const ahspDetailRowNumber = sheets[3].rows.indexOf(ahspDetailRow!) + 1
    expect(cellStyle(ahspDetailRow!, 0)).toBe('number')
    expect(cellStyle(ahspDetailRow!, 4)).toBe('decimal')
    expect(cellFormula(ahspDetailRow!, 6)).toBe(`E${ahspDetailRowNumber}*F${ahspDetailRowNumber}`)

    const ahspProfitRow = sheets[3].rows.find((row) => rowValues(row)[0] === 'PROFIT/OH')
    expect(ahspProfitRow).toBeDefined()
    const ahspProfitRowNumber = sheets[3].rows.indexOf(ahspProfitRow!) + 1
    expect(cellStyle(ahspProfitRow!, 5)).toBe('number')
    expect(cellFormula(ahspProfitRow!, 6)).toBe(`G${ahspProfitRowNumber - 1}*F${ahspProfitRowNumber}/100`)

    const ahspFinalRow = sheets[3].rows.find((row) => rowValues(row)[0] === 'HARGA SATUAN PEKERJAAN')
    expect(ahspFinalRow).toBeDefined()
    const ahspFinalRowNumber = sheets[3].rows.indexOf(ahspFinalRow!) + 1
    expect(cellFormula(ahspFinalRow!, 6)).toBe(`G${ahspFinalRowNumber - 2}+G${ahspFinalRowNumber - 1}`)

    const rekapAhspItemRow = sheets[2].rows.find((row) => rowValues(row)[0] === '1.1')
    expect(rekapAhspItemRow).toBeDefined()
    const rekapAhspItemRowNumber = sheets[2].rows.indexOf(rekapAhspItemRow!) + 1
    expect(cellFormula(rekapAhspItemRow!, 2)).toBe(`'RAB'!$E$${rabItemRowNumber}`)
    expect(cellFormula(rekapAhspItemRow!, 4)).toMatch(/^'Pekerjaan Tanah'!\$G\$\d+$/)
    expect(cellFormula(rekapAhspItemRow!, 5)).toBe(`C${rekapAhspItemRowNumber}*E${rekapAhspItemRowNumber}`)

    const rabSubtotalRow = sheets[1].rows.find((row) => rowValues(row)[7] === 'Subtotal')
    expect(rabSubtotalRow).toBeDefined()
    const rabSubtotalRowNumber = sheets[1].rows.indexOf(rabSubtotalRow!) + 1
    const rabLastItemRow = sheets[1].rows.find((row) => rowValues(row)[1] === '2.1')
    expect(rabLastItemRow).toBeDefined()
    const rabLastItemRowNumber = sheets[1].rows.indexOf(rabLastItemRow!) + 1
    expect(cellFormula(rabSubtotalRow!, 8)).toBe(`SUM(I${rabItemRowNumber}:I${rabLastItemRowNumber})`)
    expect(cellFormula(sheets[0].rows[7], 1)).toBe(`'RAB'!$I$${rabSubtotalRowNumber}`)
  })
})

describe('createRabXlsx', () => {
  it('creates an xlsx buffer for the RAB snapshot', () => {
    const workbook = createRabXlsx(project, snapshot)

    expect(workbook.subarray(0, 4).toString('hex')).toBe('504b0304')
    expect(workbook.toString('utf8')).toContain('Perencanaan Drainase Pasar Baru')
    expect(workbook.toString('utf8')).toContain('Galian tanah')
    expect(workbook.toString('utf8')).toContain('/xl/styles.xml')
    expect(workbook.toString('utf8')).toContain('<mergeCell ref="A1:I1"/>')
    expect(workbook.toString('utf8')).toContain('<mergeCell ref="A1:F1"/>')
    expect(workbook.toString('utf8')).toContain('s="9"')
    expect(workbook.toString('utf8')).toContain('s="11"')
    expect(workbook.toString('utf8')).toContain('<f>E7*F7</f>')
    expect(workbook.toString('utf8')).toContain('<f>&apos;RAB&apos;!$E$5</f>')
    expect(workbook.toString('utf8')).toContain('<calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/>')
  })
})
