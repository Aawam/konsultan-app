import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getPersentaseFromFase } from '@/lib/constants/proyek'
import {
  OVERRIDE_LOG_SELECT,
  PROYEK_DETAIL_SELECT,
  PROYEK_LIST_SELECT,
  PROYEK_MUTATION_RETURN_SELECT,
} from '@/lib/queries/proyek-selects'
import type { DinasOption, ProyekDetail, ProyekDisplay, ProyekFormData, ProyekPayload } from '@/lib/types/proyek'
import type { ProjectJenisFilter, ProjectProgressFilter, ProjectStatusFilter, ProjectYearFilter } from '@/lib/proyek-analytics'
import { proyekSchema } from '@/lib/validations/proyek'
import { parseNumberInput } from '@/lib/utils'

// ── Queries ──────────────────────────────────────────────────────────────────

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export type ProyekListFilters = {
  page: number
  pageSize: number
  year: ProjectYearFilter
  jenis: ProjectJenisFilter
  status: ProjectStatusFilter
  progress: ProjectProgressFilter
  perusahaanId: string
  search: string
}

export type ProyekListPage = {
  rows: ProyekDisplay[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

export const DEFAULT_PROYEK_LIST_PAGE_SIZE = 25
export const PROYEK_LIST_PAGE_SIZES = [10, 25, 50, 100] as const

type ProyekTeknisRow = {
  id: string
  nama_proyek: string
  paket_pekerjaan_induk: string | null
  nomor_kontrak: string | null
  jenis_pekerjaan: string
  kategori_pekerjaan: string
  tahun_anggaran: number
  sumber_dana: string
  dinas: string
  lokasi_kecamatan: string | null
  nama_ppk: string | null
  perusahaan_id: string | null
  perusahaan_nama: string | null
  perusahaan_adalah_perusahaan_sendiri: boolean | null
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  durasi_hari: number | null
  tahap_progress: string | null
  persentase_progress: number | null
  pernah_dioverride: boolean | null
  status_proyek: 'Work' | 'Borrowed' | 'Get Borrowed' | null
  jalur_masuk: string | null
  created_at: string
  updated_at: string
  is_deleted: boolean | null
}

type ProyekTeknisRpcClient = {
  rpc: (
    fn: 'get_proyek_teknis',
    args?: { target_proyek_id?: string | null }
  ) => Promise<{
    data: ProyekTeknisRow[] | null
    error: { message: string; code?: string } | null
  }>
}

function toProyekDisplayFromTeknis(row: ProyekTeknisRow): ProyekDisplay {
  return {
    id: row.id,
    nama_proyek: row.nama_proyek,
    jenis_pekerjaan: row.jenis_pekerjaan,
    kategori_pekerjaan: row.kategori_pekerjaan,
    tahun_anggaran: row.tahun_anggaran,
    dinas: row.dinas,
    lokasi_kecamatan: row.lokasi_kecamatan,
    pagu_dana: null,
    nilai_penawaran: null,
    tahap_progress: row.tahap_progress,
    persentase_progress: row.persentase_progress,
    pernah_dioverride: row.pernah_dioverride ?? false,
    status_proyek: row.status_proyek,
    perusahaan_id: row.perusahaan_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_deleted: row.is_deleted ?? false,
    perusahaan: row.perusahaan_nama ? { nama_perusahaan: row.perusahaan_nama } : null,
  }
}

function toProyekDetailFromTeknis(row: ProyekTeknisRow): ProyekDetail {
  return {
    id: row.id,
    nama_proyek: row.nama_proyek,
    paket_pekerjaan_induk: row.paket_pekerjaan_induk,
    nomor_kontrak: row.nomor_kontrak,
    jenis_pekerjaan: row.jenis_pekerjaan,
    kategori_pekerjaan: row.kategori_pekerjaan,
    tahun_anggaran: row.tahun_anggaran,
    sumber_dana: row.sumber_dana,
    dinas: row.dinas,
    lokasi_kecamatan: row.lokasi_kecamatan,
    nama_ppk: row.nama_ppk,
    pagu_dana: null,
    hps: null,
    nilai_penawaran: null,
    perusahaan_id: row.perusahaan_id,
    tanggal_mulai: row.tanggal_mulai,
    tanggal_selesai: row.tanggal_selesai,
    durasi_hari: row.durasi_hari,
    tahap_progress: row.tahap_progress,
    persentase_progress: row.persentase_progress,
    pernah_dioverride: row.pernah_dioverride,
    status_proyek: row.status_proyek,
    jalur_masuk: row.jalur_masuk,
    catatan: null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_deleted: row.is_deleted,
    perusahaan: row.perusahaan_nama
      ? {
          nama_perusahaan: row.perusahaan_nama,
          adalah_perusahaan_sendiri: row.perusahaan_adalah_perusahaan_sendiri ?? false,
        }
      : null,
  }
}

async function getProyekTeknisRows(targetProyekId?: string) {
  const supabase = await createSupabaseServerClient()
  const rpcClient = supabase as unknown as ProyekTeknisRpcClient
  return rpcClient.rpc('get_proyek_teknis', {
    target_proyek_id: targetProyekId ?? null,
  })
}

function filterProyekListRows(rows: ProyekDisplay[], filters: ProyekListFilters) {
  const search = filters.search.trim().toLowerCase()

  return rows.filter((project) => {
    const progress = project.persentase_progress ?? 0
    const isBelumMulai = !project.tahap_progress && progress === 0
    const isSelesai = progress === 100
    const isBerjalan = !isBelumMulai && !isSelesai
    const perluUpdate =
      !project.perusahaan_id ||
      !project.status_proyek ||
      !project.lokasi_kecamatan ||
      progress === 0

    if (filters.year !== 'semua' && project.tahun_anggaran !== filters.year) return false
    if (filters.jenis !== 'Semua' && project.jenis_pekerjaan !== filters.jenis) return false
    if (filters.status !== 'Semua' && project.status_proyek !== filters.status) return false
    if (filters.perusahaanId !== 'Semua' && project.perusahaan_id !== filters.perusahaanId) return false
    if (filters.progress === 'selesai' && !isSelesai) return false
    if (filters.progress === 'belum_mulai' && !isBelumMulai) return false
    if (filters.progress === 'berjalan' && !isBerjalan) return false
    if (filters.progress === 'perlu_update' && !perluUpdate) return false

    if (!search) return true

    return [
      project.nama_proyek,
      project.dinas,
      project.lokasi_kecamatan,
      project.status_proyek,
      project.tahap_progress,
    ].some((value) => value?.toLowerCase().includes(search))
  })
}

export async function getDaftarProyek({ includeSensitive = true }: { includeSensitive?: boolean } = {}) {
  const supabase = await createSupabaseServerClient()
  if (!includeSensitive) {
    const { data, error } = await getProyekTeknisRows()
    return {
      data: (data ?? []).map(toProyekDisplayFromTeknis),
      error,
    }
  }

  const sensitiveColumns = includeSensitive ? 'nilai_penawaran,' : ''
  const { data, error } = await supabase
    .from('proyek')
    .select(`
      id,
      nama_proyek,
      jenis_pekerjaan,
      kategori_pekerjaan,
      tahun_anggaran,
      dinas,
      lokasi_kecamatan,
      pagu_dana,
      ${sensitiveColumns}
      tahap_progress,
      persentase_progress,
      pernah_dioverride,
      status_proyek,
      perusahaan_id,
      created_at,
      updated_at,
      perusahaan:perusahaan_id (
        nama_perusahaan
      )
    `)
    .eq('is_deleted', false)
    .order('tahun_anggaran', { ascending: false })
    .order('nama_proyek', { ascending: true })

    

  const rows = (data ?? []) as unknown as Record<string, unknown>[]

  return {
    data: rows.map((row) => ({
      ...row,
      nilai_penawaran: includeSensitive ? row.nilai_penawaran : null,
    })) as ProyekDisplay[],
    error,
  }
}

export async function getDaftarProyekPage(
  filters: ProyekListFilters,
  {
    client,
    includeSensitive = true,
  }: {
    client?: SupabaseServerClient
    includeSensitive?: boolean
  } = {}
) {
  const supabase = client ?? await createSupabaseServerClient()
  const pageSize = PROYEK_LIST_PAGE_SIZES.includes(filters.pageSize as (typeof PROYEK_LIST_PAGE_SIZES)[number])
    ? filters.pageSize
    : DEFAULT_PROYEK_LIST_PAGE_SIZE
  const page = Number.isFinite(filters.page) && filters.page > 0 ? Math.floor(filters.page) : 1
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  if (!includeSensitive) {
    const { data, error } = await getDaftarProyek({ includeSensitive: false })
    const filteredRows = filterProyekListRows(data ?? [], filters)
      .sort((a, b) => b.tahun_anggaran - a.tahun_anggaran || a.nama_proyek.localeCompare(b.nama_proyek))
    const total = filteredRows.length
    const pageCount = Math.max(1, Math.ceil(total / pageSize))

    return {
      data: {
        rows: filteredRows.slice(from, to + 1),
        total,
        page: Math.min(page, pageCount),
        pageSize,
        pageCount,
      },
      error,
    }
  }

  let query = supabase
    .from('proyek')
    .select(PROYEK_LIST_SELECT, { count: 'exact' })
    .eq('is_deleted', false)

  if (filters.year !== 'semua') query = query.eq('tahun_anggaran', filters.year)
  if (filters.jenis !== 'Semua') query = query.eq('jenis_pekerjaan', filters.jenis)
  if (filters.status !== 'Semua') query = query.eq('status_proyek', filters.status)
  if (filters.perusahaanId !== 'Semua') query = query.eq('perusahaan_id', filters.perusahaanId)

  const search = filters.search.trim()
  if (search) {
    const escaped = search.replaceAll('%', '\\%').replaceAll('_', '\\_')
    query = query.or([
      `nama_proyek.ilike.%${escaped}%`,
      `dinas.ilike.%${escaped}%`,
      `lokasi_kecamatan.ilike.%${escaped}%`,
      `status_proyek.ilike.%${escaped}%`,
      `tahap_progress.ilike.%${escaped}%`,
    ].join(','))
  }

  if (filters.progress === 'selesai') {
    query = query.eq('persentase_progress', 100)
  } else if (filters.progress === 'belum_mulai') {
    query = query.or('persentase_progress.is.null,persentase_progress.eq.0').is('tahap_progress', null)
  } else if (filters.progress === 'berjalan') {
    query = query.or('tahap_progress.not.is.null,persentase_progress.gt.0').lt('persentase_progress', 100)
  } else if (filters.progress === 'perlu_update') {
    query = query.or([
      'perusahaan_id.is.null',
      'status_proyek.is.null',
      'lokasi_kecamatan.is.null',
      'nilai_penawaran.is.null',
      'persentase_progress.is.null',
      'persentase_progress.eq.0',
    ].join(','))
  }

  const { data, error, count } = await query
    .order('tahun_anggaran', { ascending: false })
    .order('nama_proyek', { ascending: true })
    .range(from, to)

  const total = count ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return {
    data: {
        rows: (data ?? []) as unknown as ProyekDisplay[],
      total,
      page: Math.min(page, pageCount),
      pageSize,
      pageCount,
    },
    error,
  }
}

export async function getProyekListFilterOptions(client?: SupabaseServerClient) {
  const supabase = client ?? await createSupabaseServerClient()
  const [yearsQuery, perusahaanQuery] = await Promise.all([
    supabase
      .from('proyek')
      .select('tahun_anggaran')
      .eq('is_deleted', false)
      .order('tahun_anggaran', { ascending: false }),
    getPerusahaanList(supabase),
  ])

  const years = [...new Set((yearsQuery.data ?? []).map((row) => row.tahun_anggaran))]

  return {
    data: {
      years,
      perusahaanList: orderPerusahaanList(perusahaanQuery.data ?? []),
    },
    error: yearsQuery.error ?? perusahaanQuery.error,
  }
}

export async function getPerusahaanList(client?: SupabaseServerClient) {
  const supabase = client ?? await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('perusahaan')
    .select('id, nama_perusahaan, adalah_perusahaan_sendiri')
    .order('nama_perusahaan')

  return { data, error }
}

export function orderPerusahaanList<T extends {
  adalah_perusahaan_sendiri: boolean
  nama_perusahaan: string
}>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.adalah_perusahaan_sendiri !== b.adalah_perusahaan_sendiri) {
      return a.adalah_perusahaan_sendiri ? -1 : 1
    }
    return a.nama_perusahaan.localeCompare(b.nama_perusahaan)
  })
}

export async function getDinasList(client?: SupabaseServerClient) {
  const supabase = client ?? await createSupabaseServerClient()
  const dinasTableClient = supabase as unknown as {
    from: (table: 'dinas_skpd') => {
      select: (columns: string) => {
        order: (
          column: string,
          options: { ascending: boolean }
        ) => Promise<{
          data: { id: string; nama_dinas: string | null }[] | null
          error: { message: string } | null
        }>
      }
    }
  }
  const [dinasTableQuery, proyekQuery] = await Promise.all([
    dinasTableClient
      .from('dinas_skpd')
      .select('id, nama_dinas')
      .order('nama_dinas', { ascending: true }),
    supabase
      .from('proyek')
      .select('dinas')
      .eq('is_deleted', false)
      .order('dinas', { ascending: true }),
  ])

  const merged = new Map<string, DinasOption>()

  if (!dinasTableQuery.error) {
    for (const row of dinasTableQuery.data ?? []) {
      const nama = row.nama_dinas?.trim()
      if (!nama) continue
      merged.set(nama, { id: row.id, dinas: nama })
    }
  }

  for (const row of proyekQuery.data ?? []) {
    const nama = row.dinas?.trim()
    if (!nama || merged.has(nama)) continue
    merged.set(nama, { dinas: nama })
  }

  return {
    data: [...merged.values()].sort((a, b) => a.dinas.localeCompare(b.dinas)),
    error: proyekQuery.error ?? null,
  }
}

export async function getProyekFormReferences(client?: SupabaseServerClient) {
  const supabase = client ?? await createSupabaseServerClient()
  const [{ data: perusahaan, error }, { data: dinasList, error: dinasError }] = await Promise.all([
    getPerusahaanList(supabase),
    getDinasList(supabase),
  ])

  return {
    data: {
      perusahaanList: orderPerusahaanList(perusahaan ?? []),
      dinasList: dinasList ?? [],
    },
    error: error ?? dinasError,
  }
}

export async function getProyekById(
  id: string,
  {
    client,
    includeSensitive = true,
  }: {
    client?: SupabaseServerClient
    includeSensitive?: boolean
  } = {}
) {
  if (!includeSensitive) {
    const { data, error } = await getProyekTeknisRows(id)
    return {
      data: data?.[0] ? toProyekDetailFromTeknis(data[0]) : null,
      error,
    }
  }

  const supabase = client ?? await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('proyek')
    .select(PROYEK_DETAIL_SELECT)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()
  const row = data as unknown as Record<string, unknown> | null

  return {
    data: row
      ? ({
          ...row,
          nilai_penawaran: includeSensitive ? row.nilai_penawaran : null,
          catatan: includeSensitive ? row.catatan : null,
        } as ProyekDetail)
      : null,
    error,
  }
}

export async function getProyekEditData(id: string) {
  const supabase = await createSupabaseServerClient()
  const [{ data: proyek, error }, { data: references, error: referenceError }] = await Promise.all([
    getProyekById(id, { client: supabase, includeSensitive: true }),
    getProyekFormReferences(supabase),
  ])

  return {
    data: {
      proyek,
      perusahaanList: references.perusahaanList,
      dinasList: references.dinasList,
    },
    error: error ?? referenceError,
  }
}

export async function getOverrideLogsByProyekId(proyekId: string, client?: SupabaseServerClient) {
  const supabase = client ?? await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('override_log')
    .select(OVERRIDE_LOG_SELECT)
    .eq('proyek_id', proyekId)
    .order('dilakukan_pada', { ascending: false })

  return { data, error }
}

export async function getAllProyekForExport(client?: SupabaseServerClient) {
  const supabase = client ?? await createSupabaseServerClient()
  // B2: removed dead columns never written by FormProyek (alamat_dinas, nomor_kontrak,
  // nomor_spk, tanggal_kontrak) — they produced blank columns in Excel output.
  const { data, error } = await supabase
    .from('proyek')
    .select(`
      id,
      nama_proyek, paket_pekerjaan_induk, jenis_pekerjaan, kategori_pekerjaan,
      tahun_anggaran, sumber_dana, dinas, lokasi_kecamatan, nama_ppk,
      pagu_dana, hps, nilai_penawaran, status_proyek,
      tanggal_mulai, tanggal_selesai, durasi_hari,
      tahap_progress, persentase_progress, catatan, created_at, updated_at,
      perusahaan:perusahaan_id (
        nama_perusahaan
      )
    `)
    .eq('is_deleted', false)
    .order('tahun_anggaran', { ascending: false })
    .order('nama_proyek', { ascending: true })

  return { data, error }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function buildProyekPayload(form: ProyekFormData): ProyekPayload {
  const persentase = getPersentaseFromFase(
    form.jenis_pekerjaan as 'Perencanaan' | 'Pengawasan',
    form.tahap_progress || null
  )
  return {
    nama_proyek: form.nama_proyek!,
    paket_pekerjaan_induk: form.paket_pekerjaan_induk!,
    nomor_kontrak: form.nomor_kontrak?.trim() || null,
    jenis_pekerjaan: form.jenis_pekerjaan!,
    kategori_pekerjaan: form.kategori_pekerjaan!,
    tahun_anggaran: form.tahun_anggaran!,
    sumber_dana: form.sumber_dana!,
    dinas: form.dinas!,
    lokasi_kecamatan: form.lokasi_kecamatan!,
    nama_ppk: form.nama_ppk?.trim() || '',
    pagu_dana: parseNumberInput(form.pagu_dana),
    hps: form.hps ? parseNumberInput(form.hps) : null,
    nilai_penawaran: form.nilai_penawaran ? parseNumberInput(form.nilai_penawaran) : null,
    perusahaan_id: form.perusahaan_id!,
    tanggal_mulai: form.tanggal_mulai || null,
    tanggal_selesai: form.tanggal_selesai || null,
    tahap_progress: form.tahap_progress || null,
    durasi_hari: form.durasi_hari ? Number(form.durasi_hari) : null,
    persentase_progress: persentase,
    status_proyek: (form.status_proyek || null) as 'Work' | 'Borrowed' | 'Get Borrowed' | null,
    catatan: form.catatan || null,
    jalur_masuk: 'manual' as const,
  }
}

export async function simpanProyek(
  form: ProyekFormData,
  mode: 'create' | 'edit'
) {
  const supabase = await createSupabaseServerClient()
  const parsed = proyekSchema.safeParse({
    ...form,
    pagu_dana: parseNumberInput(form.pagu_dana),
    hps: form.hps ? parseNumberInput(form.hps) : null,
    nilai_penawaran: form.nilai_penawaran ? parseNumberInput(form.nilai_penawaran) : null,
    status_proyek:   form.status_proyek || null,
  })

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return { data: null, error: { message } }
  }

  const payload = buildProyekPayload(form)

  const { data, error } =
    mode === 'edit' && form.id
      ? await supabase.from('proyek').update(payload).eq('id', form.id).select(PROYEK_MUTATION_RETURN_SELECT).single()
      : await supabase.from('proyek').insert(payload).select(PROYEK_MUTATION_RETURN_SELECT).single()

  return { data, error }
}

export async function simpanOverride(
  proyekId: string,
  warnings: string[],
  alasan: string,
  dilakukanOleh?: string
) {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()
  const { data: { user } } = await supabase.auth.getUser()
  const actor = dilakukanOleh ?? user?.email ?? 'Admin (Belum Auth)'

  const [{ error: proyekError }, { error: logError }] = await Promise.all([
    supabase.from('proyek').update({ pernah_dioverride: true }).eq('id', proyekId),
    supabase.from('override_log').insert(
      warnings.map((w) => ({
        proyek_id: proyekId,
        field_dioverride: w,
        nilai_sebelum: '-',
        nilai_sesudah: '-',
        alasan,
        dilakukan_oleh: actor,
        dilakukan_pada: now,
      }))
    ),
  ])

  return { error: proyekError ?? logError ?? null }
}

export async function hapusProyek(proyekId: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('proyek')
    .update({ is_deleted: true }) // 👉 Hanya disembunyikan
    .eq('id', proyekId);

  return { error };
}
