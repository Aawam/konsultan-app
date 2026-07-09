import { NextRequest } from 'next/server'

import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'
import { updateAhspItem } from '@/lib/actions/ahsp'
import { validateAhspItemPayload } from '@/lib/validations/ahsp'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', 'Hanya Owner/Admin yang boleh mengelola Masterfile AHSP.', 403)
  }

  const { data: body, error: bodyError } = await readJsonBody<Record<string, unknown>>(req)
  if (bodyError) return bodyError

  const parsed = validateAhspItemPayload(body ?? {})
  if (!parsed.ok) return apiError('VALIDATION_ERROR', parsed.message, 400)

  const { data, error } = await updateAhspItem(id, parsed.data)
  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData(data)
}
