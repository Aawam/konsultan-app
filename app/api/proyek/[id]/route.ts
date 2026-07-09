import { NextRequest, NextResponse } from 'next/server'
import { apiData, apiError, apiOk, readJsonBody } from '@/lib/api-response'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { buildProyekPayload, getOverrideLogsByProyekId, getProyekById } from '@/lib/actions/proyek'
import { proyekSchema } from '@/lib/validations/proyek'
import type { ProyekFormData } from '@/lib/types/proyek'
import { parseNumberInput } from '@/lib/utils'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  const canViewCommercial = isOwnerAdmin(profile)

  const [{ data: proyek, error }, { data: overrideLogs }] = await Promise.all([
    getProyekById(id, { includeSensitive: canViewCommercial }),
    getOverrideLogsByProyekId(id),
  ])

  if (error || !proyek) {
    if (error && error.code !== 'PGRST116') {
      return apiError('INTERNAL_ERROR', error.message, 500)
    }

    return apiError('NOT_FOUND', 'Proyek tidak ditemukan.', 404)
  }

  return NextResponse.json({
    proyek,
    overrideLogs: overrideLogs ?? [],
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', 'Hanya Owner/Admin yang boleh mengubah proyek.', 403)
  }

  const { data: form, error: bodyError } = await readJsonBody<ProyekFormData>(req)
  if (bodyError) return bodyError

  const supabase = await createSupabaseServerClient()

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
    .select()
    .single()

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', 'Hanya Owner/Admin yang boleh menghapus proyek.', 403)
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('proyek')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiOk()
}
