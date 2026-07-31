import {
  createXlsxWorkbook,
  type XlsxCell,
  type XlsxCellStyle,
  type XlsxCellValue,
  type XlsxRow,
  type XlsxSheet,
} from '@/lib/simple-xlsx'
import type { AhspComponentType, RabMakerItemDetailRow, RabMakerItemRow, RabMakerSnapshot } from '@/lib/types/ahsp'
import type { ProyekDetail } from '@/lib/types/proyek'

function safeText(value: string | null | undefined) {
  return value?.trim() || '-'
}

function safeFilenamePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'rab'
}

export function buildRabExportFilename(project: Pick<ProyekDetail, 'nama_proyek' | 'tahun_anggaran'>) {
  return `rab-${safeFilenamePart(project.nama_proyek)}-${project.tahun_anggaran}.xlsx`
}

function safeSheetName(value: string, fallback: string) {
  const cleaned = value.replace(/[\[\]:*?/\\]/g, ' ').trim() || fallback
  return cleaned.slice(0, 31)
}

function uniqueSheetName(value: string, fallback: string, usedNames: Set<string>) {
  const base = safeSheetName(value, fallback)
  let candidate = base
  let suffixNumber = 2

  while (usedNames.has(candidate.toLowerCase())) {
    const suffix = ` (${suffixNumber})`
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`
    suffixNumber += 1
  }

  usedNames.add(candidate.toLowerCase())
  return candidate
}

function cell(value: XlsxCellValue, style: XlsxCellStyle): XlsxCell {
  return { value, style }
}

function formulaCell(value: XlsxCellValue, formula: string, style: XlsxCellStyle): XlsxCell {
  return { value, formula, style }
}

function styledRow(values: XlsxCellValue[], style: XlsxCellStyle): XlsxRow {
  return values.map((value) => cell(value, style))
}

function titleRow(title: string): XlsxRow {
  return [cell(title, 'title')]
}

function money(value: number): XlsxCell {
  return cell(value, 'currency')
}

function decimal(value: number): XlsxCell {
  return cell(value, 'decimal')
}

function volume(value: number): XlsxCell {
  return cell(value, 'volume')
}

function number(value: number): XlsxCell {
  return cell(value, 'number')
}

function quoteSheetName(sheetName: string) {
  return `'${sheetName.replace(/'/g, "''")}'`
}

function absoluteRef(sheetName: string, column: string, row: number) {
  return `${quoteSheetName(sheetName)}!$${column}$${row}`
}

type AhspItemFormulaRefs = {
  sheetName: string
  hargaDasarTotalRef: string
  profitPercentRef: string
  hargaSatuanRef: string
}

type RabItemFormulaRefs = {
  volumeRef: string
  jumlahHargaRef: string
}

function priceResourceKey(detail: Pick<RabMakerItemDetailRow, 'komponen_tipe' | 'nama_komponen_snapshot' | 'satuan_snapshot' | 'harga_dasar_final'>) {
  return [
    detail.komponen_tipe,
    detail.nama_komponen_snapshot,
    detail.satuan_snapshot,
    detail.harga_dasar_final,
  ].join('|')
}

function componentSectionLabel(type: AhspComponentType) {
  if (type === 'upah') return ['A', 'TENAGA KERJA']
  if (type === 'bahan') return ['B', 'BAHAN']
  return ['C', 'PERALATAN']
}

function componentTypeOrder(type: AhspComponentType) {
  if (type === 'upah') return 1
  if (type === 'bahan') return 2
  return 3
}

function detailsByType(details: RabMakerItemDetailRow[], type: AhspComponentType) {
  return details.filter((detail) => detail.komponen_tipe === type)
}

function sumDetails(details: RabMakerItemDetailRow[]) {
  return details.reduce((sum, detail) => sum + detail.jumlah_harga_dasar, 0)
}

function buildAhspViewRows(items: RabMakerItemRow[], snapshot: RabMakerSnapshot, title: string, sheetName: string) {
  const rows: XlsxRow[] = [
    titleRow(`AHSP View - ${title}`),
    [],
    styledRow(['Kode Analisa', 'Uraian Pekerjaan', '', '', '', '', '', 'Harga Satuan Final', ''], 'header'),
  ]
  const itemRefs = new Map<string, AhspItemFormulaRefs>()

  items.forEach((item) => {
    const details = snapshot.detailsByItem[item.id] ?? []
    const headerPriceCell = cell(item.harga_satuan, 'total')
    rows.push([
      cell(item.kode_analisa_snapshot, 'category'),
      cell(item.uraian_pekerjaan_snapshot, 'category'),
      cell('', 'category'),
      cell('', 'category'),
      cell('', 'category'),
      cell('', 'category'),
      cell('', 'category'),
      cell('Harga Satuan Final', 'category'),
      headerPriceCell,
    ])
    rows.push(styledRow(['No', 'Uraian Komponen', 'Kode', 'Satuan', 'Koefisien', 'Harga Satuan', 'Jumlah Harga', '', ''], 'header'))

    const subtotalRows: number[] = []
    for (const type of ['upah', 'bahan', 'alat'] as const) {
      const sectionDetails = detailsByType(details, type)
      const [sectionCode, sectionName] = componentSectionLabel(type)
      rows.push(styledRow([sectionCode, sectionName, '', '', '', '', '', '', ''], 'section'))

      const detailRows: number[] = []
      if (sectionDetails.length === 0) {
        rows.push([cell('', 'text'), cell('-', 'text'), cell('', 'text'), cell('', 'text'), cell('', 'text'), cell('', 'text'), money(0), cell('', 'text'), cell('', 'text')])
      } else {
        sectionDetails.forEach((detail, index) => {
          const rowNumber = rows.length + 1
          detailRows.push(rowNumber)
          rows.push([
            number(index + 1),
            cell(detail.nama_komponen_snapshot, 'text'),
            cell('', 'text'),
            cell(detail.satuan_snapshot, 'text'),
            decimal(detail.koefisien_snapshot),
            money(detail.harga_dasar_final),
            formulaCell(detail.jumlah_harga_dasar, `E${rowNumber}*F${rowNumber}`, 'currency'),
            cell('', 'text'),
            cell(detail.harga_override_reason ?? '', 'text'),
          ])
        })
      }

      const subtotalRowNumber = rows.length + 1
      subtotalRows.push(subtotalRowNumber)
      const subtotalFormula = detailRows.length > 0
        ? `SUM(${detailRows.map((rowNumber) => `G${rowNumber}`).join(',')})`
        : '0'
      rows.push([cell(`JUMLAH HARGA ${sectionName}`, 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), formulaCell(sumDetails(sectionDetails), subtotalFormula, 'total'), cell('', 'section'), cell('', 'section')])
    }

    const baseTotalRowNumber = rows.length + 1
    rows.push([cell('JUMLAH HARGA DASAR', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), formulaCell(item.harga_dasar_total, `SUM(${subtotalRows.map((rowNumber) => `G${rowNumber}`).join(',')})`, 'total'), cell('', 'section'), cell('', 'section')])
    const profitRowNumber = rows.length + 1
    rows.push([cell('PROFIT/OH', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), number(item.profit_persen_final), formulaCell(item.profit_nilai, `G${baseTotalRowNumber}*F${profitRowNumber}/100`, 'total'), cell('', 'section'), cell(item.profit_override_reason ?? '', 'section')])
    const finalRowNumber = rows.length + 1
    rows.push([cell('HARGA SATUAN PEKERJAAN', 'category'), cell('', 'category'), cell('', 'category'), cell('', 'category'), cell('', 'category'), cell('', 'category'), formulaCell(item.harga_satuan, `G${baseTotalRowNumber}+G${profitRowNumber}`, 'total'), cell('', 'category'), cell('', 'category')])
    headerPriceCell.formula = `G${finalRowNumber}`
    itemRefs.set(item.id, {
      sheetName,
      hargaDasarTotalRef: absoluteRef(sheetName, 'G', baseTotalRowNumber),
      profitPercentRef: absoluteRef(sheetName, 'F', profitRowNumber),
      hargaSatuanRef: absoluteRef(sheetName, 'G', finalRowNumber),
    })
    rows.push([])
  })

  return { rows, itemRefs }
}

function groupItemsByCategory(snapshot: RabMakerSnapshot) {
  const grouped = new Map<string, { count: number; subtotal: number; items: RabMakerItemRow[] }>()

  for (const item of snapshot.items) {
    const kategori = safeText(item.kategori_snapshot)
    const current = grouped.get(kategori) ?? { count: 0, subtotal: 0, items: [] }
    current.count += 1
    current.subtotal += item.jumlah_harga
    current.items.push(item)
    grouped.set(kategori, current)
  }

  return [...grouped.entries()]
}

function buildRekapAhspRows(
  snapshot: RabMakerSnapshot,
  ahspRefsByItem: Map<string, AhspItemFormulaRefs>,
  rabRefsByItem: Map<string, RabItemFormulaRefs>
) {
  const grouped = groupItemsByCategory(snapshot)

  const rows: XlsxRow[] = [
    titleRow('REKAP AHSP'),
    [],
    styledRow(['Kode Analisa', 'Jenis Pekerjaan', 'Vol', 'Satuan', 'Harga Satuan (Rp)', 'Jumlah Harga (Rp)'], 'header'),
  ]

  for (const [kategori, value] of grouped) {
    rows.push([])
    const categoryTotalCell = cell(value.subtotal, 'total')
    rows.push([cell(kategori, 'category'), cell('', 'category'), cell('', 'category'), cell('', 'category'), cell(value.count, 'category'), categoryTotalCell])
    const itemRows: number[] = []
    for (const item of value.items) {
      const rowNumber = rows.length + 1
      const ahspRefs = ahspRefsByItem.get(item.id)
      const rabRefs = rabRefsByItem.get(item.id)
      itemRows.push(rowNumber)
      rows.push([
        cell(item.kode_analisa_snapshot, 'text'),
        cell(item.uraian_pekerjaan_snapshot, 'text'),
        rabRefs ? formulaCell(item.volume, rabRefs.volumeRef, 'volume') : volume(item.volume),
        cell(item.satuan_snapshot, 'text'),
        ahspRefs ? formulaCell(item.harga_satuan, ahspRefs.hargaSatuanRef, 'currency') : money(item.harga_satuan),
        formulaCell(item.jumlah_harga, `C${rowNumber}*E${rowNumber}`, 'currency'),
      ])
    }
    categoryTotalCell.formula = itemRows.length > 0
      ? `SUM(F${itemRows[0]}:F${itemRows[itemRows.length - 1]})`
      : '0'
  }

  return rows
}

function buildHargaRows(snapshot: RabMakerSnapshot) {
  const resources = new Map<string, {
    type: AhspComponentType
    nama: string
    satuan: string
    hargaDefault: number
    hargaFinal: number
    usedBy: Set<string>
    count: number
  }>()

  for (const item of snapshot.items) {
    for (const detail of snapshot.detailsByItem[item.id] ?? []) {
      const key = [
        detail.komponen_tipe,
        detail.nama_komponen_snapshot,
        detail.satuan_snapshot,
        detail.harga_dasar_default,
        detail.harga_dasar_final,
      ].join('|')
      const current = resources.get(key) ?? {
        type: detail.komponen_tipe,
        nama: detail.nama_komponen_snapshot,
        satuan: detail.satuan_snapshot,
        hargaDefault: detail.harga_dasar_default,
        hargaFinal: detail.harga_dasar_final,
        usedBy: new Set<string>(),
        count: 0,
      }
      current.count += 1
      current.usedBy.add(item.kode_analisa_snapshot)
      resources.set(key, current)
    }
  }

  const counters: Record<AhspComponentType, number> = { upah: 0, bahan: 0, alat: 0 }
  const resourceRows: XlsxRow[] = []
  let lastType: AhspComponentType | null = null
  for (const resource of [...resources.values()]
    .sort((a, b) => componentTypeOrder(a.type) - componentTypeOrder(b.type) || a.nama.localeCompare(b.nama))
  ) {
    if (resource.type !== lastType) {
      resourceRows.push(styledRow([resource.type.toUpperCase(), '', '', '', '', '', '', ''], 'section'))
      lastType = resource.type
    }

    counters[resource.type] += 1
    resourceRows.push([
      cell(resource.type, 'text'),
      number(counters[resource.type]),
      cell(resource.nama, 'text'),
      cell(resource.satuan, 'text'),
      money(resource.hargaDefault),
      money(resource.hargaFinal),
      cell([...resource.usedBy].sort((a, b) => a.localeCompare(b)).join(', '), 'text'),
      number(resource.count),
    ])
  }

  return [
    titleRow('Daftar Harga Upah, Bahan, dan Alat yang digunakan RAB'),
    [],
    styledRow(['Jenis', 'No', 'Nama Komponen', 'Satuan', 'Harga Default', 'Harga Final', 'Dipakai di Kode AHSP', 'Jumlah Pemakaian'], 'header'),
    ...resourceRows,
  ]
}

type RabTemplateRefs = {
  volumeRef: string
  amountRef: string
  subtotalRef: string
}

export type RabExportIssue = {
  code: 'MISSING_CATEGORY' | 'MISSING_DETAILS' | 'INVALID_NUMBER' | 'PLACEHOLDER_PRICE' | 'INCONSISTENT_AHSP' | 'INCONSISTENT_TOTAL'
  message: string
  itemId?: string
}

export type RabExportPreview = {
  canExport: boolean
  issues: RabExportIssue[]
  sheetNames: string[]
  itemCount: number
  categoryCount: number
}

function roman(value: number) {
  const numerals: Array<[number, string]> = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let remaining = value
  let result = ''
  for (const [amount, symbol] of numerals) {
    while (remaining >= amount) {
      result += symbol
      remaining -= amount
    }
  }
  return result
}

function sumFormula(column: string, rows: number[]) {
  if (rows.length === 0) return '0'
  return `SUM(${rows.map((row) => `${column}${row}`).join(',')})`
}

function templateCell(value: XlsxCellValue, style: XlsxCellStyle = 'text') {
  return cell(value, style)
}

function templateFormula(value: number, formula: string, style: XlsxCellStyle = 'currency') {
  return formulaCell(value, formula, style)
}

function emptyCells(count: number, style: XlsxCellStyle = 'text') {
  return Array.from({ length: count }, () => templateCell('', style))
}

function buildTemplateAhspSheet(
  items: RabMakerItemRow[],
  snapshot: RabMakerSnapshot,
  category: string,
  sheetName: string,
  priceRefsByResourceKey: Map<string, string>
) {
  const rows: XlsxRow[] = [
    titleRow(category),
    [templateCell('Tarif biaya umum dan keuntungan', 'subtitle'), ...emptyCells(5, 'subtitle'), templateCell('', 'number')],
    [],
  ]
  const merges = ['A1:G1', 'A2:F2']
  const refsByItem = new Map<string, AhspItemFormulaRefs>()
  const rowBreaks: number[] = []
  const maxRowsPerPrintedPage = 38
  let currentPageStart = 1

  for (const item of items) {
    const analysisTitleRow = rows.length + 1
    const headerPrice = templateCell(item.harga_satuan, 'total')
    rows.push([
      templateCell(`${item.kode_analisa_snapshot}  ${item.uraian_pekerjaan_snapshot}`, 'category'),
      ...emptyCells(5, 'category'),
      headerPrice,
    ])
    merges.push(`A${analysisTitleRow}:F${analysisTitleRow}`)
    rows.push(styledRow(['No', 'Uraian', 'Kode', 'Satuan', 'Koefisien', 'Harga Satuan (Rp)', 'Jumlah Harga (Rp)'], 'header'))

    const subtotalRows: number[] = []
    for (const type of ['upah', 'bahan', 'alat'] as const) {
      const details = detailsByType(snapshot.detailsByItem[item.id] ?? [], type)
      const [sectionCode, sectionName] = componentSectionLabel(type)
      rows.push([templateCell(sectionCode, 'section'), templateCell(sectionName, 'section'), ...emptyCells(5, 'section')])
      const detailRows: number[] = []
      for (const [index, detail] of details.entries()) {
        const rowNumber = rows.length + 1
        detailRows.push(rowNumber)
        const priceRef = priceRefsByResourceKey.get(priceResourceKey(detail))
        rows.push([
          number(index + 1),
          templateCell(detail.nama_komponen_snapshot),
          templateCell('', 'text'),
          templateCell(detail.satuan_snapshot),
          decimal(detail.koefisien_snapshot),
          priceRef ? templateFormula(detail.harga_dasar_final, priceRef) : money(detail.harga_dasar_final),
          templateFormula(detail.jumlah_harga_dasar, `E${rowNumber}*F${rowNumber}`),
        ])
      }
      const subtotalRow = rows.length + 1
      subtotalRows.push(subtotalRow)
      rows.push([
        templateCell(`Subtotal ${sectionCode} - ${sectionName}`, 'section'),
        ...emptyCells(5, 'section'),
        templateFormula(sumDetails(details), sumFormula('G', detailRows), 'total'),
      ])
      merges.push(`A${subtotalRow}:F${subtotalRow}`)
    }

    const directRow = rows.length + 1
    rows.push([
      templateCell('D  Jumlah Keseluruhan (A+B+C)', 'section'),
      ...emptyCells(5, 'section'),
      templateFormula(item.harga_dasar_total, sumFormula('G', subtotalRows), 'total'),
    ])
    merges.push(`A${directRow}:F${directRow}`)
    const profitRow = rows.length + 1
    rows.push([
      templateCell('E  Biaya Umum dan Keuntungan', 'section'),
      ...emptyCells(3, 'section'),
      templateCell(item.profit_persen_final / 100, 'percentage'),
      templateCell('Profit', 'section'),
      templateFormula(item.profit_nilai, `E${profitRow}*G${directRow}`, 'total'),
    ])
    merges.push(`A${profitRow}:D${profitRow}`)
    const hspRow = rows.length + 1
    rows.push([
      templateCell('F  Harga Satuan Pekerjaan', 'category'),
      ...emptyCells(5, 'category'),
      templateFormula(item.harga_satuan, `G${directRow}+G${profitRow}`, 'total'),
    ])
    merges.push(`A${hspRow}:F${hspRow}`)
    headerPrice.formula = `G${hspRow}`
    refsByItem.set(item.id, {
      sheetName,
      hargaDasarTotalRef: absoluteRef(sheetName, 'G', directRow),
      profitPercentRef: absoluteRef(sheetName, 'E', profitRow),
      hargaSatuanRef: absoluteRef(sheetName, 'G', hspRow),
    })
    rows.push([], [], [])

    const nextItemStart = rows.length + 1
    const nextItem = items[items.indexOf(item) + 1]
    if (nextItem) {
      const nextDetails = snapshot.detailsByItem[nextItem.id] ?? []
      const nextBlockRows = 14 + nextDetails.length
      const usedRows = nextItemStart - currentPageStart
      if (usedRows + nextBlockRows > maxRowsPerPrintedPage) {
        rowBreaks.push(nextItemStart)
        currentPageStart = nextItemStart - 3
      }
    }
  }

  return {
    sheet: {
      name: sheetName,
      rows,
      columns: [{ width: 6 }, { width: 42 }, { width: 12 }, { width: 10 }, { width: 12 }, { width: 18 }, { width: 18 }],
      merges,
      freezePane: { ySplit: 4, topLeftCell: 'A5' },
      printTitleRows: { start: 1, end: 3 },
      rowBreaks,
    } satisfies XlsxSheet,
    refsByItem,
  }
}

function buildTemplateRabSheet(
  project: ProyekDetail,
  snapshot: RabMakerSnapshot,
  groups: Array<[string, { count: number; subtotal: number; items: RabMakerItemRow[] }]>,
  ahspRefsByItem: Map<string, AhspItemFormulaRefs>
) {
  const rows: XlsxRow[] = [
    [],
    titleRow('RENCANA ANGGARAN BIAYA (RAB)'),
    [],
    [templateCell('KEGIATAN :', 'text'), templateCell(project.dinas, 'text'), ...emptyCells(4)],
    [templateCell('PEKERJAAN :', 'text'), templateCell(project.nama_proyek, 'text'), ...emptyCells(4)],
    [templateCell('LOKASI :', 'text'), templateCell(safeText(project.lokasi_kecamatan), 'text'), ...emptyCells(4)],
    [],
    styledRow(['NO.', 'URAIAN PEKERJAAN', 'SATUAN', 'HARGA SATUAN (Rp)', 'VOLUME', 'JUMLAH HARGA (Rp)'], 'header'),
  ]
  const merges = ['A2:F2']
  const itemRefs = new Map<string, RabTemplateRefs>()
  const categoryRefs: Array<{ category: string; subtotalRef: string }> = []

  groups.forEach(([category, value], groupIndex) => {
    const categoryRow = rows.length + 1
    rows.push([templateCell(roman(groupIndex + 1), 'category'), templateCell(category, 'category'), ...emptyCells(4, 'category')])
    merges.push(`B${categoryRow}:F${categoryRow}`)
    const itemRows: number[] = []
    value.items.forEach((item, itemIndex) => {
      const rowNumber = rows.length + 1
      itemRows.push(rowNumber)
      const ahspRef = ahspRefsByItem.get(item.id)
      const price = ahspRef
        ? templateFormula(item.harga_satuan, ahspRef.hargaSatuanRef)
        : money(item.harga_satuan)
      rows.push([
        number(itemIndex + 1),
        templateCell(item.uraian_pekerjaan_snapshot),
        templateCell(item.satuan_snapshot),
        price,
        volume(item.volume),
        templateFormula(item.jumlah_harga, `D${rowNumber}*E${rowNumber}`),
      ])
      itemRefs.set(item.id, {
        volumeRef: absoluteRef('RAB', 'E', rowNumber),
        amountRef: absoluteRef('RAB', 'F', rowNumber),
        subtotalRef: '',
      })
    })
    const subtotalRow = rows.length + 1
    rows.push([
      templateCell(`Sub. Jumlah ${roman(groupIndex + 1)}`, 'section'),
      ...emptyCells(4, 'section'),
      templateFormula(value.subtotal, sumFormula('F', itemRows), 'total'),
    ])
    merges.push(`A${subtotalRow}:E${subtotalRow}`)
    const subtotalRef = absoluteRef('RAB', 'F', subtotalRow)
    categoryRefs.push({ category, subtotalRef })
    for (const item of value.items) {
      const current = itemRefs.get(item.id)
      if (current) current.subtotalRef = subtotalRef
    }
    rows.push([])
  })

  const totalRow = rows.length + 1
  rows.push([templateCell('', 'text'), templateCell('JUMLAH', 'total'), ...emptyCells(4, 'total')])
  merges.push(`B${totalRow}:E${totalRow}`)
  const categorySubtotalRows = categoryRefs.map((ref) => Number(ref.subtotalRef.match(/\$(\d+)$/)?.[1]))
  rows[rows.length - 1][5] = templateFormula(
    snapshot.maker?.subtotal ?? snapshot.items.reduce((sum, item) => sum + item.jumlah_harga, 0),
    sumFormula('F', categorySubtotalRows),
    'total'
  )
  const correctedRow = rows.length + 1
  rows.push([templateCell('', 'text'), templateCell('TOTAL HARGA TERKOREKSI', 'total'), ...emptyCells(4, 'total')])
  merges.push(`B${correctedRow}:E${correctedRow}`)
  rows[rows.length - 1][5] = templateFormula(snapshot.maker?.subtotal ?? 0, `F${totalRow}`, 'total')
  const roundedRow = rows.length + 1
  rows.push([templateCell('', 'text'), templateCell('TOTAL HARGA PEMBULATAN', 'total'), ...emptyCells(4, 'total')])
  merges.push(`B${roundedRow}:E${roundedRow}`)
  rows[rows.length - 1][5] = templateFormula(Math.round(snapshot.maker?.subtotal ?? 0), `ROUND(F${correctedRow},0)`, 'total')

  return {
    sheet: {
      name: 'RAB',
      rows,
      columns: [{ width: 12 }, { width: 42 }, { width: 9 }, { width: 16 }, { width: 10 }, { width: 18 }],
      merges,
      freezePane: { ySplit: 8, topLeftCell: 'A9' },
      printTitleRows: { start: 1, end: 8 },
    } satisfies XlsxSheet,
    itemRefs,
    categoryRefs,
    totals: { subtotalRef: absoluteRef('RAB', 'F', totalRow), correctedRef: absoluteRef('RAB', 'F', correctedRow), roundedRef: absoluteRef('RAB', 'F', roundedRow) },
  }
}

function buildTemplateRecapSheet(
  project: ProyekDetail,
  snapshot: RabMakerSnapshot,
  categoryRefs: Array<{ category: string; subtotalRef: string }>,
  totals: { subtotalRef: string; correctedRef: string; roundedRef: string }
) {
  const ppn = snapshot.maker?.ppn_persen ?? 11
  const rows: XlsxRow[] = [
    [],
    titleRow('REKAPITULASI'),
    titleRow('ENGINEERING ESTIMATE (EE)'),
    [],
    [templateCell('KEGIATAN :', 'text'), templateCell(project.dinas, 'text'), templateCell('', 'text')],
    [templateCell('PEKERJAAN :', 'text'), templateCell(project.nama_proyek, 'text'), templateCell('', 'text')],
    [templateCell('LOKASI :', 'text'), templateCell(safeText(project.lokasi_kecamatan), 'text'), templateCell('', 'text')],
    [],
    styledRow(['NO.', 'URAIAN PEKERJAAN', 'JUMLAH HARGA PEKERJAAN (Rp)'], 'header'),
  ]
  const merges = ['A2:C2', 'A3:C3']
  categoryRefs.forEach((ref, index) => {
    rows.push([
      templateCell(roman(index + 1), 'category'),
      templateCell(ref.category, 'category'),
      templateFormula(0, ref.subtotalRef, 'total'),
    ])
  })
  const subtotalRow = rows.length + 1
  rows.push([templateCell('(A) Jumlah Harga Pekerjaan (Termasuk Biaya Umum dan Keuntungan)', 'total'), templateCell('', 'total'), templateFormula(snapshot.maker?.subtotal ?? 0, totals.subtotalRef, 'total')])
  merges.push(`A${subtotalRow}:B${subtotalRow}`)
  const ppnRow = rows.length + 1
  rows.push([templateCell(`(B) Pajak Pertambahan Nilai (PPN) = ${ppn}% x (A)`, 'total'), templateCell('', 'total'), templateFormula(snapshot.maker?.ppn_nilai ?? 0, `C${subtotalRow}*${ppn}/100`, 'total')])
  merges.push(`A${ppnRow}:B${ppnRow}`)
  const totalRow = rows.length + 1
  rows.push([templateCell('(C) JUMLAH TOTAL HARGA PEKERJAAN = (A) + (B)', 'total'), templateCell('', 'total'), templateFormula(snapshot.maker?.total_final ?? 0, `C${subtotalRow}+C${ppnRow}`, 'total')])
  merges.push(`A${totalRow}:B${totalRow}`)
  const roundedRow = rows.length + 1
  rows.push([templateCell('(D) PEMBULATAN', 'total'), templateCell('', 'total'), templateFormula(snapshot.maker?.total_final ?? 0, `ROUNDDOWN(C${totalRow}/1000,0)*1000`, 'total')])
  merges.push(`A${roundedRow}:B${roundedRow}`)
  rows.push([])
  const wordsRow = rows.length + 1
  rows.push([templateCell('TERBILANG :', 'subtitle'), templateCell('', 'subtitle'), templateCell('', 'subtitle')])
  merges.push(`A${wordsRow}:C${wordsRow + 1}`)
  rows.push([])

  return {
    name: 'Rekapitulasi',
    rows,
    columns: [{ width: 12 }, { width: 48 }, { width: 20 }],
    merges,
    freezePane: { ySplit: 9, topLeftCell: 'A10' },
  } satisfies XlsxSheet
}

function buildTemplatePriceSheet(snapshot: RabMakerSnapshot) {
  const rows: XlsxRow[] = [titleRow('REKAPITULASI HARGA BAHAN, TENAGA KERJA, DAN PERALATAN'), []]
  const merges = ['A1:E1']
  const rowBreaks: number[] = []
  const refsByResourceKey = new Map<string, string>()
  const groups: Array<[AhspComponentType, string, string]> = [
    ['upah', 'A. TENAGA KERJA', 'TK'],
    ['alat', 'B. PERALATAN', 'ALT'],
    ['bahan', 'C. BAHAN', 'BHN'],
  ]
  for (const [type, label, prefix] of groups) {
    const categoryRow = rows.length + 1
    if (type === 'bahan') rowBreaks.push(categoryRow)
    rows.push([templateCell(label, 'section'), ...emptyCells(4, 'section')])
    merges.push(`A${rows.length}:E${rows.length}`)
    rows.push(styledRow(['No', 'Uraian', 'Kode', 'Satuan', 'Harga Satuan (Rp)'], 'header'))
    const resources = new Map<string, RabMakerItemDetailRow>()
    snapshot.items.forEach((item) => {
      for (const detail of detailsByType(snapshot.detailsByItem[item.id] ?? [], type)) {
        resources.set(priceResourceKey(detail), detail)
      }
    })
    ;[...resources.values()].sort((a, b) => a.nama_komponen_snapshot.localeCompare(b.nama_komponen_snapshot)).forEach((detail, index) => {
      const rowNumber = rows.length + 1
      refsByResourceKey.set(priceResourceKey(detail), absoluteRef('Harga Bahan&Upah', 'E', rowNumber))
      rows.push([
        number(index + 1),
        templateCell(detail.nama_komponen_snapshot),
        templateCell(`${prefix}-${String(index + 1).padStart(3, '0')}`),
        templateCell(detail.satuan_snapshot),
        money(detail.harga_dasar_final),
      ])
    })
    rows.push([])
  }
  return {
    sheet: {
      name: 'Harga Bahan&Upah',
      rows,
      columns: [{ width: 6 }, { width: 45 }, { width: 12 }, { width: 10 }, { width: 18 }],
      merges,
      freezePane: { ySplit: 4, topLeftCell: 'A5' },
      printTitleRows: { start: 1, end: 4 },
      rowBreaks,
    } satisfies XlsxSheet,
    refsByResourceKey,
  }
}

export function buildRabExportPreview(project: ProyekDetail, snapshot: RabMakerSnapshot): RabExportPreview {
  const issues: RabExportIssue[] = []
  const grouped = groupItemsByCategory(snapshot)
  const usedNames = new Set(['rekapitulasi', 'rab', 'harga bahan&upah'])
  const sheetNames = ['Rekapitulasi', 'RAB', 'Harga Bahan&Upah']

  for (const [category, value] of grouped) {
    sheetNames.push(uniqueSheetName(category, 'AHSP', usedNames))
    for (const item of value.items) {
      const details = snapshot.detailsByItem[item.id] ?? []
      if (!item.kategori_snapshot?.trim()) issues.push({ code: 'MISSING_CATEGORY', message: 'Item RAB belum memiliki kategori AHSP.', itemId: item.id })
      if (details.length === 0) issues.push({ code: 'MISSING_DETAILS', message: 'Item RAB belum memiliki detail AHSP.', itemId: item.id })
      if (![item.volume, item.harga_satuan, item.jumlah_harga].every(Number.isFinite) || item.volume < 0 || item.harga_satuan < 0 || item.jumlah_harga < 0) {
        issues.push({ code: 'INVALID_NUMBER', message: 'Volume atau harga item RAB tidak valid.', itemId: item.id })
      }
      for (const detail of details) {
        if (detail.harga_dasar_final <= 1) {
          issues.push({
            code: 'PLACEHOLDER_PRICE',
            message: `Harga ${detail.komponen_tipe} "${detail.nama_komponen_snapshot}" belum final. Tetapkan harga lebih besar dari Rp1.`,
            itemId: item.id,
          })
        }
      }
      const base = sumDetails(details)
      const expectedPrice = base * (1 + item.profit_persen_final / 100)
      if (details.length > 0 && Math.abs(expectedPrice - item.harga_satuan) > 0.01) {
        issues.push({ code: 'INCONSISTENT_AHSP', message: 'Harga satuan item tidak sesuai dengan detail AHSP dan profit.', itemId: item.id })
      }
    }
  }
  const calculatedSubtotal = snapshot.items.reduce((sum, item) => sum + item.jumlah_harga, 0)
  if (snapshot.maker && Math.abs(calculatedSubtotal - snapshot.maker.subtotal) > 0.01) {
    issues.push({ code: 'INCONSISTENT_TOTAL', message: 'Subtotal RAB tidak sama dengan total item.' })
  }
  return { canExport: issues.length === 0, issues, sheetNames, itemCount: snapshot.items.length, categoryCount: grouped.length }
}

export function buildRabExportSheets(project: ProyekDetail, snapshot: RabMakerSnapshot): XlsxSheet[] {
  const groups = groupItemsByCategory(snapshot)
  const usedNames = new Set(['rekapitulasi', 'rab', 'harga bahan&upah'])
  const price = buildTemplatePriceSheet(snapshot)
  const ahspRefsByItem = new Map<string, AhspItemFormulaRefs>()
  const ahspSheets: XlsxSheet[] = []
  for (const [category, value] of groups) {
    const sheetName = uniqueSheetName(category, 'AHSP', usedNames)
    const built = buildTemplateAhspSheet(value.items, snapshot, category, sheetName, price.refsByResourceKey)
    ahspSheets.push(built.sheet)
    for (const [itemId, refs] of built.refsByItem) ahspRefsByItem.set(itemId, refs)
  }
  const rab = buildTemplateRabSheet(project, snapshot, groups, ahspRefsByItem)
  const recap = buildTemplateRecapSheet(project, snapshot, rab.categoryRefs, rab.totals)
  return [recap, rab.sheet, price.sheet, ...ahspSheets].map((sheet) => ({
    ...sheet,
    pageBreakPreview: true,
    print: {
      orientation: sheet.name === 'RAB' || sheet.name === 'Harga Bahan&Upah' ? 'landscape' : 'portrait',
      fitToWidth: 1,
      fitToHeight: 0,
    },
  }))
}

export function createRabXlsx(project: ProyekDetail, snapshot: RabMakerSnapshot) {
  return createXlsxWorkbook(buildRabExportSheets(project, snapshot))
}
