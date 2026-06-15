import { createSupabaseServerClient } from '@/lib/supabase-server'
import { buildProyekPayload } from '@/lib/actions/proyek'
import type { ProyekFormData } from '@/lib/types/proyek'

// Builds the human-readable parts of a nomor surat (everything except the sequence number).
function buildNomorParts(form: ProyekFormData, inisial: string) {
  const tahun = form.tahun_anggaran || new Date().getFullYear()

  const singkatan = (form.nama_proyek ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 8)

  const bulanRomawi = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']
  const bulan = bulanRomawi[new Date().getMonth()]

  return { tahun, singkatan, bulan, inisial }
}

// Generates the next nomor penawaran atomically.
//
// Requires this Postgres function to exist in Supabase (run once via SQL editor):
//
//   CREATE OR REPLACE FUNCTION next_nomor_penawaran(p_tahun int)
//   RETURNS int LANGUAGE plpgsql AS $$
//   DECLARE v_count int;
//   BEGIN
//     SELECT COUNT(*) INTO v_count
//     FROM nomor_surat
//     WHERE jenis_surat = 'PEN'
//       AND created_at >= make_date(p_tahun, 1, 1)
//       AND created_at <  make_date(p_tahun + 1, 1, 1);
//     RETURN v_count + 1;
//   END; $$;
//
// If the RPC is unavailable, falls back to the non-atomic count query.
export async function generateNomorPenawaran(
  _proyekId: string,
  form: ProyekFormData,
  inisial: string
): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const tahun = form.tahun_anggaran || new Date().getFullYear()

  // Try atomic RPC first, fall back to count query
  const { data: rpcData } = await supabase.rpc('next_nomor_penawaran', { p_tahun: tahun })
  let urutan: number

  if (typeof rpcData === 'number' && rpcData > 0) {
    urutan = rpcData
  } else {
    const { count } = await supabase
      .from('nomor_surat')
      .select('*', { count: 'exact', head: true })
      .eq('jenis_surat', 'PEN')
      .gte('created_at', `${tahun}-01-01`)
      .lt('created_at', `${tahun + 1}-01-01`)
    urutan = (count ?? 0) + 1
  }

  const { singkatan, bulan } = buildNomorParts(form, inisial)
  return `${String(urutan).padStart(2, '0')}/PEN/${inisial}/${singkatan}/${bulan}/${tahun}`
}

export async function simpanPenawaran(
  form: ProyekFormData,
  personilList: { personil_id: string; posisi: string; durasi_bulan: number }[]
) {
  const supabase = await createSupabaseServerClient()
  const payload = {
    ...buildProyekPayload(form),
    jalur_masuk: 'penawaran',
    status_tender: 'tidak_diketahui',
    nilai_penawaran: null,
    tahap_progress: null,
    persentase_progress: 0,
  }

  const { data: proyek, error: proyekError } = await supabase
    .from('proyek')
    .insert(payload)
    .select()
    .single()

  if (proyekError || !proyek) return { error: proyekError }

  if (personilList.length > 0) {
    const personilRows = personilList.map((p) => ({
      proyek_id: proyek.id,
      personil_id: p.personil_id,
      posisi: p.posisi,
      tanggal_mulai_tugas: form.tanggal_mulai || null,
      tanggal_selesai_tugas: form.tanggal_selesai || null,
      durasi_bulan: p.durasi_bulan,
    }))

    const { error: personilError } = await supabase
      .from('personil_proyek')
      .insert(personilRows)

    if (personilError) return { error: personilError }
  }

  const { data: perusahaanData } = await supabase
    .from('perusahaan')
    .select('inisial_perusahaan')
    .eq('id', form.perusahaan_id!)
    .single()

  const inisial = perusahaanData?.inisial_perusahaan ?? 'YPC'
  const nomorSurat = await generateNomorPenawaran(proyek.id, form, inisial)

  const { error: nomorError } = await supabase.from('nomor_surat').insert({
    proyek_id: proyek.id,
    jenis_surat: 'PEN',
    nomor_surat: nomorSurat,
    tanggal_surat: new Date().toISOString().split('T')[0],
    is_manual: false,
  })

  if (nomorError) return { error: nomorError }

  return { data: proyek, error: null }
}
