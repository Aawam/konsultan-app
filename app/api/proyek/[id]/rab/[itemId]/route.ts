import { NextRequest } from 'next/server'

import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { getCurrentUserProfile } from '@/lib/auth'
import { canAccessRabProject } from '@/lib/actions/rab'
import { normalizeOverrideReason, parseRabDecimalInput } from '@/lib/rab-maker'
import { createSupabaseServerClient } from '@/lib/supabase-server'

type UpdateRabMakerRpcClient = {
  rpc: (
    fn: 'update_rab_maker_item_volume',
    args: { target_item_id: string; new_volume: number }
  ) => Promise<{ data: null; error: { message: string } | null }>
}

type UpdateRabMakerProfitRpcClient = {
  rpc: (
    fn: 'update_rab_maker_item_profit',
    args: { target_item_id: string; new_profit_persen: number; override_reason: string | null }
  ) => Promise<{ data: null; error: { message: string } | null }>
}

type DeleteRabMakerRpcClient = {
  rpc: (
    fn: 'delete_rab_maker_item',
    args: { target_item_id: string }
  ) => Promise<{ data: null; error: { message: string } | null }>
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params
  const { profile } = await getCurrentUserProfile()
  const canAccess = await canAccessRabProject(id, profile)

  if (!canAccess) {
    return apiError('FORBIDDEN', 'Tidak punya akses RAB proyek ini.', 403)
  }

  const { data: body, error: bodyError } = await readJsonBody<{
    volume?: unknown
    profit_persen_final?: unknown
    override_reason?: unknown
  }>(req)
  if (bodyError) return bodyError

  const supabase = await createSupabaseServerClient()

  if (body?.profit_persen_final !== undefined) {
    const profit = parseRabDecimalInput(body.profit_persen_final)
    const reason = normalizeOverrideReason(body.override_reason)

    if (profit === null || profit < 0) {
      return apiError('VALIDATION_ERROR', 'Profit harus angka dan tidak boleh negatif.', 400)
    }

    const { error } = await (supabase as unknown as UpdateRabMakerProfitRpcClient).rpc(
      'update_rab_maker_item_profit',
      { target_item_id: itemId, new_profit_persen: profit, override_reason: reason }
    )

    if (error) return apiError('VALIDATION_ERROR', error.message, 400)

    return apiData({ item_id: itemId })
  }

  const volume = parseRabDecimalInput(body?.volume)

  if (volume === null || volume < 0) {
    return apiError('VALIDATION_ERROR', 'Volume harus angka dan tidak boleh negatif.', 400)
  }

  const { error } = await (supabase as unknown as UpdateRabMakerRpcClient).rpc(
    'update_rab_maker_item_volume',
    { target_item_id: itemId, new_volume: volume }
  )

  if (error) return apiError('VALIDATION_ERROR', error.message, 400)

  return apiData({ item_id: itemId })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params
  const { profile } = await getCurrentUserProfile()
  const canAccess = await canAccessRabProject(id, profile)

  if (!canAccess) {
    return apiError('FORBIDDEN', 'Tidak punya akses RAB proyek ini.', 403)
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await (supabase as unknown as DeleteRabMakerRpcClient).rpc(
    'delete_rab_maker_item',
    { target_item_id: itemId }
  )

  if (error) return apiError('VALIDATION_ERROR', error.message, 400)

  return apiData({ item_id: itemId })
}
