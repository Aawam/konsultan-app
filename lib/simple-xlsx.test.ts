import { describe, expect, it } from 'vitest'

import { createXlsxWorkbook } from '@/lib/simple-xlsx'

describe('createXlsxWorkbook', () => {
  it('creates a zip-based xlsx workbook with escaped inline strings', () => {
    const workbook = createXlsxWorkbook([
      {
        name: 'RAB & Rekap',
        rows: [
          ['Kode', 'Uraian', 'Jumlah'],
          ['1.1', 'Pekerjaan <tanah> & "pasir"', 125000],
        ],
      },
    ])

    expect(workbook.subarray(0, 4).toString('hex')).toBe('504b0304')
    expect(workbook.toString('utf8')).toContain('RAB &amp; Rekap')
    expect(workbook.toString('utf8')).toContain('Pekerjaan &lt;tanah&gt; &amp; &quot;pasir&quot;')
    expect(workbook.toString('utf8')).toContain('<v>125000</v>')
  })

  it('writes styles, column widths, merged cells, and frozen panes', () => {
    const workbook = createXlsxWorkbook([
      {
        name: 'Formatted',
        columns: [{ width: 14 }, { width: 32 }],
        merges: ['A1:B1'],
        freezePane: { ySplit: 2, topLeftCell: 'A3' },
        rows: [
          [{ value: 'Title', style: 'title' }],
          [
            { value: 'Uraian', style: 'header' },
            { value: 'Jumlah', style: 'header' },
          ],
          [
            { value: 'Pekerjaan tanah', style: 'text' },
            { value: 125000, style: 'currency' },
            { value: 3, style: 'number' },
            { value: 10.25, style: 'volume' },
            { value: 375000, formula: 'B3*C3', style: 'currency' },
          ],
        ],
      },
    ])
    const xml = workbook.toString('utf8')

    expect(xml).toContain('/xl/styles.xml')
    expect(xml).toContain('<numFmt numFmtId="164" formatCode="&quot;Rp&quot; #,##0"/>')
    expect(xml).toContain('<numFmt numFmtId="166" formatCode="#,##0"/>')
    expect(xml).toContain('<numFmt numFmtId="167" formatCode="#,##0.00"/>')
    expect(xml).toContain('<col min="1" max="1" width="14" customWidth="1"/>')
    expect(xml).toContain('<mergeCell ref="A1:B1"/>')
    expect(xml).toContain('<pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/>')
    expect(xml).toContain('<c r="B3" s="9"><v>125000</v></c>')
    expect(xml).toContain('<c r="C3" s="7"><v>3</v></c>')
    expect(xml).toContain('<c r="D3" s="11"><v>10.25</v></c>')
    expect(xml).toContain('<c r="E3" s="9"><f>B3*C3</f><v>375000</v></c>')
    expect(xml).toContain('<calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/>')
  })

  it('rejects empty workbooks', () => {
    expect(() => createXlsxWorkbook([])).toThrow('Workbook must contain at least one sheet.')
  })
})
