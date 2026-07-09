import { NextRequest } from 'next/server'

import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { requireOwnerAdminApi } from '@/lib/api-auth'
import { createAhspItem } from '@/lib/actions/ahsp'
import { validateAhspItemPayload } from '@/lib/validations/ahsp'

export async function POST(req: NextRequest) {
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh mengelola Masterfile AHSP.')
  if (forbidden) return forbidden

  const { data: body, error: bodyError } = await readJsonBody<Record<string, unknown>>(req)
  if (bodyError) return bodyError

  const parsed = validateAhspItemPayload(body ?? {})
  if (!parsed.ok) return apiError('VALIDATION_ERROR', parsed.message, 400)

  const { data, error } = await createAhspItem(parsed.data)
  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData(data, 201)
}
