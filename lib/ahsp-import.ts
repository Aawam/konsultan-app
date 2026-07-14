import { inflateRawSync } from 'node:zlib'

export type SpreadsheetRows = Record<string, unknown[][]>

export type AhspImportPreview = {
  totals: {
    masterUpah: number
    masterBahan: number
    masterAlat: number
    ahspItems: number
    ahspDetails: number
  }
  duplicateAhspCodes: string[]
  itemsWithoutDetails: string[]
  detailsWithoutItem: string[]
  missingComponentReferences: Array<{
    kodeAhsp: string
    jenis: string
    komponen: string
  }>
  blockers: string[]
  warnings: string[]
}

type ZipEntry = {
  compression: number
  compressedSize: number
  uncompressedSize: number
  localHeaderOffset: number
}

function decodeXml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function attr(source: string, name: string) {
  const match = source.match(new RegExp(`${name}="([^"]*)"`))
  return match ? decodeXml(match[1]) : null
}

function columnIndex(cellRef: string) {
  const letters = cellRef.match(/[A-Z]+/)?.[0] ?? 'A'
  let index = 0
  for (const letter of letters) {
    index = index * 26 + (letter.charCodeAt(0) - 64)
  }
  return index - 1
}

function findEndOfCentralDirectory(buffer: Buffer) {
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) return index
  }
  throw new Error('File XLSX tidak valid.')
}

function readZipEntries(buffer: Buffer) {
  const endOffset = findEndOfCentralDirectory(buffer)
  const entryCount = buffer.readUInt16LE(endOffset + 10)
  const centralOffset = buffer.readUInt32LE(endOffset + 16)
  const entries = new Map<string, ZipEntry>()
  let offset = centralOffset

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Central directory XLSX rusak.')
    }

    const compression = buffer.readUInt16LE(offset + 10)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const uncompressedSize = buffer.readUInt32LE(offset + 24)
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const localHeaderOffset = buffer.readUInt32LE(offset + 42)
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8')

    entries.set(name, {
      compression,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    })

    offset += 46 + nameLength + extraLength + commentLength
  }

  return entries
}

function readZipFile(buffer: Buffer, entries: Map<string, ZipEntry>, path: string) {
  const entry = entries.get(path)
  if (!entry) return null

  const offset = entry.localHeaderOffset
  if (buffer.readUInt32LE(offset) !== 0x04034b50) {
    throw new Error(`Local header XLSX rusak: ${path}`)
  }

  const nameLength = buffer.readUInt16LE(offset + 26)
  const extraLength = buffer.readUInt16LE(offset + 28)
  const dataOffset = offset + 30 + nameLength + extraLength
  const compressed = buffer.subarray(dataOffset, dataOffset + entry.compressedSize)

  if (entry.compression === 0) return compressed.toString('utf8')
  if (entry.compression === 8) {
    const inflated = inflateRawSync(compressed, { finishFlush: 2 })
    if (entry.uncompressedSize > 0 && inflated.length !== entry.uncompressedSize) {
      throw new Error(`Ukuran file XLSX tidak sesuai: ${path}`)
    }
    return inflated.toString('utf8')
  }

  throw new Error(`Metode kompresi XLSX tidak didukung: ${entry.compression}`)
}

function parseSharedStrings(xml: string | null) {
  if (!xml) return []
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
    [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((text) => decodeXml(text[1])).join('')
  )
}

function parseWorksheet(xml: string, sharedStrings: string[]) {
  const rows: unknown[][] = []

  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: unknown[] = []
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const metadata = cellMatch[1]
      const body = cellMatch[2]
      const ref = attr(metadata, 'r') ?? 'A1'
      const type = attr(metadata, 't')
      const v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1]
      const inlineText = [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((text) => decodeXml(text[1])).join('')
      const targetIndex = columnIndex(ref)

      if (type === 's') {
        row[targetIndex] = sharedStrings[Number(v ?? 0)] ?? ''
      } else if (type === 'inlineStr' || inlineText) {
        row[targetIndex] = inlineText
      } else if (type === 'b') {
        row[targetIndex] = v === '1'
      } else if (v !== undefined) {
        const number = Number(v)
        row[targetIndex] = Number.isFinite(number) ? number : decodeXml(v)
      } else {
        row[targetIndex] = ''
      }
    }
    rows.push(row)
  }

  return rows
}

function normalizeTarget(target: string) {
  const clean = target.startsWith('/') ? target.slice(1) : `xl/${target}`
  return clean.replace(/\/+/g, '/')
}

export function parseXlsxRows(buffer: Buffer): SpreadsheetRows {
  const entries = readZipEntries(buffer)
  const workbookXml = readZipFile(buffer, entries, 'xl/workbook.xml')
  const relsXml = readZipFile(buffer, entries, 'xl/_rels/workbook.xml.rels')

  if (!workbookXml || !relsXml) {
    throw new Error('Workbook XLSX tidak lengkap.')
  }

  const relationships = new Map<string, string>()
  for (const rel of relsXml.matchAll(/<Relationship\b([^>]*)\/>/g)) {
    const id = attr(rel[1], 'Id')
    const target = attr(rel[1], 'Target')
    if (id && target) relationships.set(id, normalizeTarget(target))
  }

  const sharedStrings = parseSharedStrings(readZipFile(buffer, entries, 'xl/sharedStrings.xml'))
  const result: SpreadsheetRows = {}

  for (const sheet of workbookXml.matchAll(/<sheet\b([^>]*)\/>/g)) {
    const name = attr(sheet[1], 'name')
    const relId = attr(sheet[1], 'r:id')
    const target = relId ? relationships.get(relId) : null
    const xml = target ? readZipFile(buffer, entries, target) : null
    if (name && xml) result[name] = parseWorksheet(xml, sharedStrings)
  }

  return result
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : value === null || value === undefined ? '' : String(value).trim()
}

function findHeaderRows(rows: unknown[][], requiredLabels: string[]) {
  const normalized = requiredLabels.map((label) => label.toLowerCase())
  return rows.findIndex((row) => {
    const labels = row.map((cell) => text(cell).toLowerCase())
    return normalized.every((label) => labels.includes(label))
  })
}

function tableObjects(rows: unknown[][], requiredLabels: string[]) {
  const headerIndex = findHeaderRows(rows, requiredLabels)
  if (headerIndex < 0) return []

  const headers = rows[headerIndex].map((cell) => text(cell))
  return rows.slice(headerIndex + 1)
    .filter((row) => row.some((cell) => text(cell)))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))
}

function uniqueMissing(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

export function analyzeAhspImportRows(sheets: SpreadsheetRows): AhspImportPreview {
  const masterUpah = tableObjects(sheets.MASTER_UPAH ?? [], ['Tenaga Kerja', 'Satuan'])
  const masterBahan = tableObjects(sheets.MASTER_BAHAN ?? [], ['Bahan', 'Satuan'])
  const masterAlat = tableObjects(sheets.MASTER_ALAT ?? [], ['Nama Alat', 'Satuan'])
  const ahspItems = tableObjects(sheets.AHSP_ITEMS ?? [], ['Kode Analisa', 'Uraian Pekerjaan'])
  const ahspDetails = tableObjects(sheets.AHSP_DETAILS ?? [], ['Kode AHSP', 'Jenis', 'Uraian Komponen', 'Koefisien'])

  const itemCodes = ahspItems.map((row) => text(row['Kode Analisa'])).filter(Boolean)
  const detailCodes = ahspDetails.map((row) => text(row['Kode AHSP'])).filter(Boolean)
  const itemCodeSet = new Set(itemCodes)
  const detailCodeSet = new Set(detailCodes)
  const duplicateAhspCodes = uniqueMissing(itemCodes.filter((code, index) => itemCodes.indexOf(code) !== index))

  const upahRefs = new Set(masterUpah.flatMap((row) => [text(row.Kode), text(row['Tenaga Kerja'])].filter(Boolean)))
  const bahanRefs = new Set(masterBahan.flatMap((row) => [text(row.Bahan)].filter(Boolean)))
  const alatRefs = new Set(masterAlat.flatMap((row) => [text(row.Kode), text(row['Nama Alat'])].filter(Boolean)))

  const missingComponentReferences = ahspDetails.flatMap((row) => {
    const jenis = text(row.Jenis).toUpperCase()
    const kodeAhsp = text(row['Kode AHSP'])
    const kode = text(row['Kode Komponen'])
    const nama = text(row['Uraian Komponen'])
    const refs = jenis === 'TENAGA' ? upahRefs : jenis === 'BAHAN' ? bahanRefs : jenis === 'ALAT' ? alatRefs : null

    if (!refs) return [{ kodeAhsp, jenis, komponen: nama || kode || '-' }]
    if ((kode && refs.has(kode)) || (nama && refs.has(nama))) return []
    return [{ kodeAhsp, jenis, komponen: nama || kode || '-' }]
  })

  const itemsWithoutDetails = uniqueMissing(itemCodes.filter((code) => !detailCodeSet.has(code)))
  const detailsWithoutItem = uniqueMissing(detailCodes.filter((code) => !itemCodeSet.has(code)))
  const blockers: string[] = []
  const warnings: string[] = []

  if (ahspItems.length === 0) blockers.push('Sheet AHSP_ITEMS tidak ditemukan atau kosong.')
  if (ahspDetails.length === 0) blockers.push('Sheet AHSP_DETAILS tidak ditemukan atau kosong.')
  if (duplicateAhspCodes.length > 0) blockers.push('Ada Kode Analisa duplikat.')
  if (detailsWithoutItem.length > 0) blockers.push('Ada detail yang mengacu ke Kode AHSP tanpa header AHSP.')
  if (missingComponentReferences.length > 0) blockers.push('Ada komponen detail yang tidak ditemukan di master upah/bahan/alat.')
  if (itemsWithoutDetails.length > 0) warnings.push('Ada AHSP item tanpa detail komponen.')

  warnings.push('Workbook belum punya kolom eksplisit untuk kategori output dan satuan output AHSP.')

  return {
    totals: {
      masterUpah: masterUpah.length,
      masterBahan: masterBahan.length,
      masterAlat: masterAlat.length,
      ahspItems: ahspItems.length,
      ahspDetails: ahspDetails.length,
    },
    duplicateAhspCodes,
    itemsWithoutDetails,
    detailsWithoutItem,
    missingComponentReferences,
    blockers,
    warnings,
  }
}

export function previewAhspImportWorkbook(buffer: Buffer) {
  return analyzeAhspImportRows(parseXlsxRows(buffer))
}
