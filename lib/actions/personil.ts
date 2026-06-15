import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function getPersonilList() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('personil')
    .select('id, nama_lengkap, klasifikasi_skk, nomor_skk')
    .order('nama_lengkap')

  return { data, error }
}

export async function getPengalamanPerusahaan(perusahaanId?: string, kategori?: string) {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('pengalaman_perusahaan')
    .select(`
      id,
      nama_paket,
      pemberi_kerja,
      lokasi,
      nilai_kontrak,
      tanggal_mulai,
      tanggal_selesai,
      nomor_kontrak,
      kategori_pekerjaan
    `)
    .order('tanggal_mulai', { ascending: false })

  if (perusahaanId) {
    query = query.eq('perusahaan_id', perusahaanId)
  }

  if (kategori) {
    query = query.eq('kategori_pekerjaan', kategori)
  }

  const { data, error } = await query
  return { data, error }
}
