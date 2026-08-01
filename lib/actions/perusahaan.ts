import { createSupabaseServerClient } from '@/lib/supabase-server'
import { CACHE_TAGS, cacheSuccessfulQuery } from '@/lib/query-cache'
import type { PerusahaanDetail } from '@/lib/types/perusahaan'

export type { PerusahaanDetail }

export async function getPerusahaanDetailList(cacheScope?: string) {
  const supabase = await createSupabaseServerClient()

  return cacheSuccessfulQuery(async () => {
    const { data, error } = await supabase
      .from('perusahaan')
      .select(`
        id, nama_perusahaan, adalah_perusahaan_sendiri,
        inisial_perusahaan, kota, kode_pos, npwp, telepon, email,
        nama_direktur, npwp_direktur, alamat,
        bank_nama, bank_rekening, bank_atas_nama
      `)
      .order('nama_perusahaan')

    return { data: data as PerusahaanDetail[] | null, error }
  }, {
    scope: cacheScope,
    keyParts: ['perusahaan-detail-list'],
    tags: [CACHE_TAGS.perusahaan],
  })
}

export async function getPerusahaanById(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('perusahaan')
    .select(`
      id, nama_perusahaan, adalah_perusahaan_sendiri,
      inisial_perusahaan, kota, kode_pos, npwp, telepon, email,
      nama_direktur, npwp_direktur, alamat,
      bank_nama, bank_rekening, bank_atas_nama
    `)
    .eq('id', id)
    .single()

  return { data: (data as PerusahaanDetail | null) ?? null, error }
}

export async function getProyekByPerusahaan(perusahaanId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('proyek')
    .select('id, nama_proyek, jenis_pekerjaan, tahun_anggaran, nilai_penawaran, tahap_progress, persentase_progress, dinas')
    .eq('perusahaan_id', perusahaanId)
    .eq('is_deleted', false)
    .order('tahun_anggaran', { ascending: false })

  return { data, error }
}
