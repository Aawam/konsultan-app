import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { CurrentUserProfile } from '@/lib/auth-types'
import { isOwnerAdmin } from '@/lib/auth-types'
import type {
  AhspItemRow,
  RabDraftRow,
  RabMakerHeader,
  RabMakerItemDetailRow,
  RabMakerItemRow,
  RabMakerSnapshot,
  RabProjectListItem,
  RabRekapRow,
  RelationValue,
} from '@/lib/types/ahsp'
import { getDaftarProyek, getProyekById } from '@/lib/actions/proyek'

function firstRelation<T>(value: RelationValue<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

const RAB_PROJECT_SELECT = `
  id,
  nama_proyek,
  jenis_pekerjaan,
  kategori_pekerjaan,
  tahun_anggaran,
  dinas,
  lokasi_kecamatan,
  tahap_progress,
  persentase_progress
`

export async function getRabProjectList(profile: CurrentUserProfile | null) {
  const supabase = await createSupabaseServerClient()
  if (!profile) return { data: [] as RabProjectListItem[], error: null }

  if (!isOwnerAdmin(profile)) {
    const { data, error } = await getDaftarProyek({ includeSensitive: false })
    return {
      data: (data ?? [])
        .filter((project) => project.jenis_pekerjaan === 'Perencanaan')
        .map((project) => ({
          id: project.id,
          nama_proyek: project.nama_proyek,
          jenis_pekerjaan: project.jenis_pekerjaan,
          kategori_pekerjaan: project.kategori_pekerjaan ?? '',
          tahun_anggaran: project.tahun_anggaran,
          dinas: project.dinas,
          lokasi_kecamatan: project.lokasi_kecamatan,
          tahap_progress: project.tahap_progress,
          persentase_progress: project.persentase_progress,
        })),
      error,
    }
  }

  const { data, error } = await supabase
    .from('proyek')
    .select(RAB_PROJECT_SELECT)
    .eq('is_deleted', false)
    .eq('jenis_pekerjaan', 'Perencanaan')
    .order('tahun_anggaran', { ascending: false })
    .order('nama_proyek')

  return { data: (data ?? []) as RabProjectListItem[], error }
}

export async function canAccessRabProject(projectId: string, profile: CurrentUserProfile | null) {
  if (!profile) return false
  if (isOwnerAdmin(profile)) return true

  const supabase = await createSupabaseServerClient()
  const { data: assignment, error: assignmentError } = await supabase
    .from('project_assignments')
    .select('proyek_id')
    .eq('proyek_id', projectId)
    .eq('user_id', profile.id)
    .maybeSingle()

  if (assignmentError || !assignment) return false

  const { data, error } = await getProyekById(projectId, { includeSensitive: false })
  if (error) return false
  return Boolean(data && data.jenis_pekerjaan === 'Perencanaan')
}

export async function getRabRekapByProyekId(projectId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('rab_rekap')
    .select('id, subtotal, margin_persen, overhead_persen, ppn_persen, pembulatan_rule, total_final, status')
    .eq('proyek_id', projectId)
    .maybeSingle()

  return { data: (data as RabRekapRow | null) ?? null, error }
}

export async function getRabDraftByProyekId(projectId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('rab_draft')
    .select(`
      id,
      volume,
      harga_satuan,
      jumlah_harga,
      urutan,
      ahsp_item:ahsp_item_id (
        kode_analisa,
        uraian_pekerjaan,
        satuan:satuan_id (nama_satuan)
      )
    `)
    .eq('proyek_id', projectId)
    .order('urutan')

  const rows = (data ?? []) as unknown as Array<
    Record<string, unknown> & {
      ahsp_item: RelationValue<{
        kode_analisa: string
        uraian_pekerjaan: string
        satuan: RelationValue<{ nama_satuan: string }>
      }>
    }
  >

  return {
    data: rows.map((row) => {
      const ahspItem = firstRelation(row.ahsp_item)
      return {
        id: String(row.id),
        kode_analisa: ahspItem?.kode_analisa ?? '-',
        uraian_pekerjaan: ahspItem?.uraian_pekerjaan ?? '-',
        satuan: firstRelation(ahspItem?.satuan ?? null)?.nama_satuan ?? '-',
        volume: Number(row.volume ?? 0),
        harga_satuan: Number(row.harga_satuan ?? 0),
        jumlah_harga: Number(row.jumlah_harga ?? 0),
        urutan: Number(row.urutan ?? 0),
      }
    }) satisfies RabDraftRow[],
    error,
  }
}

export async function getRabMakerSnapshotByProyekId(projectId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: maker, error: makerError } = await supabase
    .from('rab_maker')
    .select('id, proyek_id, status, ppn_persen, subtotal, ppn_nilai, total_final, updated_at')
    .eq('proyek_id', projectId)
    .maybeSingle()

  if (makerError) {
    return {
      data: { maker: null, items: [], detailsByItem: {} } satisfies RabMakerSnapshot,
      error: makerError,
    }
  }

  if (!maker) {
    return {
      data: { maker: null, items: [], detailsByItem: {} } satisfies RabMakerSnapshot,
      error: null,
    }
  }

  const makerHeader = {
    id: maker.id,
    proyek_id: maker.proyek_id,
    status: maker.status,
    ppn_persen: Number(maker.ppn_persen ?? 0),
    subtotal: Number(maker.subtotal ?? 0),
    ppn_nilai: Number(maker.ppn_nilai ?? 0),
    total_final: Number(maker.total_final ?? 0),
    updated_at: maker.updated_at,
  } satisfies RabMakerHeader

  const { data: itemData, error: itemError } = await supabase
    .from('rab_maker_items')
    .select(`
      id,
      rab_maker_id,
      source_ahsp_item_id,
      kode_analisa_snapshot,
      uraian_pekerjaan_snapshot,
      bidang_snapshot,
      sub_bidang_snapshot,
      kategori_snapshot,
      satuan_snapshot,
      volume,
      profit_persen_default,
      profit_persen_final,
      profit_override_reason,
      harga_dasar_total,
      profit_nilai,
      harga_satuan,
      jumlah_harga,
      koefisien_locked,
      urutan
    `)
    .eq('rab_maker_id', maker.id)
    .order('urutan')

  if (itemError) {
    return {
      data: { maker: makerHeader, items: [], detailsByItem: {} } satisfies RabMakerSnapshot,
      error: itemError,
    }
  }

  const items = (itemData ?? []).map((item) => ({
    id: item.id,
    rab_maker_id: item.rab_maker_id,
    source_ahsp_item_id: item.source_ahsp_item_id,
    kode_analisa_snapshot: item.kode_analisa_snapshot,
    uraian_pekerjaan_snapshot: item.uraian_pekerjaan_snapshot,
    bidang_snapshot: item.bidang_snapshot,
    sub_bidang_snapshot: item.sub_bidang_snapshot,
    kategori_snapshot: item.kategori_snapshot,
    satuan_snapshot: item.satuan_snapshot,
    volume: Number(item.volume ?? 0),
    profit_persen_default: Number(item.profit_persen_default ?? 0),
    profit_persen_final: Number(item.profit_persen_final ?? 0),
    profit_override_reason: item.profit_override_reason,
    harga_dasar_total: Number(item.harga_dasar_total ?? 0),
    profit_nilai: Number(item.profit_nilai ?? 0),
    harga_satuan: Number(item.harga_satuan ?? 0),
    jumlah_harga: Number(item.jumlah_harga ?? 0),
    koefisien_locked: Boolean(item.koefisien_locked),
    urutan: Number(item.urutan ?? 0),
  })) satisfies RabMakerItemRow[]

  if (items.length === 0) {
    return {
      data: { maker: makerHeader, items, detailsByItem: {} } satisfies RabMakerSnapshot,
      error: null,
    }
  }

  const { data: detailData, error: detailError } = await supabase
    .from('rab_maker_item_details')
    .select(`
      id,
      rab_maker_item_id,
      komponen_tipe,
      nama_komponen_snapshot,
      satuan_snapshot,
      koefisien_snapshot,
      koefisien_locked,
      harga_dasar_default,
      harga_dasar_final,
      harga_override_reason,
      jumlah_harga_dasar,
      urutan
    `)
    .in('rab_maker_item_id', items.map((item) => item.id))
    .order('urutan')

  if (detailError) {
    return {
      data: { maker: makerHeader, items, detailsByItem: {} } satisfies RabMakerSnapshot,
      error: detailError,
    }
  }

  const detailsByItem = (detailData ?? []).reduce<Record<string, RabMakerItemDetailRow[]>>((acc, detail) => {
    const row = {
      id: detail.id,
      rab_maker_item_id: detail.rab_maker_item_id,
      komponen_tipe: detail.komponen_tipe,
      nama_komponen_snapshot: detail.nama_komponen_snapshot,
      satuan_snapshot: detail.satuan_snapshot,
      koefisien_snapshot: Number(detail.koefisien_snapshot ?? 0),
      koefisien_locked: Boolean(detail.koefisien_locked),
      harga_dasar_default: Number(detail.harga_dasar_default ?? 0),
      harga_dasar_final: Number(detail.harga_dasar_final ?? 0),
      harga_override_reason: detail.harga_override_reason,
      jumlah_harga_dasar: Number(detail.jumlah_harga_dasar ?? 0),
      urutan: Number(detail.urutan ?? 0),
    } satisfies RabMakerItemDetailRow
    acc[row.rab_maker_item_id] = [...(acc[row.rab_maker_item_id] ?? []), row]
    return acc
  }, {})

  return {
    data: { maker: makerHeader, items, detailsByItem } satisfies RabMakerSnapshot,
    error: null,
  }
}

export async function getAvailableAhspForRab(projectId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: maker } = await supabase
    .from('rab_maker')
    .select('id')
    .eq('proyek_id', projectId)
    .maybeSingle()

  let usedIds = new Set<string>()
  if (maker) {
    const { data: usedItems } = await supabase
      .from('rab_maker_items')
      .select('source_ahsp_item_id')
      .eq('rab_maker_id', maker.id)
    usedIds = new Set((usedItems ?? []).map((item) => item.source_ahsp_item_id).filter(Boolean) as string[])
  }

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
    data: rows
      .filter((row) => !usedIds.has(String(row.id)))
      .map((row) => ({
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
