import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getPersentaseFromFase } from '@/lib/constants/proyek'
import type { ProyekDetail, ProyekDisplay, ProyekFormData, ProyekPayload } from '@/lib/types/proyek'
import { proyekSchema } from '@/lib/validations/proyek'

// Re-export from split modules so existing imports keep working
export { getPersonilList, getPengalamanPerusahaan } from '@/lib/actions/personil'
export { simpanPenawaran, generateNomorPenawaran } from '@/lib/actions/penawaran'

// ── Queries ──────────────────────────────────────────────────────────────────


export async function getDaftarProyek() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('proyek')
    .select(`
      id,
      nama_proyek,
      jenis_pekerjaan,
      tahun_anggaran,
      dinas,
      lokasi_kecamatan,
      pagu_dana,
      nilai_penawaran,
      tahap_progress,
      persentase_progress,
      pernah_dioverride,
      status_proyek,
      perusahaan_id,
      created_at,
      perusahaan:perusahaan_id (
        nama_perusahaan
      )
    `)
    .eq('is_deleted', false)
    .order('tahun_anggaran', { ascending: false })
    .order('nama_proyek', { ascending: true })

    

  return { data: data as ProyekDisplay[] | null, error }
}

export async function getPerusahaanList() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('perusahaan')
    .select('id, nama_perusahaan, adalah_perusahaan_sendiri')
    .order('nama_perusahaan')

  return { data, error }
}

export async function getProyekById(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('proyek')
    .select(`*, perusahaan:perusahaan_id (nama_perusahaan, adalah_perusahaan_sendiri)`)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  return { data: data as ProyekDetail | null, error }
}

export async function getOverrideLogsByProyekId(proyekId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('override_log')
    .select('*')
    .eq('proyek_id', proyekId)
    .order('dilakukan_pada', { ascending: false })

  return { data, error }
}

export async function getAllProyekForExport() {
  const supabase = await createSupabaseServerClient()
  // B2: removed dead columns never written by FormProyek (alamat_dinas, nomor_kontrak,
  // nomor_spk, tanggal_kontrak) — they produced blank columns in Excel output.
  const { data, error } = await supabase
    .from('proyek')
    .select(`
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
    jenis_pekerjaan: form.jenis_pekerjaan!,
    kategori_pekerjaan: form.kategori_pekerjaan!,
    tahun_anggaran: form.tahun_anggaran!,
    sumber_dana: form.sumber_dana!,
    dinas: form.dinas!,
    lokasi_kecamatan: form.lokasi_kecamatan!,
    nama_ppk: form.nama_ppk!,
    pagu_dana: Number(form.pagu_dana),
    hps: form.hps ? Number(form.hps) : null,
    nilai_penawaran: form.nilai_penawaran ? Number(form.nilai_penawaran) : null,
    perusahaan_id: form.perusahaan_id!,
    tanggal_mulai: form.tanggal_mulai || null,
    tanggal_selesai: form.tanggal_selesai || null,
    tahap_progress: form.tahap_progress || null,
    durasi_hari: Number(form.durasi_hari),
    persentase_progress: persentase,
    status_proyek: (form.status_proyek || null) as 'Work' | 'Borrowed' | 'Get Borrowed' | null,
    catatan: form.catatan || null,
    // B1: manual entries must record jalur_masuk='manual' so they're distinguishable
    // from penawaran-originated projects (which set 'penawaran' in simpanPenawaran).
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
    pagu_dana:       Number(form.pagu_dana),
    hps:             form.hps       ? Number(form.hps)             : null,
    nilai_penawaran: form.nilai_penawaran ? Number(form.nilai_penawaran) : null,
    status_proyek:   form.status_proyek || null,
  })

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return { data: null, error: { message } }
  }

  const payload = buildProyekPayload(form)

  const { data, error } =
    mode === 'edit' && form.id
      ? await supabase.from('proyek').update(payload).eq('id', form.id).select().single()
      : await supabase.from('proyek').insert(payload).select().single()

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
