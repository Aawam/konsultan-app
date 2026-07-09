import { NextRequest } from 'next/server'

import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { createAhspDetail } from '@/lib/actions/ahsp'
import { requireOwnerAdminApi } from '@/lib/api-auth'
import { validateAhspDetailPayload } from '@/lib/validations/ahsp'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh mengelola detail AHSP.')
  if (forbidden) return forbidden

  const { data: body, error: bodyError } = await readJsonBody<Record<string, unknown>>(req)
  if (bodyError) return bodyError

  const parsed = validateAhspDetailPayload(body ?? {})
  if (!parsed.ok) return apiError('VALIDATION_ERROR', parsed.message, 400)

  const { data, error } = await createAhspDetail(id, parsed.data)
  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData(data, 201)
}
