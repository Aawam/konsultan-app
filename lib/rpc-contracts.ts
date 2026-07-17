import { z } from 'zod'

export const rabExportRecordSchema = z.object({
  versionNumber: z.number().int().positive(),
  fileName: z.string().trim().min(1),
})

export const ahspImportResultSchema = z.object({
  satuanInserted: z.number().int().nonnegative(),
  satuanReused: z.number().int().nonnegative(),
  kategoriInserted: z.number().int().nonnegative(),
  kategoriReused: z.number().int().nonnegative(),
  masterUpahInserted: z.number().int().nonnegative(),
  masterUpahUpdated: z.number().int().nonnegative(),
  masterBahanInserted: z.number().int().nonnegative(),
  masterBahanUpdated: z.number().int().nonnegative(),
  masterAlatInserted: z.number().int().nonnegative(),
  masterAlatUpdated: z.number().int().nonnegative(),
  ahspItemsInserted: z.number().int().nonnegative(),
  ahspItemsUpdated: z.number().int().nonnegative(),
  ahspDetailsInserted: z.number().int().nonnegative(),
})
