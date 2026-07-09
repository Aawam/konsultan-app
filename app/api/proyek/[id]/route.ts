import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'
import { buildProyekPayload } from '@/lib/actions/proyek'
import { apiData, apiError, apiOk } from '@/lib/api-response'
import {
  OVERRIDE_LOG_SELECT,
  PROYEK_DETAIL_SELECT,
  PROYEK_MUTATION_RETURN_SELECT,
} from '@/lib/queries/proyek-selects'
import { proyekSchema } from '@/lib/validations/proyek'
import type { ProyekFormData } from '@/lib/types/proyek'
import { parseNumberInput } from '@/lib/utils'
import { requireOwnerAdminApi } from '@/lib/api-auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    { data: proyek, error },
    { data: overrideLogs, error: overrideError },
  ] = await Promise.all([
    supabase
      .from('proyek')
      .select(PROYEK_DETAIL_SELECT)
      .eq('id', id)
      .eq('is_deleted', false)
      .single(),
    supabase
      .from('override_log')
      .select(OVERRIDE_LOG_SELECT)
      .eq('proyek_id', id)
      .order('dilakukan_pada', { ascending: false }),
  ])

  if (error || !proyek) {
    if (error && error.code !== 'PGRST116') {
      return apiError('INTERNAL_ERROR', error.message, 500)
    }

    return apiError('NOT_FOUND', 'Proyek tidak ditemukan.', 404)
  }

  if (overrideError) {
    return NextResponse.json({ error: overrideError.message }, { status: 500 })
  }

  return NextResponse.json({ proyek, overrideLogs: overrideLogs ?? [] })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const form = await req.json() as ProyekFormData
  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
  return apiData(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh menghapus proyek.')
  if (forbidden) return forbidden

  const { error } = await supabase
    .from('proyek')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiOk()
}
