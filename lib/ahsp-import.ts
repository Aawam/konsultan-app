import { inflateRawSync } from 'node:zlib'

import { parseNumberInput } from '@/lib/utils'

export type SpreadsheetRows = Record<string, unknown[][]>

export type AhspImportMasterRow = {
  nama: string
  satuan: string
  harga_dasar: number
  refs: string[]
}

export type AhspImportItemRow = {
  kode_analisa: string
  uraian_pekerjaan: string
  kategori: string
  satuan: string
  bidang: 'CK' | 'SDA'
  sub_bidang: string | null
  profit_persen_default: number
}

export type AhspImportDetailRow = {
  kode_ahsp: string
  komponen_tipe: 'upah' | 'bahan' | 'alat'
  nama_komponen: string
  koefisien: number
  urutan: number
}

export type AhspImportPayload = {
  satuan: string[]
  kategori: string[]
  master: {
    upah: AhspImportMasterRow[]
    bahan: AhspImportMasterRow[]
    alat: AhspImportMasterRow[]
  }
  ahspItems: AhspImportItemRow[]
  ahspDetails: AhspImportDetailRow[]
}

export type AhspImportChangeSummary = {
  newSatuan: number
  reusedSatuan: number
  newKategori: number
  reusedKategori: number
  newMasterUpah: number
  updateMasterUpah: number
  newMasterBahan: number
  updateMasterBahan: number
  newMasterAlat: number
  updateMasterAlat: number
  newAhspItems: number
  updateAhspItems: number
}

export type AhspImportDatabaseSnapshot = {
  satuan: string[]
  kategori: string[]
  masterUpah: string[]
  masterBahan: string[]
  masterAlat: string[]
  ahspCodes: string[]
}

export type AhspImportResult = {
  satuanInserted: number
  satuanReused: number
  kategoriInserted: number
  kategoriReused: number
  masterUpahInserted: number
  masterUpahUpdated: number
  masterBahanInserted: number
  masterBahanUpdated: number
  masterAlatInserted: number
  masterAlatUpdated: number
  ahspItemsInserted: number
  ahspItemsUpdated: number
  ahspDetailsInserted: number
}

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
  conflicts: string[]
  canImport: boolean
  changeSummary: AhspImportChangeSummary
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

function normalizeKey(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function uniqueText(values: string[]) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values.map((item) => text(item)).filter(Boolean)) {
    const key = normalizeKey(value)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }

  return result.sort((a, b) => a.localeCompare(b))
}

function duplicateKeys(values: string[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const value of values.map((item) => text(item)).filter(Boolean)) {
    const key = normalizeKey(value)
    if (seen.has(key)) duplicates.add(value)
    seen.add(key)
  }

  return [...duplicates].sort((a, b) => a.localeCompare(b))
}

function pick(row: Record<string, unknown>, labels: string[]) {
  for (const label of labels) {
    const value = row[label]
    if (text(value)) return value
  }

  return ''
}

function parseDecimal(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const clean = text(value)
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/[^0-9.-]/g, '')

  const parsed = Number(clean)
  return Number.isFinite(parsed) ? parsed : 0
}

function parsePrice(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  return parseNumberInput(text(value))
}

function normalizeComponentType(value: unknown): 'upah' | 'bahan' | 'alat' | null {
  const clean = text(value).toLowerCase()
  if (clean === 'tenaga' || clean === 'upah' || clean === 'tenaga kerja') return 'upah'
  if (clean === 'bahan' || clean === 'material') return 'bahan'
  if (clean === 'alat' || clean === 'peralatan') return 'alat'
  return null
}

function defaultChangeSummary(): AhspImportChangeSummary {
  return {
    newSatuan: 0,
    reusedSatuan: 0,
    newKategori: 0,
    reusedKategori: 0,
    newMasterUpah: 0,
    updateMasterUpah: 0,
    newMasterBahan: 0,
    updateMasterBahan: 0,
    newMasterAlat: 0,
    updateMasterAlat: 0,
    newAhspItems: 0,
    updateAhspItems: 0,
  }
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

function masterRows(rows: Array<Record<string, unknown>>, kind: 'upah' | 'bahan' | 'alat') {
  const nameLabels = kind === 'upah'
    ? ['Tenaga Kerja', 'Nama Upah', 'Upah']
    : kind === 'bahan'
      ? ['Bahan', 'Nama Bahan', 'Material']
      : ['Nama Alat', 'Alat']
  const priceLabels = kind === 'upah' ? ['Harga Per Hari', 'Harga Satuan', 'Harga Dasar'] : ['Harga Satuan', 'Harga Dasar']

  return rows.map((row) => {
    const nama = text(pick(row, nameLabels))
    const kode = text(pick(row, ['Kode', 'Kode Komponen']))
    return {
      nama,
      satuan: text(pick(row, ['Satuan'])),
      harga_dasar: parsePrice(pick(row, priceLabels)),
      refs: uniqueText([kode, nama]),
    }
  })
}

function buildReferenceMap(rows: AhspImportMasterRow[]) {
  const map = new Map<string, AhspImportMasterRow>()
  for (const row of rows) {
    for (const ref of row.refs) {
      map.set(normalizeKey(ref), row)
    }
  }
  return map
}

export function buildAhspImportPayload(sheets: SpreadsheetRows): { preview: AhspImportPreview; payload: AhspImportPayload } {
  const masterUpah = tableObjects(sheets.MASTER_UPAH ?? [], ['Tenaga Kerja', 'Satuan'])
  const masterBahan = tableObjects(sheets.MASTER_BAHAN ?? [], ['Bahan', 'Satuan'])
  const masterAlat = tableObjects(sheets.MASTER_ALAT ?? [], ['Nama Alat', 'Satuan'])
  const ahspItems = tableObjects(sheets.AHSP_ITEMS ?? [], ['Kode Analisa', 'Uraian Pekerjaan'])
  const ahspDetails = tableObjects(sheets.AHSP_DETAILS ?? [], ['Kode AHSP', 'Jenis', 'Uraian Komponen', 'Koefisien'])

  const upahPayload = masterRows(masterUpah, 'upah')
  const bahanPayload = masterRows(masterBahan, 'bahan')
  const alatPayload = masterRows(masterAlat, 'alat')
  const refMaps = {
    upah: buildReferenceMap(upahPayload),
    bahan: buildReferenceMap(bahanPayload),
    alat: buildReferenceMap(alatPayload),
  }

  const itemCodes = ahspItems.map((row) => text(row['Kode Analisa'])).filter(Boolean)
  const detailCodes = ahspDetails.map((row) => text(row['Kode AHSP'])).filter(Boolean)
  const itemCodeSet = new Set(itemCodes)
  const detailCodeSet = new Set(detailCodes)
  const duplicateAhspCodes = duplicateKeys(itemCodes)

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

  const normalizedDetails = ahspDetails.flatMap((row, index): AhspImportDetailRow[] => {
    const komponenTipe = normalizeComponentType(row.Jenis)
    if (!komponenTipe) return []

    const kode = text(row['Kode Komponen'])
    const nama = text(row['Uraian Komponen'])
    const reference = (kode ? refMaps[komponenTipe].get(normalizeKey(kode)) : null)
      ?? (nama ? refMaps[komponenTipe].get(normalizeKey(nama)) : null)

    if (!reference) return []

    return [{
      kode_ahsp: text(row['Kode AHSP']),
      komponen_tipe: komponenTipe,
      nama_komponen: reference.nama,
      koefisien: parseDecimal(row.Koefisien),
      urutan: index + 1,
    }]
  })

  const normalizedItems = ahspItems.map((row): AhspImportItemRow => ({
    kode_analisa: text(row['Kode Analisa']),
    uraian_pekerjaan: text(row['Uraian Pekerjaan']),
    kategori: text(pick(row, ['Kategori', 'Kategori Pekerjaan'])),
    satuan: text(pick(row, ['Satuan', 'Satuan Output'])),
    bidang: text(row.Bidang).toUpperCase() === 'SDA' ? 'SDA' : 'CK',
    sub_bidang: text(pick(row, ['Sub Bidang', 'Sub-Bidang'])) || null,
    profit_persen_default: parseDecimal(pick(row, ['Profit Default', 'Profit Default (%)', 'Profit Persen Default'])),
  }))

  const payload: AhspImportPayload = {
    satuan: uniqueText([
      ...upahPayload.map((row) => row.satuan),
      ...bahanPayload.map((row) => row.satuan),
      ...alatPayload.map((row) => row.satuan),
      ...normalizedItems.map((row) => row.satuan),
    ]),
    kategori: uniqueText(normalizedItems.map((row) => row.kategori)),
    master: {
      upah: upahPayload,
      bahan: bahanPayload,
      alat: alatPayload,
    },
    ahspItems: normalizedItems,
    ahspDetails: normalizedDetails,
  }

  const itemsWithoutDetails = uniqueMissing(itemCodes.filter((code) => !detailCodeSet.has(code)))
  const detailsWithoutItem = uniqueMissing(detailCodes.filter((code) => !itemCodeSet.has(code)))
  const blockers: string[] = []
  const warnings: string[] = []

  if (ahspItems.length === 0) blockers.push('Sheet AHSP_ITEMS tidak ditemukan atau kosong.')
  if (ahspDetails.length === 0) blockers.push('Sheet AHSP_DETAILS tidak ditemukan atau kosong.')
  if (normalizedItems.some((row) => !row.kode_analisa)) blockers.push('Kode Analisa wajib diisi di sheet AHSP_ITEMS.')
  if (normalizedItems.some((row) => !row.uraian_pekerjaan)) blockers.push('Uraian Pekerjaan wajib diisi di sheet AHSP_ITEMS.')
  if (duplicateAhspCodes.length > 0) blockers.push('Ada Kode Analisa duplikat.')
  if (detailsWithoutItem.length > 0) blockers.push('Ada detail yang mengacu ke Kode AHSP tanpa header AHSP.')
  if (missingComponentReferences.length > 0) blockers.push('Ada komponen detail yang tidak ditemukan di master upah/bahan/alat.')
  if (normalizedItems.some((row) => !row.kategori)) blockers.push('Kolom Kategori wajib diisi di sheet AHSP_ITEMS.')
  if (normalizedItems.some((row) => !row.satuan)) blockers.push('Kolom Satuan wajib diisi di sheet AHSP_ITEMS.')
  if ([...upahPayload, ...bahanPayload, ...alatPayload].some((row) => !row.nama || !row.satuan)) {
    blockers.push('Master upah/bahan/alat wajib punya nama komponen dan satuan.')
  }
  if ([...upahPayload, ...bahanPayload, ...alatPayload].some((row) => row.harga_dasar < 0)) {
    blockers.push('Harga dasar tidak boleh negatif.')
  }
  if (normalizedDetails.some((row) => row.koefisien <= 0)) blockers.push('Koefisien detail AHSP harus lebih dari 0.')
  if (duplicateKeys(upahPayload.map((row) => row.nama)).length > 0) blockers.push('Ada nama upah duplikat di workbook.')
  if (duplicateKeys(bahanPayload.map((row) => row.nama)).length > 0) blockers.push('Ada nama bahan duplikat di workbook.')
  if (duplicateKeys(alatPayload.map((row) => row.nama)).length > 0) blockers.push('Ada nama alat duplikat di workbook.')
  if (itemsWithoutDetails.length > 0) warnings.push('Ada AHSP item tanpa detail komponen.')

  const preview: AhspImportPreview = {
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
    conflicts: [],
    canImport: blockers.length === 0,
    changeSummary: defaultChangeSummary(),
  }

  return { preview, payload }
}

export function analyzeAhspImportRows(sheets: SpreadsheetRows): AhspImportPreview {
  return buildAhspImportPayload(sheets).preview
}

function countExisting(values: string[]) {
  const counts = new Map<string, number>()
  for (const value of values) {
    const key = normalizeKey(value)
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

function countNewAndExisting(values: string[], existingValues: string[]) {
  const existing = new Set(existingValues.map(normalizeKey))
  return values.reduce(
    (summary, value) => {
      if (existing.has(normalizeKey(value))) summary.existing += 1
      else summary.new += 1
      return summary
    },
    { new: 0, existing: 0 }
  )
}

function existingDuplicateConflicts(label: string, values: string[]) {
  return [...countExisting(values).entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => `Database punya ${label} duplikat: ${value}. Rapikan dulu sebelum import.`)
}

export function enrichAhspImportPreview(
  preview: AhspImportPreview,
  payload: AhspImportPayload,
  existing: AhspImportDatabaseSnapshot
): AhspImportPreview {
  const satuan = countNewAndExisting(payload.satuan, existing.satuan)
  const kategori = countNewAndExisting(payload.kategori, existing.kategori)
  const upah = countNewAndExisting(payload.master.upah.map((row) => row.nama), existing.masterUpah)
  const bahan = countNewAndExisting(payload.master.bahan.map((row) => row.nama), existing.masterBahan)
  const alat = countNewAndExisting(payload.master.alat.map((row) => row.nama), existing.masterAlat)
  const ahsp = countNewAndExisting(payload.ahspItems.map((row) => row.kode_analisa), existing.ahspCodes)
  const conflicts = [
    ...existingDuplicateConflicts('satuan', existing.satuan),
    ...existingDuplicateConflicts('kategori', existing.kategori),
    ...existingDuplicateConflicts('upah', existing.masterUpah),
    ...existingDuplicateConflicts('bahan', existing.masterBahan),
    ...existingDuplicateConflicts('alat', existing.masterAlat),
    ...existingDuplicateConflicts('kode AHSP', existing.ahspCodes),
  ]

  return {
    ...preview,
    conflicts,
    canImport: preview.blockers.length === 0 && conflicts.length === 0,
    changeSummary: {
      newSatuan: satuan.new,
      reusedSatuan: satuan.existing,
      newKategori: kategori.new,
      reusedKategori: kategori.existing,
      newMasterUpah: upah.new,
      updateMasterUpah: upah.existing,
      newMasterBahan: bahan.new,
      updateMasterBahan: bahan.existing,
      newMasterAlat: alat.new,
      updateMasterAlat: alat.existing,
      newAhspItems: ahsp.new,
      updateAhspItems: ahsp.existing,
    },
  }
}

export function previewAhspImportWorkbook(buffer: Buffer) {
  return analyzeAhspImportRows(parseXlsxRows(buffer))
}

export function buildAhspImportWorkbookPayload(buffer: Buffer) {
  return buildAhspImportPayload(parseXlsxRows(buffer))
}
