import { NextRequest } from 'next/server'

import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { createMasterHarga } from '@/lib/actions/ahsp'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'
import { validateMasterHargaPayload } from '@/lib/validations/ahsp'

export async function POST(req: NextRequest) {
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', 'Hanya Owner/Admin yang boleh mengelola Masterfile harga.', 403)
  }

  const { data: body, error: bodyError } = await readJsonBody<Record<string, unknown>>(req)
  if (bodyError) return bodyError

  const parsed = validateMasterHargaPayload(body ?? {})
  if (!parsed.ok) return apiError('VALIDATION_ERROR', parsed.message, 400)

  const result = await createMasterHarga(parsed.data)
  if (result.error) return apiError('INTERNAL_ERROR', result.error.message, 500)
  return apiData(result.data, 201)
}
