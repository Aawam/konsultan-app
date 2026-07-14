import { NextRequest } from 'next/server'

import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { getRabMakerEditGateByProyekId, getRabProjectMutationGate } from '@/lib/actions/rab'
import { getCurrentUserProfile } from '@/lib/auth'
import { normalizeOverrideReason, parseRabDecimalInput } from '@/lib/rab-maker'
import { createSupabaseServerClient } from '@/lib/supabase-server'

type UpdateRabMakerDetailHargaRpcClient = {
  rpc: (
    fn: 'update_rab_maker_detail_harga_dasar',
    args: { target_detail_id: string; new_harga_dasar: number; override_reason: string | null }
  ) => Promise<{ data: null; error: { message: string } | null }>
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; detailId: string }> }
) {
  const { id, detailId } = await params
  const { profile } = await getCurrentUserProfile()
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
  const { data: editGate, error: editGateError } = await getRabMakerEditGateByProyekId(id, supabase)

  if (editGateError) return apiError('INTERNAL_ERROR', editGateError.message, 500)
  if (editGate.locked) {
    return apiError('CONFLICT', editGate.message ?? 'RAB terkunci.', 409, editGate)
  }

  const { error } = await (supabase as unknown as UpdateRabMakerDetailHargaRpcClient).rpc(
    'update_rab_maker_detail_harga_dasar',
    { target_detail_id: detailId, new_harga_dasar: hargaDasar, override_reason: reason }
  )

  if (error) return apiError('VALIDATION_ERROR', error.message, 400)

  return apiData({ detail_id: detailId })
}
