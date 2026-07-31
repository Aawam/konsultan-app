import { z } from 'zod'

export const rabExportIssueSchema = z.object({
  code: z.enum(['MISSING_CATEGORY', 'MISSING_DETAILS', 'INVALID_NUMBER', 'PLACEHOLDER_PRICE', 'INCONSISTENT_AHSP', 'INCONSISTENT_TOTAL']),
  message: z.string().min(1),
  itemId: z.string().uuid().optional(),
})

export const rabExportPreviewSchema = z.object({
  canExport: z.boolean(),
  issues: z.array(rabExportIssueSchema),
  sheetNames: z.array(z.string().min(1)),
  itemCount: z.number().int().nonnegative(),
  categoryCount: z.number().int().nonnegative(),
})

export type RabExportPreview = z.infer<typeof rabExportPreviewSchema>

export function parseRabExportPreview(value: unknown): RabExportPreview | null {
  const result = rabExportPreviewSchema.safeParse(value)
  return result.success ? result.data : null
}
