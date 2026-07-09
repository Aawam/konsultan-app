import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'
import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', 'Hanya Owner/Admin yang boleh menambah dinas.', 403)
  }

  const { data: body, error: bodyError } = await readJsonBody<{ dinas?: string }>(req)
  if (bodyError) return bodyError

  const dinas = body.dinas?.trim()

  if (!dinas || dinas.length < 2) {
    return apiError('VALIDATION_ERROR', 'Nama dinas minimal 2 karakter', 400)
  }

  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('dinas_skpd')
    .insert({ nama_dinas: dinas })
    .select('id, nama_dinas')
    .single()

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData({ id: data.id as string, dinas: data.nama_dinas as string }, 201)
}
