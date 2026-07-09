import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'
import { apiError, apiOk, readJsonBody } from '@/lib/api-response'
import { requireOwnerAdminApi } from '@/lib/api-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh menyimpan override proyek.')
  if (forbidden) return forbidden

  const { data: body, error: bodyError } = await readJsonBody<{
    warnings?: string[]
    alasan?: string
  }>(req)
  if (bodyError) return bodyError

  const { warnings, alasan } = body

  if (!warnings?.length || !alasan?.trim()) {
    return apiError('VALIDATION_ERROR', 'warnings and alasan are required', 400)
  }

  const { supabase, user, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
