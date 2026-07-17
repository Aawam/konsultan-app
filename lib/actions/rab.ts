import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { CurrentUserProfile } from '@/lib/auth-types'
import { isOwnerAdmin } from '@/lib/auth-types'
import type {
  AhspItemRow,
  AvailableAhspForRabResult,
  RabMakerHeader,
  RabMakerItemDetailRow,
  RabMakerItemRow,
  RabMakerSnapshot,
  RabProjectListPage,
  RabProjectListItem,
  RelationValue,
} from '@/lib/types/ahsp'
import {
  DEFAULT_PROYEK_LIST_PAGE_SIZE,
  getDaftarProyekPage,
  getProyekById,
  type ProyekListFilters,
} from '@/lib/actions/proyek'
import { evaluateProjectRabReadiness } from '@/lib/project-completeness'
import { getRabMakerLockState, type RabMakerLockState } from '@/lib/rab-lock'

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

export const RAB_PROJECT_LIST_PAGE_SIZES = [10, 25, 50] as const
export const DEFAULT_RAB_PROJECT_LIST_PAGE_SIZE = DEFAULT_PROYEK_LIST_PAGE_SIZE

export type RabProjectListFilters = {
  page: number
  pageSize: number
  search: string
}

function normalizeRabProjectListFilters(filters: RabProjectListFilters) {
  const pageSize = RAB_PROJECT_LIST_PAGE_SIZES.includes(filters.pageSize as (typeof RAB_PROJECT_LIST_PAGE_SIZES)[number])
    ? filters.pageSize
    : DEFAULT_RAB_PROJECT_LIST_PAGE_SIZE
  const page = Number.isFinite(filters.page) && filters.page > 0 ? Math.floor(filters.page) : 1

  return {
    page,
    pageSize,
    from: (page - 1) * pageSize,
    to: page * pageSize - 1,
    search: filters.search.trim(),
  }
}

function toRabProjectListItem(project: {
  id: string
  nama_proyek: string
  jenis_pekerjaan: string
  kategori_pekerjaan?: string | null
  tahun_anggaran: number
  dinas: string
  lokasi_kecamatan: string | null
  tahap_progress: string | null
  persentase_progress: number | null
}): RabProjectListItem {
  return {
    id: project.id,
    nama_proyek: project.nama_proyek,
    jenis_pekerjaan: project.jenis_pekerjaan,
    kategori_pekerjaan: project.kategori_pekerjaan ?? '',
    tahun_anggaran: project.tahun_anggaran,
    dinas: project.dinas,
    lokasi_kecamatan: project.lokasi_kecamatan,
    tahap_progress: project.tahap_progress,
    persentase_progress: project.persentase_progress,
  }
}

export async function getRabProjectListPage(
  profile: CurrentUserProfile | null,
  filters: RabProjectListFilters
) {
  const supabase = await createSupabaseServerClient()
  const normalized = normalizeRabProjectListFilters(filters)

  if (!profile) {
    return {
      data: {
        rows: [],
        total: 0,
        page: 1,
        pageSize: normalized.pageSize,
        pageCount: 1,
      } satisfies RabProjectListPage,
      error: null,
    }
  }

  if (!isOwnerAdmin(profile)) {
    const proyekFilters: ProyekListFilters = {
      page: normalized.page,
      pageSize: normalized.pageSize,
      year: 'semua',
      jenis: 'Perencanaan',
      status: 'Semua',
      progress: 'semua',
      perusahaanId: 'Semua',
      search: normalized.search,
    }
    const { data, error } = await getDaftarProyekPage(proyekFilters, { includeSensitive: false })

    return {
      data: {
        rows: (data?.rows ?? []).map(toRabProjectListItem),
        total: data?.total ?? 0,
        page: data?.page ?? normalized.page,
        pageSize: data?.pageSize ?? normalized.pageSize,
        pageCount: data?.pageCount ?? 1,
      } satisfies RabProjectListPage,
      error,
    }
  }

  let query = supabase
    .from('proyek')
    .select(RAB_PROJECT_SELECT, { count: 'exact' })
    .eq('is_deleted', false)
    .eq('jenis_pekerjaan', 'Perencanaan')

  if (normalized.search) {
    const escaped = normalized.search.replaceAll('%', '\\%').replaceAll('_', '\\_')
    query = query.or([
      `nama_proyek.ilike.%${escaped}%`,
      `dinas.ilike.%${escaped}%`,
      `lokasi_kecamatan.ilike.%${escaped}%`,
      `kategori_pekerjaan.ilike.%${escaped}%`,
    ].join(','))
  }

  const { data, error, count } = await query
    .order('tahun_anggaran', { ascending: false })
    .order('nama_proyek')
    .range(normalized.from, normalized.to)

  const total = count ?? 0
  const pageCount = Math.max(1, Math.ceil(total / normalized.pageSize))

  return {
    data: {
      rows: ((data ?? []) as RabProjectListItem[]).map(toRabProjectListItem),
      total,
      page: Math.min(normalized.page, pageCount),
      pageSize: normalized.pageSize,
      pageCount,
    } satisfies RabProjectListPage,
    error,
  }
}

export async function getRabProjectList(profile: CurrentUserProfile | null) {
  const { data, error } = await getRabProjectListPage(profile, {
    page: 1,
    pageSize: DEFAULT_RAB_PROJECT_LIST_PAGE_SIZE,
    search: '',
  })

  return { data: data?.rows ?? [], error }
}

export async function canAccessRabProject(projectId: string, profile: CurrentUserProfile | null) {
  if (!profile) return false

  const { data, error } = await getProyekById(projectId, { includeSensitive: isOwnerAdmin(profile) })
  if (error) return false
  return Boolean(data && data.jenis_pekerjaan === 'Perencanaan')
}

export async function getRabProjectMutationGate(projectId: string, profile: CurrentUserProfile | null) {
  if (!profile) {
    return {
      canAccess: false,
      readiness: null,
      error: null,
    }
  }

  const { data: project, error } = await getProyekById(projectId, { includeSensitive: false })
  if (error) {
    return {
      canAccess: false,
      readiness: null,
      error,
    }
  }

  const readiness = project
    ? evaluateProjectRabReadiness(project, { includeCommercial: false })
    : null

  return {
    canAccess: Boolean(project && project.jenis_pekerjaan === 'Perencanaan'),
    readiness,
    error: null,
  }
}

export async function getRabMakerSnapshotByProyekId(projectId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: maker, error: makerError } = await supabase
    .from('rab_maker')
    .select('id, proyek_id, status, ppn_persen, subtotal, ppn_nilai, total_final, validated_by, validated_at, finalized_by, finalized_at, updated_at')
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
    validated_by: maker.validated_by,
    validated_at: maker.validated_at,
    finalized_by: maker.finalized_by,
    finalized_at: maker.finalized_at,
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

export async function getRabMakerEditGateByProyekId(
  projectId: string,
  client?: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<{
  data: RabMakerLockState
  error: { message: string; code?: string } | null
}> {
  const supabase = client ?? await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('rab_maker')
    .select('status')
    .eq('proyek_id', projectId)
    .maybeSingle()

  if (error) {
    return {
      data: getRabMakerLockState(null),
      error,
    }
  }

  return {
    data: getRabMakerLockState(data?.status ?? null),
    error: null,
  }
}

export type AvailableAhspForRabFilters = {
  query?: string
  bidang?: 'CK' | 'SDA' | 'all'
  kategoriId?: string
  limit?: number
}

export type RabAuditTimelineEvent = {
  id: string
  source: 'workflow' | 'rab' | 'export'
  title: string
  description: string
  actor: string | null
  occurred_at: string
}

export async function getRabAuditTimelineByProyekId(projectId: string) {
  const supabase = await createSupabaseServerClient()
  const [overrideResult, rabAuditResult, exportResult] = await Promise.all([
    supabase
      .from('override_log')
      .select('id, field_dioverride, nilai_sebelum, nilai_sesudah, alasan, dilakukan_oleh, dilakukan_pada')
      .eq('proyek_id', projectId)
      .order('dilakukan_pada', { ascending: false })
      .limit(20),
    supabase
      .from('rab_audit_log')
      .select('id, aksi, metadata, user_id, created_at')
      .eq('proyek_id', projectId)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('rab_export_history')
      .select('id, version_number, export_format, file_name, file_size_bytes, exported_at, exported_by')
      .eq('proyek_id', projectId)
      .order('exported_at', { ascending: false })
      .limit(20),
  ])

  const error = overrideResult.error ?? rabAuditResult.error ?? exportResult.error
  if (error) return { data: [], error }

  const overrideEvents = (overrideResult.data ?? []).map((row) => ({
    id: `workflow:${row.id}`,
    source: 'workflow' as const,
    title: row.field_dioverride,
    description: `${row.nilai_sebelum ?? '-'} -> ${row.nilai_sesudah ?? '-'} · ${row.alasan}`,
    actor: row.dilakukan_oleh,
    occurred_at: row.dilakukan_pada,
  }))

  const rabEvents = (rabAuditResult.data ?? []).map((row) => ({
    id: `rab:${row.id}`,
    source: 'rab' as const,
    title: row.aksi,
    description: typeof row.metadata === 'object' && row.metadata !== null
      ? JSON.stringify(row.metadata)
      : '-',
    actor: row.user_id,
    occurred_at: row.created_at,
  }))

  const exportEvents = (exportResult.data ?? []).map((row) => ({
    id: `export:${row.id}`,
    source: 'export' as const,
    title: `Export ${String(row.export_format).toUpperCase()} v${row.version_number}`,
    description: `${row.file_name} · ${Number(row.file_size_bytes ?? 0).toLocaleString('id-ID')} byte`,
    actor: row.exported_by,
    occurred_at: row.exported_at,
  }))

  const events = [...overrideEvents, ...rabEvents, ...exportEvents]
    .sort((left, right) => new Date(right.occurred_at).getTime() - new Date(left.occurred_at).getTime())
    .slice(0, 40) satisfies RabAuditTimelineEvent[]

  return { data: events, error: null }
}

function normalizeAhspSearchFilters(filters: AvailableAhspForRabFilters = {}) {
  const limit = Number.isFinite(filters.limit) ? Number(filters.limit) : 25

  return {
    query: filters.query?.trim() ?? '',
    bidang: filters.bidang === 'CK' || filters.bidang === 'SDA' ? filters.bidang : 'all',
    kategoriId: filters.kategoriId && filters.kategoriId !== 'all' ? filters.kategoriId : 'all',
    limit: Math.min(Math.max(Math.floor(limit), 1), 50),
  }
}

function mapAhspItemRows(
  rows: Array<
    Record<string, unknown> & {
      kategori: RelationValue<{ nama_kategori: string }>
      satuan: RelationValue<{ nama_satuan: string }>
    }
  >
) {
  return rows.map((row) => ({
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
  })) satisfies AhspItemRow[]
}

export async function getAvailableAhspForRab(
  projectId: string,
  filters: AvailableAhspForRabFilters = {}
) {
  const supabase = await createSupabaseServerClient()
  const normalized = normalizeAhspSearchFilters(filters)
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

  let query = supabase
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
    `, { count: 'exact' })

  if (usedIds.size > 0) {
    query = query.not('id', 'in', `(${Array.from(usedIds).join(',')})`)
  }

  if (normalized.bidang !== 'all') {
    query = query.eq('bidang', normalized.bidang)
  }

  if (normalized.kategoriId !== 'all') {
    query = query.eq('kategori_id', normalized.kategoriId)
  }

  if (normalized.query) {
    const escaped = normalized.query.replaceAll('%', '\\%').replaceAll('_', '\\_')
    query = query.or(`kode_analisa.ilike.%${escaped}%,uraian_pekerjaan.ilike.%${escaped}%`)
  }

  const { data, error, count } = await query
    .order('kode_analisa')
    .range(0, normalized.limit - 1)

  const rows = (data ?? []) as unknown as Array<
    Record<string, unknown> & {
      kategori: RelationValue<{ nama_kategori: string }>
      satuan: RelationValue<{ nama_satuan: string }>
    }
  >

  return {
    data: {
      rows: mapAhspItemRows(rows),
      total: count ?? 0,
      limit: normalized.limit,
    } satisfies AvailableAhspForRabResult,
    error,
  }
}
