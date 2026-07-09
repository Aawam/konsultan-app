import { NextRequest } from 'next/server'

import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { updateMasterHarga } from '@/lib/actions/ahsp'
import { requireOwnerAdminApi } from '@/lib/api-auth'
import { validateMasterHargaPayload } from '@/lib/validations/ahsp'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh mengelola Masterfile harga.')
  if (forbidden) return forbidden

  const { data: body, error: bodyError } = await readJsonBody<Record<string, unknown>>(req)
  if (bodyError) return bodyError

  const parsed = validateMasterHargaPayload(body ?? {})
  if (!parsed.ok) return apiError('VALIDATION_ERROR', parsed.message, 400)

  const result = await updateMasterHarga(id, parsed.data)
  if (result.error) return apiError('INTERNAL_ERROR', result.error.message, 500)
  return apiData(result.data)
}
