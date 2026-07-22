import { NextRequest } from 'next/server'

import { requireOwnerAdminProfileApi } from '@/lib/api-auth'
import { apiData, apiError, apiUnauthorized, readJsonBody } from '@/lib/api-response'
import { getRabProjectMutationGate } from '@/lib/actions/rab'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'

type RabStatusAction = 'approve' | 'finalize'

type RabStatusRequestBody = {
  action?: unknown
}

function parseAction(value: unknown): RabStatusAction | null {
  return value === 'approve' || value === 'finalize' ? value : null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { profile, response: authResponse } = await requireOwnerAdminProfileApi('Hanya Owner/Admin yang boleh mengubah status RAB.')
  if (authResponse) return authResponse

  const { data: body, error: bodyError } = await readJsonBody<RabStatusRequestBody>(req)
  if (bodyError) return bodyError

  const action = parseAction(body?.action)
  if (!action) {
    return apiError('VALIDATION_ERROR', 'Aksi status RAB tidak valid.', 400)
  }

  const { canAccess, readiness, error: gateError } = await getRabProjectMutationGate(id, profile)

  if (gateError) return apiError('INTERNAL_ERROR', gateError.message, 500)
  if (!canAccess) return apiError('FORBIDDEN', 'Tidak punya akses RAB proyek ini.', 403)
  if (!readiness?.allowed) {
    return apiError('CONFLICT', 'Proyek belum siap untuk approval RAB/EE.', 409, readiness)
  }

  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return apiUnauthorized()

  const fn = action === 'approve' ? 'approve_rab_maker' : 'finalize_rab_maker'
  const { data, error } = await supabase.rpc(fn, {
    target_proyek_id: id,
  })

  if (error) return apiError('VALIDATION_ERROR', error.message, 400)

  return apiData({
    rab_maker_id: data,
    action,
  })
}
