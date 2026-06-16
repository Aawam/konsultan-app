import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import fs from 'fs'
import path from 'path'

export type DataPenawaran = {
  // Cover & umum
  nama_proyek: string
  jenis_pekerjaan: string
  lokasi_kecamatan: string
  provinsi: string
  tahun_anggaran: number
  durasi_hari: number
  tanggal_surat: string
  kota_perusahaan: string

  // Perusahaan
  nama_perusahaan: string
  alamat_perusahaan: string
  telepon_perusahaan: string
  email_perusahaan: string
  nama_direktur: string
  ktp_direktur: string
  siujk: string
  sbu: string
  kode_kbli: string
  subklasifikasi_sbu: string
  masa_berlaku_sbu: string
  nib: string
  nib_berbasis_risiko: string
  nomor_akta_pendirian: string
  tanggal_akta_pendirian: string
  notaris_pendirian: string
  pengesahan_kemenkumham: string
  nomor_akta_perubahan: string
  tanggal_akta_perubahan: string
  notaris_perubahan: string

  // Metodologi
  metodologi: string

  // Loop pengalaman (tabel ringkas)
  pengalaman: {
    nama_paket: string
    lokasi: string
    pemberi_kerja: string
    nomor_kontrak: string
    nilai_kontrak: string
    tgl_mulai: string
    tgl_selesai: string
  }[]

  // Loop pengalaman detail
  pengalaman_detail: {
    nama_paket: string
    lokasi: string
    pemberi_kerja: string
    nomor_kontrak: string
    nilai_kontrak: string
    tgl_mulai: string
    tgl_selesai: string
  }[]

  // Loop personil (komposisi tim)
  personil: {
    nama_lengkap: string
    posisi: string
    durasi_bulan: string
  }[]

  // Loop personil surat pernyataan
  personil_list: {
    nama_lengkap: string
    alamat: string
    posisi: string
  }[]
}

export function generatePenawaran(data: DataPenawaran): Buffer {
  const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_penawaran.docx')

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Template DOCX tidak ditemukan di ${templatePath}. Salin template lokal ke public/templates/template_penawaran.docx sebelum generate penawaran.`
    )
  }

  const content = fs.readFileSync(templatePath, 'binary')

  const zip = new PizZip(content)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })

  doc.render(data)

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  })
}
