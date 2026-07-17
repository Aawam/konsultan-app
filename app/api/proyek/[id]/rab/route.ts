import { NextRequest } from 'next/server'

import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { getCurrentUserProfile } from '@/lib/auth'
import {
  canAccessRabProject,
  getRabMakerEditGateByProyekId,
  getRabMakerSnapshotByProyekId,
  getRabProjectMutationGate,
} from '@/lib/actions/rab'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  const canAccess = await canAccessRabProject(id, profile)

  if (!canAccess) {
    return apiError('FORBIDDEN', 'Tidak punya akses RAB proyek ini.', 403)
  }

  const { data, error } = await getRabMakerSnapshotByProyekId(id)
  if (error) return apiError('INTERNAL_ERROR', error.message, 500)

  return apiData(data)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  const { data: body, error: bodyError } = await readJsonBody<{ ahsp_item_id?: string }>(req)
  if (bodyError) return bodyError

  const ahspItemId = body.ahsp_item_id?.trim()

  if (!ahspItemId) {
    return apiError('VALIDATION_ERROR', 'AHSP wajib dipilih.', 400)
  }

  const supabase = await createSupabaseServerClient()
  const { data: editGate, error: editGateError } = await getRabMakerEditGateByProyekId(id, supabase)

  if (editGateError) return apiError('INTERNAL_ERROR', editGateError.message, 500)
  if (editGate.locked) {
    return apiError('CONFLICT', editGate.message ?? 'RAB terkunci.', 409, editGate)
  }

  const { data, error } = await supabase.rpc(
    'create_rab_maker_from_ahsp',
    { target_proyek_id: id, source_ahsp_item_id: ahspItemId }
  )

  if (error) return apiError('VALIDATION_ERROR', error.message, 400)

  return apiData({ item_id: data }, 201)
}
