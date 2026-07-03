import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { warnings, alasan } = await req.json() as {
    warnings?: string[]
    alasan?: string
  }

  if (!warnings?.length || !alasan?.trim()) {
    return NextResponse.json({ error: 'warnings and alasan are required' }, { status: 400 })
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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
