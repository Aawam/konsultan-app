import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const body = await req.json() as { dinas?: string }
  const dinas = body.dinas?.trim()

  if (!dinas || dinas.length < 2) {
    return NextResponse.json({ error: 'Nama dinas minimal 2 karakter' }, { status: 400 })
  }

  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('dinas_skpd')
    .insert({ nama_dinas: dinas })
    .select('id, nama_dinas')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { id: data.id as string, dinas: data.nama_dinas as string } }, { status: 201 })
}
