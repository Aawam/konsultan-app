import { NextRequest } from 'next/server'
import { apiData, apiError, apiOk, readJsonBody } from '@/lib/api-response'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', 'Hanya Owner/Admin yang boleh mengubah dinas.', 403)
  }

  const { data: body, error: bodyError } = await readJsonBody<{ dinas?: string }>(req)
  if (bodyError) return bodyError

  const dinasBaru = body.dinas?.trim()

  if (!dinasBaru || dinasBaru.length < 2) {
    return apiError('VALIDATION_ERROR', 'Nama dinas minimal 2 karakter', 400)
  }

  const supabase = await createSupabaseServerClient()
  const { data: existing, error: existingError } = await supabase
    .from('dinas_skpd')
    .select('id, nama_dinas')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    return apiError('NOT_FOUND', existingError?.message ?? 'Dinas tidak ditemukan', 404)
  }

  const namaLama = (existing.nama_dinas as string).trim()

  const { error: proyekError } = await supabase
    .from('proyek')
    .update({ dinas: dinasBaru })
    .eq('dinas', namaLama)

  if (proyekError) return apiError('INTERNAL_ERROR', proyekError.message, 500)

  const { data, error } = await supabase
    .from('dinas_skpd')
    .update({ nama_dinas: dinasBaru })
    .eq('id', id)
    .select('id, nama_dinas')
    .single()

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiData({ id: data.id as string, dinas: data.nama_dinas as string })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { profile } = await getCurrentUserProfile()
  if (!isOwnerAdmin(profile)) {
    return apiError('FORBIDDEN', 'Hanya Owner/Admin yang boleh menghapus dinas.', 403)
  }

  const supabase = await createSupabaseServerClient()
  const { data: existing, error: existingError } = await supabase
    .from('dinas_skpd')
    .select('id, nama_dinas')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    return apiError('NOT_FOUND', existingError?.message ?? 'Dinas tidak ditemukan', 404)
  }

  const { count, error: countError } = await supabase
    .from('proyek')
    .select('*', { count: 'exact', head: true })
    .eq('dinas', existing.nama_dinas as string)
    .eq('is_deleted', false)

  if (countError) return apiError('INTERNAL_ERROR', countError.message, 500)
  if ((count ?? 0) > 0) {
    return apiError('CONFLICT', 'Dinas masih dipakai oleh proyek aktif dan tidak bisa dihapus.', 409)
  }

  const { error } = await supabase
    .from('dinas_skpd')
    .delete()
    .eq('id', id)

  if (error) return apiError('INTERNAL_ERROR', error.message, 500)
  return apiOk()
}
