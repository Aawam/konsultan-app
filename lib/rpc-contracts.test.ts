import { describe, expect, it } from 'vitest'

import { ahspImportResultSchema, rabExportRecordSchema } from '@/lib/rpc-contracts'

describe('database JSON RPC contracts', () => {
  it('accepts valid RAB export metadata and rejects malformed filenames', () => {
    expect(rabExportRecordSchema.safeParse({ versionNumber: 2, fileName: 'rab-v2.xlsx' }).success).toBe(true)
    expect(rabExportRecordSchema.safeParse({ versionNumber: 2, fileName: '' }).success).toBe(false)
  })

  it('requires every AHSP import counter', () => {
    expect(ahspImportResultSchema.safeParse({ satuanInserted: 1 }).success).toBe(false)
    expect(ahspImportResultSchema.safeParse({
      satuanInserted: 1,
      satuanReused: 0,
      kategoriInserted: 1,
      kategoriReused: 0,
      masterUpahInserted: 0,
      masterUpahUpdated: 0,
      masterBahanInserted: 1,
      masterBahanUpdated: 0,
      masterAlatInserted: 0,
      masterAlatUpdated: 0,
      ahspItemsInserted: 1,
      ahspItemsUpdated: 0,
      ahspDetailsInserted: 1,
    }).success).toBe(true)
  })
})
