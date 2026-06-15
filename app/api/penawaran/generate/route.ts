import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { generatePenawaran } from '@/lib/generate-penawaran'
import type { DataPenawaran } from '@/lib/generate-penawaran'
import { formatRupiah, formatTanggal } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const proyekId = req.nextUrl.searchParams.get('proyek_id')
  if (!proyekId) return NextResponse.json({ error: 'proyek_id required' }, { status: 400 })
  const supabase = await createSupabaseServerClient()

  // 1. Fetch proyek + perusahaan
  const { data: proyek, error: proyekError } = await supabase
    .from('proyek')
    .select(`
      *,
      perusahaan:perusahaan_id (*)
    `)
    .eq('id', proyekId)
    .single()

  if (proyekError || !proyek) {
    return NextResponse.json({ error: 'Proyek tidak ditemukan' }, { status: 404 })
  }

  // 2. Fetch personil proyek
  const { data: personilProyek } = await supabase
    .from('personil_proyek')
    .select(`
      posisi,
      durasi_bulan,
      personil:personil_id (
        nama_lengkap,
        alamat
      )
    `)
    .eq('proyek_id', proyekId)

  // 3. Fetch pengalaman perusahaan (sesuai kategori)
  const { data: pengalaman } = await supabase
    .from('pengalaman_perusahaan')
    .select('*')
    .eq('perusahaan_id', proyek.perusahaan_id)
    .eq('kategori_pekerjaan', proyek.kategori_pekerjaan)
    .order('tanggal_mulai', { ascending: false })

  // 4. Fetch nomor surat
  const { data: nomorSurat } = await supabase
    .from('nomor_surat')
    .select('nomor_surat, tanggal_surat')
    .eq('proyek_id', proyekId)
    .eq('jenis_surat', 'PEN')
    .single()

  // 5. Fetch template metodologi
  const { data: template } = await supabase
    .from('template_metodologi')
    .select('konten')
    .eq('tipe_pekerjaan', proyek.jenis_pekerjaan)
    .eq('kategori_pekerjaan', proyek.kategori_pekerjaan)
    .single()

  const p = proyek.perusahaan

  // 6. Build data
  const pengalamanMapped = (pengalaman ?? []).map((e) => ({
    nama_paket: e.nama_paket,
    lokasi: e.lokasi ?? '-',
    pemberi_kerja: e.pemberi_kerja,
    nomor_kontrak: e.nomor_kontrak ?? '-',
    nilai_kontrak: formatRupiah(e.nilai_kontrak),
    tgl_mulai: formatTanggal(e.tanggal_mulai),
    tgl_selesai: formatTanggal(e.tanggal_selesai),
  }))

  const personilMapped = (personilProyek ?? []).map((pp) => {
    const p = Array.isArray(pp.personil) ? pp.personil[0] : pp.personil
    return {
      nama_lengkap: (p as { nama_lengkap?: string } | null)?.nama_lengkap ?? '-',
      posisi: pp.posisi as string,
      durasi_bulan: `${pp.durasi_bulan as number} Bulan`,
    }
  })

  const personilListMapped = (personilProyek ?? []).map((pp) => {
    const p = Array.isArray(pp.personil) ? pp.personil[0] : pp.personil
    return {
      nama_lengkap: (p as { nama_lengkap?: string } | null)?.nama_lengkap ?? '-',
      alamat: (p as { alamat?: string | null } | null)?.alamat ?? '-',
      posisi: pp.posisi as string,
    }
  })

  const data: DataPenawaran = {
    nama_proyek: proyek.nama_proyek,
    jenis_pekerjaan: proyek.jenis_pekerjaan,
    lokasi_kecamatan: proyek.lokasi_kecamatan,
    provinsi: 'Kalimantan Timur',
    tahun_anggaran: proyek.tahun_anggaran,
    durasi_hari: proyek.durasi_hari ?? 30,
    tanggal_surat: formatTanggal(nomorSurat?.tanggal_surat ?? null),
    kota_perusahaan: p?.kota ?? 'Tanjung Redeb',

    nama_perusahaan: p?.nama_perusahaan ?? '-',
    alamat_perusahaan: p?.alamat ?? '-',
    telepon_perusahaan: p?.telepon ?? '-',
    email_perusahaan: p?.email ?? '-',
    nama_direktur: p?.nama_direktur ?? '-',
    ktp_direktur: p?.ktp_direktur ?? '-',
    siujk: p?.siujk ?? '-',
    sbu: p?.sbu ?? '-',
    kode_kbli: p?.kode_kbli ?? '-',
    subklasifikasi_sbu: p?.subklasifikasi_sbu ?? '-',
    masa_berlaku_sbu: formatTanggal(p?.masa_berlaku_sbu ?? null),
    nib: p?.nib ?? '-',
    nib_berbasis_risiko: p?.nib_berbasis_risiko ?? '-',
    nomor_akta_pendirian: p?.nomor_akta_pendirian ?? '-',
    tanggal_akta_pendirian: formatTanggal(p?.tanggal_akta_pendirian ?? null),
    notaris_pendirian: p?.notaris_pendirian ?? '-',
    pengesahan_kemenkumham: p?.pengesahan_kemenkumham ?? '-',
    nomor_akta_perubahan: p?.nomor_akta_perubahan ?? '-',
    tanggal_akta_perubahan: formatTanggal(p?.tanggal_akta_perubahan ?? null),
    notaris_perubahan: p?.notaris_perubahan ?? '-',

    metodologi: template?.konten ?? '[Template metodologi belum diisi]',

    pengalaman: pengalamanMapped,
    pengalaman_detail: pengalamanMapped,
    personil: personilMapped,
    personil_list: personilListMapped,
  }

  // 7. Generate dokumen
  try {
    const buffer = generatePenawaran(data)

    const filename = `Penawaran_${proyek.nama_proyek.replace(/\s+/g, '_')}.docx`

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Generate error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
