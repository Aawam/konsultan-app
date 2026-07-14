export type XlsxCellValue = string | number | boolean | null

export type XlsxCellStyle =
  | 'title'
  | 'subtitle'
  | 'header'
  | 'section'
  | 'category'
  | 'text'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'total'
  | 'volume'

export type XlsxCell = {
  value: XlsxCellValue
  style?: XlsxCellStyle
  formula?: string
}

export type XlsxRow = Array<XlsxCellValue | XlsxCell>

export type XlsxColumn = {
  width?: number
}

export type XlsxFreezePane = {
  xSplit?: number
  ySplit?: number
  topLeftCell?: string
}

export type XlsxSheet = {
  name: string
  rows: XlsxRow[]
  columns?: XlsxColumn[]
  merges?: string[]
  freezePane?: XlsxFreezePane
}

const STYLE_IDS: Record<XlsxCellStyle, number> = {
  title: 1,
  subtitle: 2,
  header: 3,
  section: 4,
  category: 5,
  text: 6,
  number: 7,
  decimal: 8,
  currency: 9,
  total: 10,
  volume: 11,
}

const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n += 1) {
  let c = n
  for (let k = 0; k < 8; k += 1) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
  }
  CRC_TABLE[n] = c >>> 0
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function columnName(index: number) {
  let value = index + 1
  let name = ''
  while (value > 0) {
    const remainder = (value - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    value = Math.floor((value - 1) / 26)
  }
  return name
}

function cellRef(rowIndex: number, columnIndex: number) {
  return `${columnName(columnIndex)}${rowIndex + 1}`
}

function normalizeCell(cell: XlsxCellValue | XlsxCell): XlsxCell {
  if (cell !== null && typeof cell === 'object' && 'value' in cell) {
    return cell
  }

  return { value: cell }
}

function normalizeSheetName(name: string, fallbackIndex: number) {
  const cleaned = name.replace(/[\[\]:*?/\\]/g, ' ').trim() || `Sheet ${fallbackIndex + 1}`
  return cleaned.slice(0, 31)
}

function cellStyleAttribute(style: XlsxCellStyle | undefined) {
  if (!style) return ''
  return ` s="${STYLE_IDS[style]}"`
}

function cachedFormulaValueXml(value: XlsxCellValue) {
  if (value === null || value === undefined) return ''

  if (typeof value === 'number') {
    return `<v>${Number.isFinite(value) ? value : 0}</v>`
  }

  if (typeof value === 'boolean') {
    return `<v>${value ? 1 : 0}</v>`
  }

  return `<v>${escapeXml(value)}</v>`
}

function worksheetXml(sheet: XlsxSheet) {
  const { rows } = sheet
  const rowXml = rows.map((row, rowIndex) => {
    const cells = row.map((rawCell, columnIndex) => {
      const { value, style, formula } = normalizeCell(rawCell)
      const ref = cellRef(rowIndex, columnIndex)
      const styleAttribute = cellStyleAttribute(style)

      if (formula) {
        return `<c r="${ref}"${styleAttribute}><f>${escapeXml(formula)}</f>${cachedFormulaValueXml(value)}</c>`
      }

      if (value === null || value === undefined) {
        return `<c r="${ref}"${styleAttribute}/>`
      }

      if (typeof value === 'number') {
        return `<c r="${ref}"${styleAttribute}><v>${Number.isFinite(value) ? value : 0}</v></c>`
      }

      if (typeof value === 'boolean') {
        return `<c r="${ref}"${styleAttribute} t="b"><v>${value ? 1 : 0}</v></c>`
      }

      return `<c r="${ref}"${styleAttribute} t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`
    }).join('')

    return `<row r="${rowIndex + 1}">${cells}</row>`
  }).join('')

  const columnsXml = sheet.columns?.length
    ? `<cols>${sheet.columns.map((column, index) => {
      const width = column.width ?? 10
      return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
    }).join('')}</cols>`
    : ''

  const freezePaneXml = sheet.freezePane
    ? `<sheetViews><sheetView workbookViewId="0"><pane${sheet.freezePane.xSplit ? ` xSplit="${sheet.freezePane.xSplit}"` : ''}${sheet.freezePane.ySplit ? ` ySplit="${sheet.freezePane.ySplit}"` : ''} topLeftCell="${escapeXml(sheet.freezePane.topLeftCell ?? 'A1')}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : ''

  const mergesXml = sheet.merges?.length
    ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((merge) => `<mergeCell ref="${escapeXml(merge)}"/>`).join('')}</mergeCells>`
    : ''

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${freezePaneXml}${columnsXml}<sheetData>${rowXml}</sheetData>${mergesXml}</worksheet>`
}

function workbookXml(sheets: XlsxSheet[]) {
  const sheetXml = sheets.map((sheet, index) =>
    `<sheet name="${escapeXml(normalizeSheetName(sheet.name, index))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  ).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetXml}</sheets><calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`
}

function workbookRelsXml(sheets: XlsxSheet[]) {
  const relationships = sheets.map((_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  ).join('')
  const stylesRelationship = `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}${stylesRelationship}</Relationships>`
}

function contentTypesXml(sheets: XlsxSheet[]) {
  const sheetOverrides = sheets.map((_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheetOverrides}</Types>`
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="4">
    <numFmt numFmtId="164" formatCode="&quot;Rp&quot; #,##0"/>
    <numFmt numFmtId="165" formatCode="#,##0.0000"/>
    <numFmt numFmtId="166" formatCode="#,##0"/>
    <numFmt numFmtId="167" formatCode="#,##0.00"/>
  </numFmts>
  <fonts count="5">
    <font><sz val="11"/><color rgb="FF111827"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF111827"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><color rgb="FF111827"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><i/><sz val="11"/><color rgb="FF374151"/><name val="Calibri"/></font>
  </fonts>
  <fills count="6">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F2937"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE5E7EB"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD9EAF7"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF3F4F6"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD1D5DB"/></left><right style="thin"><color rgb="FFD1D5DB"/></right><top style="thin"><color rgb="FFD1D5DB"/></top><bottom style="thin"><color rgb="FFD1D5DB"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="12">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment wrapText="1"/></xf>
    <xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="1" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="167" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`

const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`

function uint16(value: number) {
  const buffer = Buffer.alloc(2)
  buffer.writeUInt16LE(value, 0)
  return buffer
}

function uint32(value: number) {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32LE(value >>> 0, 0)
  return buffer
}

function zipStore(files: Array<{ path: string; content: string }>) {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0

  for (const file of files) {
    const name = Buffer.from(file.path, 'utf8')
    const content = Buffer.from(file.content, 'utf8')
    const crc = crc32(content)

    const localHeader = Buffer.concat([
      uint32(0x04034b50),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(content.length),
      uint32(content.length),
      uint16(name.length),
      uint16(0),
      name,
    ])

    localParts.push(localHeader, content)

    const centralHeader = Buffer.concat([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(content.length),
      uint32(content.length),
      uint16(name.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      name,
    ])

    centralParts.push(centralHeader)
    offset += localHeader.length + content.length
  }

  const centralDirectory = Buffer.concat(centralParts)
  const endRecord = Buffer.concat([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralDirectory.length),
    uint32(offset),
    uint16(0),
  ])

  return Buffer.concat([...localParts, centralDirectory, endRecord])
}

export function createXlsxWorkbook(sheets: XlsxSheet[]) {
  if (sheets.length === 0) {
    throw new Error('Workbook must contain at least one sheet.')
  }

  const files = [
    { path: '[Content_Types].xml', content: contentTypesXml(sheets) },
    { path: '_rels/.rels', content: ROOT_RELS_XML },
    { path: 'xl/workbook.xml', content: workbookXml(sheets) },
    { path: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml(sheets) },
    { path: 'xl/styles.xml', content: STYLES_XML },
    ...sheets.map((sheet, index) => ({
      path: `xl/worksheets/sheet${index + 1}.xml`,
      content: worksheetXml(sheet),
    })),
  ]

  return zipStore(files)
}
