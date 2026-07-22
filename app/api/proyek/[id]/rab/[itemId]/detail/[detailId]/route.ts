import { NextRequest } from 'next/server'

import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import {
  assertRabDetailBelongsToProject,
  getRabMakerEditGateByProyekId,
  getRabProjectMutationGate,
} from '@/lib/actions/rab'
import { requireCurrentUserProfileApi } from '@/lib/api-auth'
import { normalizeOverrideReason, parseRabDecimalInput } from '@/lib/rab-maker'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; detailId: string }> }
) {
  const { id, itemId, detailId } = await params
  const { profile, response: authResponse } = await requireCurrentUserProfileApi()
  if (authResponse) return authResponse

  const { canAccess, readiness, error: gateError } = await getRabProjectMutationGate(id, profile)

  if (gateError) return apiError('INTERNAL_ERROR', gateError.message, 500)

  if (!canAccess) {
    return apiError('FORBIDDEN', 'Tidak punya akses RAB proyek ini.', 403)
  }

  if (!readiness?.allowed) {
    return apiError(
      'CONFLICT',
      'Proyek belum siap untuk perubahan RAB/EE.',
      409,
      readiness
    )
  }

  const { data: body, error: bodyError } = await readJsonBody<{
    harga_dasar_final?: unknown
    override_reason?: unknown
  }>(req)
  if (bodyError) return bodyError

  const hargaDasar = parseRabDecimalInput(body?.harga_dasar_final)
  const reason = normalizeOverrideReason(body?.override_reason)

  if (hargaDasar === null || hargaDasar < 0) {
    return apiError('VALIDATION_ERROR', 'Harga dasar harus angka dan tidak boleh negatif.', 400)
  }

  const supabase = await createSupabaseServerClient()
  const binding = await assertRabDetailBelongsToProject(id, itemId, detailId, supabase)
  if (binding.error) return apiError('INTERNAL_ERROR', binding.error.message, 500)
  if (!binding.ok) return apiError('NOT_FOUND', 'Detail RAB tidak ditemukan pada item dan proyek ini.', 404)

  const { data: editGate, error: editGateError } = await getRabMakerEditGateByProyekId(id, supabase)

  if (editGateError) return apiError('INTERNAL_ERROR', editGateError.message, 500)
  if (editGate.locked) {
    return apiError('CONFLICT', editGate.message ?? 'RAB terkunci.', 409, editGate)
  }

  const { error } = await supabase.rpc(
    'update_rab_maker_detail_harga_dasar',
    { target_detail_id: detailId, new_harga_dasar: hargaDasar, override_reason: reason ?? undefined }
  )

  if (error) return apiError('VALIDATION_ERROR', error.message, 400)

  return apiData({ detail_id: detailId })
}
