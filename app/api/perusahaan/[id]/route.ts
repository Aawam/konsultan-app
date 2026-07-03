import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'
import type { PerusahaanFormData } from '@/lib/types/perusahaan'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const form = await req.json() as PerusahaanFormData
  const nama = form.nama_perusahaan?.trim()

  if (!nama || nama.length < 3) {
    return NextResponse.json({ error: 'Nama perusahaan minimal 3 karakter' }, { status: 400 })
  }

  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = {
    nama_perusahaan: nama,
    adalah_perusahaan_sendiri: Boolean(form.adalah_perusahaan_sendiri),
    inisial_perusahaan: form.inisial_perusahaan?.trim() || null,
    kota: form.kota?.trim() || null,
    telepon: form.telepon?.trim() || null,
    email: form.email?.trim() || null,
    nama_direktur: form.nama_direktur?.trim() || null,
    alamat: form.alamat?.trim() || null,
  }

  const { data, error } = await supabase
    .from('perusahaan')
    .update(payload)
    .eq('id', id)
    .select(`
      id, nama_perusahaan, adalah_perusahaan_sendiri,
      inisial_perusahaan, kota, kode_pos, npwp, telepon, email,
      nama_direktur, npwp_direktur, alamat,
      bank_nama, bank_rekening, bank_atas_nama
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, authError } = await createAuthenticatedSupabaseServerClient()
  if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { count, error: countError } = await supabase
    .from('proyek')
    .select('*', { count: 'exact', head: true })
    .eq('perusahaan_id', id)

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Perusahaan masih dipakai oleh proyek dan tidak bisa dihapus.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('perusahaan')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
