import { NextRequest } from 'next/server'

import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { createSatuan } from '@/lib/actions/ahsp'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'
import { validateSatuanPayload } from '@/lib/validations/ahsp'

export async function POST(req: NextRequest) {
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', 'Hanya Owner/Admin yang boleh menambah satuan.', 403)
  }

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
