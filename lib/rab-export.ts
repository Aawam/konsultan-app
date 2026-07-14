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

export function buildRabExportSheets(project: ProyekDetail, snapshot: RabMakerSnapshot): XlsxSheet[] {
  const subtotal = snapshot.maker?.subtotal ?? snapshot.items.reduce((sum, item) => sum + item.jumlah_harga, 0)
  const ppnPersen = snapshot.maker?.ppn_persen ?? 11
  const ppnNilai = snapshot.maker?.ppn_nilai ?? subtotal * ppnPersen / 100
  const totalFinal = snapshot.maker?.total_final ?? subtotal + ppnNilai
  const ahspRefsByItem = new Map<string, AhspItemFormulaRefs>()
  const usedSheetNames = new Set(['rekap', 'rab', 'rekap ahsp', 'harga'])
  const categoryAhspSheets = groupItemsByCategory(snapshot).map(([kategori, value]) => {
    const sheetName = uniqueSheetName(kategori, 'AHSP View', usedSheetNames)
    const { rows, itemRefs } = buildAhspViewRows(value.items, snapshot, kategori, sheetName)
    for (const [itemId, refs] of itemRefs) {
      ahspRefsByItem.set(itemId, refs)
    }

    return {
      name: sheetName,
      rows,
      columns: [
        { width: 8 },
        { width: 42 },
        { width: 12 },
        { width: 10 },
        { width: 12 },
        { width: 16 },
        { width: 16 },
        { width: 18 },
        { width: 28 },
      ],
      merges: ['A1:I1'],
      freezePane: { ySplit: 3, topLeftCell: 'A4' },
    }
  })

  const rabRefsByItem = new Map<string, RabItemFormulaRefs>()
  const rabRows: XlsxRow[] = [
    titleRow(`RAB - ${project.nama_proyek}`),
    [],
    styledRow(['No', 'Kode Analisa', 'Uraian Pekerjaan', 'Satuan', 'Volume', 'Harga Dasar', 'Profit (%)', 'Harga Satuan', 'Jumlah Harga'], 'header'),
  ]

  snapshot.items.forEach((item, index, items) => {
    const previous = items[index - 1]
    if (previous?.kategori_snapshot !== item.kategori_snapshot) {
      rabRows.push(styledRow([safeText(item.kategori_snapshot), '', '', '', '', '', '', '', ''], 'category'))
    }

    const rowNumber = rabRows.length + 1
    const ahspRefs = ahspRefsByItem.get(item.id)
    rabRefsByItem.set(item.id, {
      volumeRef: absoluteRef('RAB', 'E', rowNumber),
      jumlahHargaRef: absoluteRef('RAB', 'I', rowNumber),
    })

    rabRows.push([
      number(index + 1),
      cell(item.kode_analisa_snapshot, 'text'),
      cell(item.uraian_pekerjaan_snapshot, 'text'),
      cell(item.satuan_snapshot, 'text'),
      volume(item.volume),
      ahspRefs ? formulaCell(item.harga_dasar_total, ahspRefs.hargaDasarTotalRef, 'currency') : money(item.harga_dasar_total),
      ahspRefs ? formulaCell(item.profit_persen_final, ahspRefs.profitPercentRef, 'number') : number(item.profit_persen_final),
      ahspRefs ? formulaCell(item.harga_satuan, ahspRefs.hargaSatuanRef, 'currency') : money(item.harga_satuan),
      formulaCell(item.jumlah_harga, `E${rowNumber}*H${rowNumber}`, 'currency'),
    ])
  })

  const rabItemRows = snapshot.items
    .map((item) => Number(rabRefsByItem.get(item.id)?.jumlahHargaRef.match(/\$(\d+)$/)?.[1] ?? 0))
    .filter((rowNumber) => rowNumber > 0)
  rabRows.push([])
  const rabSubtotalRowNumber = rabRows.length + 1
  const rabPpnRowNumber = rabRows.length + 2
  const rabTotalRowNumber = rabRows.length + 3
  const rabSubtotalFormula = rabItemRows.length > 0
    ? `SUM(I${rabItemRows[0]}:I${rabItemRows[rabItemRows.length - 1]})`
    : '0'
  rabRows.push([cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('Subtotal', 'section'), formulaCell(subtotal, rabSubtotalFormula, 'total')])
  rabRows.push([cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), cell('', 'section'), cell(`PPN ${ppnPersen}%`, 'section'), formulaCell(ppnNilai, `I${rabSubtotalRowNumber}*${ppnPersen}/100`, 'total')])
  rabRows.push([cell('', 'category'), cell('', 'category'), cell('', 'category'), cell('', 'category'), cell('', 'category'), cell('', 'category'), cell('', 'category'), cell('Total Final', 'category'), formulaCell(totalFinal, `I${rabSubtotalRowNumber}+I${rabPpnRowNumber}`, 'total')])

  const rekapRows: XlsxRow[] = [
    titleRow('RAB / Engineering Estimate'),
    [cell('Nama Proyek', 'header'), cell(project.nama_proyek, 'text')],
    [cell('Dinas/SKPD', 'header'), cell(project.dinas, 'text')],
    [cell('Lokasi', 'header'), cell(safeText(project.lokasi_kecamatan), 'text')],
    [cell('Tahun Anggaran', 'header'), number(project.tahun_anggaran)],
    [cell('Status RAB', 'header'), cell(snapshot.maker?.status ?? 'belum dibuat', 'text')],
    [],
    [cell('Subtotal', 'section'), formulaCell(subtotal, absoluteRef('RAB', 'I', rabSubtotalRowNumber), 'currency')],
    [cell(`PPN ${ppnPersen}%`, 'section'), formulaCell(ppnNilai, absoluteRef('RAB', 'I', rabPpnRowNumber), 'currency')],
    [cell('Total Final', 'category'), formulaCell(totalFinal, absoluteRef('RAB', 'I', rabTotalRowNumber), 'total')],
  ]

  return [
    {
      name: 'Rekap',
      rows: rekapRows,
      columns: [{ width: 22 }, { width: 46 }],
      merges: ['A1:B1'],
    },
    {
      name: 'RAB',
      rows: rabRows,
      columns: [
        { width: 8 },
        { width: 14 },
        { width: 42 },
        { width: 10 },
        { width: 12 },
        { width: 16 },
        { width: 12 },
        { width: 16 },
        { width: 16 },
      ],
      merges: ['A1:I1'],
      freezePane: { ySplit: 3, topLeftCell: 'A4' },
    },
    {
      name: 'Rekap AHSP',
      rows: buildRekapAhspRows(snapshot, ahspRefsByItem, rabRefsByItem),
      columns: [
        { width: 14 },
        { width: 42 },
        { width: 12 },
        { width: 10 },
        { width: 16 },
        { width: 18 },
      ],
      merges: ['A1:F1'],
      freezePane: { ySplit: 3, topLeftCell: 'A4' },
    },
    ...categoryAhspSheets,
    {
      name: 'Harga',
      rows: buildHargaRows(snapshot),
      columns: [
        { width: 12 },
        { width: 8 },
        { width: 38 },
        { width: 10 },
        { width: 16 },
        { width: 16 },
        { width: 24 },
        { width: 16 },
      ],
      merges: ['A1:H1'],
      freezePane: { ySplit: 3, topLeftCell: 'A4' },
    },
  ]
}

export function createRabXlsx(project: ProyekDetail, snapshot: RabMakerSnapshot) {
  return createXlsxWorkbook(buildRabExportSheets(project, snapshot))
}
