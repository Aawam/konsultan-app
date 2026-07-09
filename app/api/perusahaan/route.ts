import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseServerClient } from '@/lib/supabase-server'
import type { PerusahaanFormData } from '@/lib/types/perusahaan'
import { apiData, apiError, readJsonBody } from '@/lib/api-response'
import { requireOwnerAdminApi } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const forbidden = await requireOwnerAdminApi('Hanya Owner/Admin yang boleh menambah perusahaan.')
  if (forbidden) return forbidden

  const { data: form, error: bodyError } = await readJsonBody<PerusahaanFormData>(req)
  if (bodyError) return bodyError

  const nama = form.nama_perusahaan?.trim()

  if (!nama || nama.length < 3) {
    return apiError('VALIDATION_ERROR', 'Nama perusahaan minimal 3 karakter', 400)
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

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData(data, 201)
}
