import { describe, expect, it } from 'vitest'

import {
  buildRabExportFilename,
  buildRabExportPreview,
  buildRabExportSheets,
  createRabXlsx,
} from '@/lib/rab-export'
import type { XlsxRow } from '@/lib/simple-xlsx'
import type { RabMakerSnapshot } from '@/lib/types/ahsp'
import type { ProyekDetail } from '@/lib/types/proyek'

const project = {
  id: 'project-1',
  nama_proyek: 'Perencanaan Drainase Pasar Baru',
  tahun_anggaran: 2026,
  dinas: 'Dinas PUPR',
  lokasi_kecamatan: 'Tanjung Redeb',
} as ProyekDetail

const snapshot = {
  maker: {
    id: 'maker-1',
    proyek_id: 'project-1',
    status: 'draft',
    ppn_persen: 11,
    subtotal: 1341880,
    ppn_nilai: 147606.8,
    total_final: 1489486.8,
    validated_by: null,
    validated_at: null,
    finalized_by: null,
    finalized_at: null,
    updated_at: '2026-07-18T00:00:00.000Z',
  },
  items: [
    {
      id: 'item-1', rab_maker_id: 'maker-1', source_ahsp_item_id: 'ahsp-1',
      kode_analisa_snapshot: '1.1', uraian_pekerjaan_snapshot: 'Galian tanah',
      bidang_snapshot: 'SDA', sub_bidang_snapshot: 'Drainase', kategori_snapshot: 'Pekerjaan Tanah', satuan_snapshot: 'm3',
      volume: 10, profit_persen_default: 10, profit_persen_final: 10, profit_override_reason: null,
      harga_dasar_total: 50000, profit_nilai: 5000, harga_satuan: 55000, jumlah_harga: 550000, koefisien_locked: true, urutan: 1,
    },
    {
      id: 'item-2', rab_maker_id: 'maker-1', source_ahsp_item_id: 'ahsp-2',
      kode_analisa_snapshot: '1.2', uraian_pekerjaan_snapshot: 'Urugan pasir',
      bidang_snapshot: 'SDA', sub_bidang_snapshot: 'Drainase', kategori_snapshot: 'Pekerjaan Tanah', satuan_snapshot: 'm3',
      volume: 2, profit_persen_default: 10, profit_persen_final: 12, profit_override_reason: null,
      harga_dasar_total: 327000, profit_nilai: 39240, harga_satuan: 366240, jumlah_harga: 732480, koefisien_locked: true, urutan: 2,
    },
    {
      id: 'item-3', rab_maker_id: 'maker-1', source_ahsp_item_id: 'ahsp-3',
      kode_analisa_snapshot: '2.1', uraian_pekerjaan_snapshot: 'Beton mutu sedang',
      bidang_snapshot: 'CK', sub_bidang_snapshot: 'Struktur', kategori_snapshot: 'Pekerjaan Beton', satuan_snapshot: 'm3',
      volume: 1, profit_persen_default: 10, profit_persen_final: 10, profit_override_reason: null,
      harga_dasar_total: 54000, profit_nilai: 5400, harga_satuan: 59400, jumlah_harga: 59400, koefisien_locked: true, urutan: 3,
    },
  ],
  detailsByItem: {
    'item-1': [
      { id: 'detail-1', rab_maker_item_id: 'item-1', komponen_tipe: 'upah', nama_komponen_snapshot: 'Pekerja', satuan_snapshot: 'OH', koefisien_snapshot: 0.5, koefisien_locked: true, harga_dasar_default: 100000, harga_dasar_final: 100000, harga_override_reason: null, jumlah_harga_dasar: 50000, urutan: 1 },
    ],
    'item-2': [
      { id: 'detail-2', rab_maker_item_id: 'item-2', komponen_tipe: 'bahan', nama_komponen_snapshot: 'Pasir urug', satuan_snapshot: 'm3', koefisien_snapshot: 1.2, koefisien_locked: true, harga_dasar_default: 200000, harga_dasar_final: 210000, harga_override_reason: null, jumlah_harga_dasar: 252000, urutan: 1 },
      { id: 'detail-3', rab_maker_item_id: 'item-2', komponen_tipe: 'alat', nama_komponen_snapshot: 'Dump Truck', satuan_snapshot: 'jam', koefisien_snapshot: 0.25, koefisien_locked: true, harga_dasar_default: 300000, harga_dasar_final: 300000, harga_override_reason: null, jumlah_harga_dasar: 75000, urutan: 2 },
    ],
    'item-3': [
      { id: 'detail-4', rab_maker_item_id: 'item-3', komponen_tipe: 'bahan', nama_komponen_snapshot: 'Semen portland', satuan_snapshot: 'kg', koefisien_snapshot: 30, koefisien_locked: true, harga_dasar_default: 1800, harga_dasar_final: 1800, harga_override_reason: null, jumlah_harga_dasar: 54000, urutan: 1 },
    ],
  },
} as RabMakerSnapshot

function value(row: XlsxRow, column: number) {
  const cell = row[column]
  return cell !== null && typeof cell === 'object' && 'value' in cell ? cell.value : cell
}

function formula(row: XlsxRow, column: number) {
  const cell = row[column]
  return cell !== null && typeof cell === 'object' && 'formula' in cell ? cell.formula : undefined
}

describe('RAB template exporter', () => {
  it('validates a consistent snapshot before export', () => {
    const preview = buildRabExportPreview(project, snapshot)

    expect(preview.canExport).toBe(true)
    expect(preview.sheetNames).toEqual(['Rekapitulasi', 'RAB', 'Harga Bahan&Upah', 'Pekerjaan Tanah', 'Pekerjaan Beton'])
    expect(preview.itemCount).toBe(3)
    expect(preview.categoryCount).toBe(2)
  })

  it('blocks export when an AHSP detail is missing', () => {
    const preview = buildRabExportPreview(project, { ...snapshot, detailsByItem: { ...snapshot.detailsByItem, 'item-2': [] } })

    expect(preview.canExport).toBe(false)
    expect(preview.issues.some((issue) => issue.code === 'MISSING_DETAILS')).toBe(true)
  })

  it('blocks export when an AHSP snapshot still contains a Rp1 placeholder price', () => {
    const preview = buildRabExportPreview(project, {
      ...snapshot,
      detailsByItem: {
        ...snapshot.detailsByItem,
        'item-1': [{
          ...snapshot.detailsByItem['item-1'][0],
          harga_dasar_default: 1,
          harga_dasar_final: 1,
          jumlah_harga_dasar: 0.5,
        }],
      },
    })

    expect(preview.canExport).toBe(false)
    expect(preview.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'PLACEHOLDER_PRICE', itemId: 'item-1' }),
    ]))
  })

  it('links RAB prices to the dynamic AHSP category sheets', () => {
    const sheets = buildRabExportSheets(project, snapshot)
    const rab = sheets[1]
    const price = sheets[2]
    const ahsp = sheets[3]
    const rabItem = rab.rows.find((row) => value(row, 1) === 'Galian tanah')!
    const rabItemRow = rab.rows.indexOf(rabItem) + 1
    const ahspDetail = ahsp.rows.find((row) => value(row, 1) === 'Pekerja')!
    const ahspDetailRow = ahsp.rows.indexOf(ahspDetail) + 1
    const priceDetail = price.rows.find((row) => value(row, 1) === 'Pekerja')!
    const priceDetailRow = price.rows.indexOf(priceDetail) + 1
    const rabSubtotal = rab.rows.find((row) => value(row, 0) === 'Sub. Jumlah I')!
    const rabSubtotalRow = rab.rows.indexOf(rabSubtotal) + 1
    const recapCategory = sheets[0].rows.find((row) => value(row, 1) === 'Pekerjaan Tanah')!

    expect(rab.merges).toContain('A2:F2')
    expect(formula(rabItem, 3)).toMatch(/^'Pekerjaan Tanah'!\$G\$\d+$/)
    expect(formula(rabItem, 5)).toBe(`D${rabItemRow}*E${rabItemRow}`)
    expect(formula(ahspDetail, 5)).toBe(`'Harga Bahan&Upah'!$E$${priceDetailRow}`)
    expect(formula(ahspDetail, 6)).toBe(`E${ahspDetailRow}*F${ahspDetailRow}`)
    expect(formula(recapCategory, 2)).toBe(`'RAB'!$F$${rabSubtotalRow}`)
  })

  it('adds print pagination that keeps price categories and AHSP analyses readable', () => {
    const sheets = buildRabExportSheets(project, snapshot)
    const price = sheets.find((sheet) => sheet.name === 'Harga Bahan&Upah')!
    const ahsp = sheets.find((sheet) => sheet.name === 'Pekerjaan Tanah')!

    expect(price.printTitleRows).toEqual({ start: 1, end: 4 })
    expect(price.rowBreaks).toEqual(expect.arrayContaining([11]))
    expect(ahsp.printTitleRows).toEqual({ start: 1, end: 3 })
    expect(ahsp.rowBreaks).toEqual(expect.any(Array))
  })

  it('moves the next AHSP analysis to a new page before its block would split', () => {
    const denseItems = Array.from({ length: 3 }, (_, index) => ({
      ...snapshot.items[0],
      id: `dense-item-${index + 1}`,
      kode_analisa_snapshot: `1.${index + 1}`,
    }))
    const denseDetails = Object.fromEntries(denseItems.map((item) => [item.id, [{
      ...snapshot.detailsByItem['item-1'][0],
      id: `dense-detail-${item.id}`,
      rab_maker_item_id: item.id,
    }]]))
    const denseSnapshot = {
      ...snapshot,
      items: denseItems,
      detailsByItem: denseDetails,
    } as RabMakerSnapshot

    const ahsp = buildRabExportSheets(project, denseSnapshot).find((sheet) => sheet.name === 'Pekerjaan Tanah')!

    expect(ahsp.rowBreaks).toEqual([34])
  })

  it('creates a valid XLSX workbook and a safe filename', () => {
    const workbook = createRabXlsx(project, snapshot)
    const content = workbook.toString('utf8')

    expect(buildRabExportFilename(project)).toBe('rab-perencanaan-drainase-pasar-baru-2026.xlsx')
    expect(workbook.subarray(0, 4).toString('hex')).toBe('504b0304')
    expect(content).toContain('<mergeCell ref="A2:F2"/>')
    expect(content).toContain('&apos;Pekerjaan Tanah&apos;!$G$')
    expect(content).toContain('&apos;Harga Bahan&amp;Upah&apos;!$E$')
    expect(content).toContain('view="pageBreakPreview"')
    expect(content).toContain('orientation="landscape"')
    expect(content).toContain('_xlnm.Print_Titles')
    expect(content).toContain('<rowBreaks')
    expect(content).toContain('<calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/>')
  })
})
