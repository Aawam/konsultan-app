import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Database } from '@/lib/database.types'
import type {
  AhspDetailRow,
  AhspItemRow,
  KategoriPekerjaanMasterRow,
  MasterHargaKind,
  MasterHargaRow,
  RelationValue,
  SatuanRow,
} from '@/lib/types/ahsp'
import type {
  AhspDetailPayload,
  AhspItemPayload,
  KategoriPayload,
  MasterHargaPayload,
  SatuanPayload,
} from '@/lib/validations/ahsp'

function firstRelation<T>(value: RelationValue<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export async function getSatuanList() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('satuan')
    .select('id, nama_satuan, created_at')
    .order('nama_satuan')

  return { data: (data ?? []) as SatuanRow[], error }
}

export async function getKategoriPekerjaanMasterList() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('kategori_pekerjaan_master')
    .select('id, nama_kategori, created_at')
    .order('nama_kategori')

  return { data: (data ?? []) as KategoriPekerjaanMasterRow[], error }
}

export async function createKategoriPekerjaanMaster(payload: KategoriPayload) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('kategori_pekerjaan_master')
    .insert(payload)
    .select('id, nama_kategori, created_at')
    .single()

  return { data, error }
}

export async function createSatuan(payload: SatuanPayload) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('satuan')
    .insert(payload)
    .select('id, nama_satuan, created_at')
    .single()

  return { data, error }
}

export async function getMasterHargaList(kind: MasterHargaKind) {
  const supabase = await createSupabaseServerClient()
  const table = kind === 'upah' ? 'master_upah' : kind === 'bahan' ? 'master_bahan' : 'master_alat'
  const nameColumn = kind === 'upah' ? 'nama_upah' : kind === 'bahan' ? 'nama_bahan' : 'nama_alat'

  const { data, error } = await supabase
    .from(table)
    .select(`id, ${nameColumn}, satuan_id, harga_dasar, updated_at, satuan:satuan_id (nama_satuan)`)
    .order(nameColumn)

  const rows = (data ?? []) as unknown as Array<
    Record<string, unknown> & { satuan: RelationValue<{ nama_satuan: string }> }
  >

  return {
    data: rows.map((row) => ({
      id: String(row.id),
      kind,
      nama: String(row[nameColumn] ?? ''),
      satuan_id: String(row.satuan_id ?? ''),
      satuan: firstRelation(row.satuan)?.nama_satuan ?? '-',
      harga_dasar: Number(row.harga_dasar ?? 0),
      updated_at: String(row.updated_at),
    })) satisfies MasterHargaRow[],
    error,
  }
}

export async function getAhspItemList() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('ahsp_items')
    .select(`
      id,
      kode_analisa,
      uraian_pekerjaan,
      bidang,
      sub_bidang,
      kategori_id,
      satuan_id,
      profit_persen_default,
      created_at,
      kategori:kategori_id (nama_kategori),
      satuan:satuan_id (nama_satuan)
    `)
    .order('kode_analisa')

  const rows = (data ?? []) as unknown as Array<
    Record<string, unknown> & {
      kategori: RelationValue<{ nama_kategori: string }>
      satuan: RelationValue<{ nama_satuan: string }>
    }
  >

  return {
    data: rows.map((row) => ({
      id: String(row.id),
      kode_analisa: String(row.kode_analisa ?? ''),
      uraian_pekerjaan: String(row.uraian_pekerjaan ?? ''),
      bidang: row.bidang === 'SDA' ? 'SDA' : 'CK',
      sub_bidang: row.sub_bidang ? String(row.sub_bidang) : null,
      kategori_id: String(row.kategori_id ?? ''),
      kategori: firstRelation(row.kategori)?.nama_kategori ?? '-',
      satuan_id: String(row.satuan_id ?? ''),
      satuan: firstRelation(row.satuan)?.nama_satuan ?? '-',
      profit_persen_default: Number(row.profit_persen_default ?? 0),
      created_at: String(row.created_at),
    })) satisfies AhspItemRow[],
    error,
  }
}

export async function createAhspItem(payload: AhspItemPayload) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('ahsp_items')
    .insert(payload)
    .select('id')
    .single()

  return { data, error }
}

export async function updateAhspItem(id: string, payload: AhspItemPayload) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('ahsp_items')
    .update(payload)
    .eq('id', id)
    .select('id')
    .single()

  return { data, error }
}

export async function createMasterHarga(payload: MasterHargaPayload) {
  const supabase = await createSupabaseServerClient()
  const basePayload = {
    satuan_id: payload.satuan_id,
    harga_dasar: payload.harga_dasar,
  }

  const result =
    payload.kind === 'upah'
      ? await supabase.from('master_upah').insert({ ...basePayload, nama_upah: payload.nama }).select('id').single()
      : payload.kind === 'bahan'
        ? await supabase.from('master_bahan').insert({ ...basePayload, nama_bahan: payload.nama }).select('id').single()
        : await supabase.from('master_alat').insert({ ...basePayload, nama_alat: payload.nama }).select('id').single()

  return { data: result.data, error: result.error }
}

export async function updateMasterHarga(id: string, payload: MasterHargaPayload) {
  const supabase = await createSupabaseServerClient()
  const basePayload = {
    satuan_id: payload.satuan_id,
    harga_dasar: payload.harga_dasar,
    updated_at: new Date().toISOString(),
  }

  const result =
    payload.kind === 'upah'
      ? await supabase.from('master_upah').update({ ...basePayload, nama_upah: payload.nama }).eq('id', id).select('id').single()
      : payload.kind === 'bahan'
        ? await supabase.from('master_bahan').update({ ...basePayload, nama_bahan: payload.nama }).eq('id', id).select('id').single()
        : await supabase.from('master_alat').update({ ...basePayload, nama_alat: payload.nama }).eq('id', id).select('id').single()

  return { data: result.data, error: result.error }
}

type HargaRelation = {
  nama_upah?: string
  nama_bahan?: string
  nama_alat?: string
  harga_dasar: number
  satuan: RelationValue<{ nama_satuan: string }>
}

export async function getAhspDetailList() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('ahsp_details')
    .select(`
      id,
      ahsp_item_id,
      komponen_tipe,
      upah_id,
      bahan_id,
      alat_id,
      koefisien,
      upah:upah_id (nama_upah, harga_dasar, satuan:satuan_id (nama_satuan)),
      bahan:bahan_id (nama_bahan, harga_dasar, satuan:satuan_id (nama_satuan)),
      alat:alat_id (nama_alat, harga_dasar, satuan:satuan_id (nama_satuan))
    `)
    .order('ahsp_item_id')
    .order('komponen_tipe')

  const rows = (data ?? []) as unknown as Array<
    Record<string, unknown> & {
      upah: RelationValue<HargaRelation>
      bahan: RelationValue<HargaRelation>
      alat: RelationValue<HargaRelation>
    }
  >

  return {
    data: rows.map((row) => {
      const tipe = row.komponen_tipe === 'bahan' || row.komponen_tipe === 'alat' ? row.komponen_tipe : 'upah'
      const relation =
        tipe === 'upah'
          ? firstRelation(row.upah)
          : tipe === 'bahan'
            ? firstRelation(row.bahan)
            : firstRelation(row.alat)
      const koefisien = Number(row.koefisien ?? 0)
      const hargaDasar = Number(relation?.harga_dasar ?? 0)

      return {
        id: String(row.id),
        ahsp_item_id: String(row.ahsp_item_id),
        komponen_tipe: tipe,
        komponen_id: String(tipe === 'upah' ? row.upah_id : tipe === 'bahan' ? row.bahan_id : row.alat_id),
        nama_komponen:
          tipe === 'upah'
            ? relation?.nama_upah ?? '-'
            : tipe === 'bahan'
              ? relation?.nama_bahan ?? '-'
              : relation?.nama_alat ?? '-',
        satuan: firstRelation(relation?.satuan ?? null)?.nama_satuan ?? '-',
        harga_dasar: hargaDasar,
        koefisien,
        jumlah_harga_dasar: koefisien * hargaDasar,
      }
    }) satisfies AhspDetailRow[],
    error,
  }
}

type AhspDetailInsert = Database['public']['Tables']['ahsp_details']['Insert']
type AhspDetailUpdate = Database['public']['Tables']['ahsp_details']['Update']

function buildAhspDetailComponentPayload(payload: AhspDetailPayload) {
  return {
    komponen_tipe: payload.komponen_tipe,
    upah_id: payload.komponen_tipe === 'upah' ? payload.komponen_id : null,
    bahan_id: payload.komponen_tipe === 'bahan' ? payload.komponen_id : null,
    alat_id: payload.komponen_tipe === 'alat' ? payload.komponen_id : null,
    koefisien: payload.koefisien,
  }
}

export async function createAhspDetail(ahspItemId: string, payload: AhspDetailPayload) {
  const supabase = await createSupabaseServerClient()
  const insertPayload = {
    ...buildAhspDetailComponentPayload(payload),
    ahsp_item_id: ahspItemId,
  } satisfies AhspDetailInsert
  const { data, error } = await supabase
    .from('ahsp_details')
    .insert(insertPayload)
    .select('id')
    .single()

  return { data, error }
}

export async function updateAhspDetail(ahspItemId: string, detailId: string, payload: AhspDetailPayload) {
  const supabase = await createSupabaseServerClient()
  const updatePayload = buildAhspDetailComponentPayload(payload) satisfies AhspDetailUpdate
  const { data, error } = await supabase
    .from('ahsp_details')
    .update(updatePayload)
    .eq('id', detailId)
    .eq('ahsp_item_id', ahspItemId)
    .select('id')
    .single()

  return { data, error }
}

export async function deleteAhspDetail(ahspItemId: string, detailId: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('ahsp_details')
    .delete()
    .eq('id', detailId)
    .eq('ahsp_item_id', ahspItemId)

  return { error }
}
