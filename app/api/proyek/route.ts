import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'
import { buildProyekPayload } from '@/lib/actions/proyek'
import { apiData, apiError } from '@/lib/api-response'
import { PROYEK_MUTATION_RETURN_SELECT } from '@/lib/queries/proyek-selects'
import { proyekSchema } from '@/lib/validations/proyek'
import type { ProyekFormData } from '@/lib/types/proyek'
import { parseNumberInput } from '@/lib/utils'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const form = await req.json() as ProyekFormData
  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', 'Hanya Owner/Admin yang boleh menambah proyek.', 403)
  }

  const parsed = proyekSchema.safeParse({
    ...form,
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
    .insert(buildProyekPayload(form))
    .select(PROYEK_MUTATION_RETURN_SELECT)
    .single()

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData(data, 201)
}
