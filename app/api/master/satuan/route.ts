import { NextRequest } from 'next/server'

import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { createSatuan } from '@/lib/actions/ahsp'
import { requireOwnerAdminApi } from '@/lib/api-auth'
import { validateSatuanPayload } from '@/lib/validations/ahsp'

export async function POST(req: NextRequest) {
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh menambah satuan.')
  if (forbidden) return forbidden

  const { data: body, error: bodyError } = await readJsonBody<Record<string, unknown>>(req)
  if (bodyError) return bodyError

  const parsed = validateSatuanPayload(body ?? {})
  if (!parsed.ok) return apiError('VALIDATION_ERROR', parsed.message, 400)

  const { data, error } = await createSatuan(parsed.data)
  if (error) {
    const status = error.code === '23505' ? 409 : 500
    return apiError(
      error.code === '23505' ? 'CONFLICT' : 'INTERNAL_ERROR',
      error.code === '23505' ? 'Satuan sudah ada.' : error.message,
      status
    )
  }

  return apiData(data, 201)
}
