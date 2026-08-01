import { NextRequest } from 'next/server'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'
import { buildProyekPayload } from '@/lib/actions/proyek'
import { apiData, apiError, apiUnauthorized, readJsonBody } from '@/lib/api-response'
import { PROYEK_MUTATION_RETURN_SELECT } from '@/lib/queries/proyek-selects'
import { proyekSchema } from '@/lib/validations/proyek'
import type { ProyekFormData } from '@/lib/types/proyek'
import { parseNumberInput } from '@/lib/utils'
import { requireOwnerAdminApi } from '@/lib/api-auth'
import { invalidateProyekCache } from '@/lib/cache-invalidation'

export async function POST(req: NextRequest) {
  const { data: body, error: bodyError } = await readJsonBody<ProyekFormData>(req)
  if (bodyError) return bodyError
  if (!body) return apiError('VALIDATION_ERROR', 'Body request wajib diisi.', 400)

  const form = body
  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return apiUnauthorized()
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh menambah proyek.')
  if (forbidden) return forbidden

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
  invalidateProyekCache()
  return apiData(data, 201)
}
