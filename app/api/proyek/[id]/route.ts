import { NextRequest } from 'next/server'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'
import { buildProyekPayload, getOverrideLogsByProyekId, getProyekById } from '@/lib/actions/proyek'
import { apiData, apiError, apiOk, apiUnauthorized, readJsonBody } from '@/lib/api-response'
import { PROYEK_MUTATION_RETURN_SELECT } from '@/lib/queries/proyek-selects'
import { proyekSchema } from '@/lib/validations/proyek'
import type { ProyekFormData } from '@/lib/types/proyek'
import { parseNumberInput } from '@/lib/utils'
import { requireCurrentUserProfileApi, requireOwnerAdminApi } from '@/lib/api-auth'
import { invalidateProyekCache } from '@/lib/cache-invalidation'
import { isOwnerAdmin } from '@/lib/auth-types'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { profile, response } = await requireCurrentUserProfileApi()
  if (response) return response

  const includeSensitive = isOwnerAdmin(profile)
  const [{ data: proyek, error }, overrideResult] = await Promise.all([
    getProyekById(id, { includeSensitive }),
    includeSensitive
      ? getOverrideLogsByProyekId(id)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (error || !proyek) {
    if (error && error.code !== 'PGRST116') {
      return apiError('INTERNAL_ERROR', error.message, 500)
    }

    return apiError('NOT_FOUND', 'Proyek tidak ditemukan.', 404)
  }

  if (overrideResult.error) {
    return apiError('INTERNAL_ERROR', overrideResult.error.message, 500)
  }

  return apiData({ proyek, overrideLogs: overrideResult.data ?? [] })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data: body, error: bodyError } = await readJsonBody<ProyekFormData>(req)
  if (bodyError) return bodyError
  if (!body) return apiError('VALIDATION_ERROR', 'Body request wajib diisi.', 400)

  const form = body
  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return apiUnauthorized()
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh mengubah proyek.')
  if (forbidden) return forbidden

  const parsed = proyekSchema.safeParse({
    ...form,
    id,
    pagu_dana: parseNumberInput(form.pagu_dana),
    hps: form.hps ? parseNumberInput(form.hps) : null,
    nilai_penawaran: form.nilai_penawaran ? parseNumberInput(form.nilai_penawaran) : null,
    status_proyek: form.status_proyek || null,
  })

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return apiError('VALIDATION_ERROR', message, 400, parsed.error.flatten())
  }

  const { data, error } = await supabase
    .from('proyek')
    .update(buildProyekPayload(form))
    .eq('id', id)
    .eq('is_deleted', false)
    .select(PROYEK_MUTATION_RETURN_SELECT)
    .single()

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  invalidateProyekCache()
  return apiData(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return apiUnauthorized()
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh menghapus proyek.')
  if (forbidden) return forbidden

  const { error } = await supabase
    .from('proyek')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  invalidateProyekCache()
  return apiOk()
}
