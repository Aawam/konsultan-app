import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { AhspImportDatabaseSnapshot } from '@/lib/ahsp-import'

type QueryError = { message: string }

function names<T extends Record<string, unknown>>(rows: T[] | null, column: keyof T) {
  return (rows ?? []).map((row) => String(row[column] ?? '')).filter(Boolean)
}

export async function getAhspImportDatabaseSnapshot(): Promise<{
  data: AhspImportDatabaseSnapshot | null
  error: QueryError | null
}> {
  const supabase = await createSupabaseServerClient()
  const [
    satuan,
    kategori,
    upah,
    bahan,
    alat,
    ahsp,
  ] = await Promise.all([
    supabase.from('satuan').select('nama_satuan'),
    supabase.from('kategori_pekerjaan_master').select('nama_kategori'),
    supabase.from('master_upah').select('nama_upah'),
    supabase.from('master_bahan').select('nama_bahan'),
    supabase.from('master_alat').select('nama_alat'),
    supabase.from('ahsp_items').select('kode_analisa'),
  ])

  const error = satuan.error ?? kategori.error ?? upah.error ?? bahan.error ?? alat.error ?? ahsp.error
  if (error) return { data: null, error }

  return {
    data: {
      satuan: names(satuan.data, 'nama_satuan'),
      kategori: names(kategori.data, 'nama_kategori'),
      masterUpah: names(upah.data, 'nama_upah'),
      masterBahan: names(bahan.data, 'nama_bahan'),
      masterAlat: names(alat.data, 'nama_alat'),
      ahspCodes: names(ahsp.data, 'kode_analisa'),
    },
    error: null,
  }
}
