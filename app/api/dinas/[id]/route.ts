import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json() as { dinas?: string }
  const dinasBaru = body.dinas?.trim()

  if (!dinasBaru || dinasBaru.length < 2) {
    return NextResponse.json({ error: 'Nama dinas minimal 2 karakter' }, { status: 400 })
  }

  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: existing, error: existingError } = await supabase
    .from('dinas_skpd')
    .select('id, nama_dinas')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    return NextResponse.json({ error: existingError?.message ?? 'Dinas tidak ditemukan' }, { status: 404 })
  }

  const namaLama = (existing.nama_dinas as string).trim()

  const { error: proyekError } = await supabase
    .from('proyek')
    .update({ dinas: dinasBaru })
    .eq('dinas', namaLama)

  if (proyekError) return NextResponse.json({ error: proyekError.message }, { status: 500 })

  const { data, error } = await supabase
    .from('dinas_skpd')
    .update({ nama_dinas: dinasBaru })
    .eq('id', id)
    .select('id, nama_dinas')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { id: data.id as string, dinas: data.nama_dinas as string } })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: existing, error: existingError } = await supabase
    .from('dinas_skpd')
    .select('id, nama_dinas')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    return NextResponse.json({ error: existingError?.message ?? 'Dinas tidak ditemukan' }, { status: 404 })
  }

  const { count, error: countError } = await supabase
    .from('proyek')
    .select('*', { count: 'exact', head: true })
    .eq('dinas', existing.nama_dinas as string)
    .eq('is_deleted', false)

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Dinas masih dipakai oleh proyek aktif dan tidak bisa dihapus.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('dinas_skpd')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
