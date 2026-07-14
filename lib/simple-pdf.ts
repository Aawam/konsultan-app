export type SimplePdfDocument = {
  title: string
  lines: string[]
}

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const LEFT_MARGIN = 48
const TOP_MARGIN = 790
const LINE_HEIGHT = 15
const MAX_LINES_PER_PAGE = 46

function sanitizePdfText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapePdfString(value: string) {
  return sanitizePdfText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function wrapLine(value: string, maxLength = 92) {
  const words = sanitizePdfText(value).split(' ').filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxLength && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

function paginate(lines: string[]) {
  const wrapped = lines.flatMap((line) => wrapLine(line))
  const pages: string[][] = []

  for (let index = 0; index < wrapped.length; index += MAX_LINES_PER_PAGE) {
    pages.push(wrapped.slice(index, index + MAX_LINES_PER_PAGE))
  }

  return pages.length > 0 ? pages : [[]]
}

function pageContent(title: string, lines: string[], pageNumber: number, pageCount: number) {
  const commands = [
    'BT',
    '/F1 16 Tf',
    `${LEFT_MARGIN} ${TOP_MARGIN} Td`,
    `(${escapePdfString(title)}) Tj`,
    '/F1 10 Tf',
    `0 -${LINE_HEIGHT * 2} Td`,
  ]

  for (const line of lines) {
    commands.push(`(${escapePdfString(line)}) Tj`)
    commands.push(`0 -${LINE_HEIGHT} Td`)
  }

  commands.push('ET')
  commands.push('BT')
  commands.push('/F1 9 Tf')
  commands.push(`${LEFT_MARGIN} 36 Td`)
  commands.push(`(Halaman ${pageNumber} dari ${pageCount}) Tj`)
  commands.push('ET')

  return commands.join('\n')
}

function pdfObject(id: number, body: string) {
  return `${id} 0 obj\n${body}\nendobj\n`
}

export function createSimplePdf(document: SimplePdfDocument) {
  const pages = paginate(document.lines)
  const objects = new Map<number, string>()
  const pageObjectIds: number[] = []
  let nextObjectId = 4

  objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>')
  objects.set(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  pages.forEach((lines, pageIndex) => {
    const content = pageContent(document.title, lines, pageIndex + 1, pages.length)
    const contentId = nextObjectId
    nextObjectId += 1
    const pageId = nextObjectId
    nextObjectId += 1

    objects.set(contentId, `<< /Length ${Buffer.byteLength(content, 'ascii')} >>\nstream\n${content}\nendstream`)
    objects.set(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`)
    pageObjectIds.push(pageId)
  })

  objects.set(2, `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`)

  let output = '%PDF-1.4\n'
  const offsets: number[] = [0]
  const sortedIds = [...objects.keys()].sort((a, b) => a - b)

  for (const id of sortedIds) {
    offsets[id] = Buffer.byteLength(output, 'ascii')
    output += pdfObject(id, objects.get(id) ?? '')
  }

  const xrefOffset = Buffer.byteLength(output, 'ascii')
  const size = Math.max(...sortedIds) + 1
  output += `xref\n0 ${size}\n`
  output += '0000000000 65535 f \n'
  for (let id = 1; id < size; id += 1) {
    output += `${String(offsets[id] ?? 0).padStart(10, '0')} 00000 n \n`
  }
  output += `trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(output, 'ascii')
}
