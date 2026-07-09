import { NextRequest } from 'next/server'
import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { buildProyekPayload } from '@/lib/actions/proyek'
import { proyekSchema } from '@/lib/validations/proyek'
import type { ProyekFormData } from '@/lib/types/proyek'
import { parseNumberInput } from '@/lib/utils'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', 'Hanya Owner/Admin yang boleh membuat proyek.', 403)
  }

  const { data: form, error: bodyError } = await readJsonBody<ProyekFormData>(req)
  if (bodyError) return bodyError

  const supabase = await createSupabaseServerClient()

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
    .select()
    .single()

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData(data, 201)
}
