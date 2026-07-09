import { NextRequest } from 'next/server'
import { apiError, apiOk, readJsonBody } from '@/lib/api-response'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', 'Hanya Owner/Admin yang boleh menyimpan override proyek.', 403)
  }

  const { data: body, error: bodyError } = await readJsonBody<{
    warnings?: string[]
    alasan?: string
  }>(req)
  if (bodyError) return bodyError

  const { warnings, alasan } = body

  if (!warnings?.length || !alasan?.trim()) {
    return apiError('VALIDATION_ERROR', 'warnings and alasan are required', 400)
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const now = new Date().toISOString()

  const [{ error: proyekError }, { error: logError }] = await Promise.all([
    supabase.from('proyek').update({ pernah_dioverride: true }).eq('id', id),
    supabase.from('override_log').insert(
      warnings.map((warning) => ({
        proyek_id: id,
        field_dioverride: warning,
        nilai_sebelum: '-',
        nilai_sesudah: '-',
        alasan,
        dilakukan_oleh: user?.email ?? 'Authenticated User',
        dilakukan_pada: now,
      }))
    ),
  ])

  const error = proyekError ?? logError
  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiOk()
}
