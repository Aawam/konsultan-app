import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'
import type { PerusahaanFormData } from '@/lib/types/perusahaan'

export async function POST(req: NextRequest) {
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
    .insert(payload)
    .select(`
      id, nama_perusahaan, adalah_perusahaan_sendiri,
      inisial_perusahaan, kota, kode_pos, npwp, telepon, email,
      nama_direktur, npwp_direktur, alamat,
      bank_nama, bank_rekening, bank_atas_nama
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
