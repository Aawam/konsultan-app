import { describe, expect, it } from 'vitest'

import { parseRabExportPreview } from '@/lib/rab-export-preview'

describe('parseRabExportPreview', () => {
  it('accepts a valid export preflight response', () => {
    const result = parseRabExportPreview({
      canExport: true,
      issues: [{
        code: 'PLACEHOLDER_PRICE',
        message: 'Harga komponen masih Rp1.',
        itemId: 'd56d9d04-4c06-4891-8a41-813ef623ae36',
      }],
      sheetNames: ['Rekapitulasi', 'RAB', 'Harga Bahan&Upah'],
      itemCount: 4,
      categoryCount: 2,
    })

    expect(result?.canExport).toBe(true)
    expect(result?.itemCount).toBe(4)
  })

  it('rejects a malformed preflight response', () => {
    expect(parseRabExportPreview({ canExport: 'yes', issues: [] })).toBeNull()
  })
})
