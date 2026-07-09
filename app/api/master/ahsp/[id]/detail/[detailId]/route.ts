import { NextRequest } from 'next/server'

import { apiData, apiError, apiOk, readJsonBody } from '@/lib/api-response'
import { deleteAhspDetail, updateAhspDetail } from '@/lib/actions/ahsp'
import { requireOwnerAdminApi } from '@/lib/api-auth'
import { validateAhspDetailPayload } from '@/lib/validations/ahsp'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; detailId: string }> }
) {
  const { id, detailId } = await params
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh mengelola detail AHSP.')
  if (forbidden) return forbidden

  const { data: body, error: bodyError } = await readJsonBody<Record<string, unknown>>(req)
  if (bodyError) return bodyError

  const parsed = validateAhspDetailPayload(body ?? {})
  if (!parsed.ok) return apiError('VALIDATION_ERROR', parsed.message, 400)

  const { data, error } = await updateAhspDetail(id, detailId, parsed.data)
  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; detailId: string }> }
) {
  const { id, detailId } = await params
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh mengelola detail AHSP.')
  if (forbidden) return forbidden

  const { error } = await deleteAhspDetail(id, detailId)

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiOk()
}
