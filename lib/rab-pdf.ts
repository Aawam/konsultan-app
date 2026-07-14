import { createSimplePdf } from '@/lib/simple-pdf'
import type { RabMakerSnapshot } from '@/lib/types/ahsp'
import type { ProyekDetail } from '@/lib/types/proyek'
import { formatRupiah } from '@/lib/utils'

function safeText(value: string | null | undefined) {
  return value?.trim() || '-'
}

function safeFilenamePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'rab'
}

export function buildRabPdfFilename(project: Pick<ProyekDetail, 'nama_proyek' | 'tahun_anggaran'>) {
  return `rab-${safeFilenamePart(project.nama_proyek)}-${project.tahun_anggaran}.pdf`
}

export function createRabPdf(project: ProyekDetail, snapshot: RabMakerSnapshot) {
  const subtotal = snapshot.maker?.subtotal ?? snapshot.items.reduce((sum, item) => sum + item.jumlah_harga, 0)
  const ppnPersen = snapshot.maker?.ppn_persen ?? 11
  const ppnNilai = snapshot.maker?.ppn_nilai ?? subtotal * ppnPersen / 100
  const totalFinal = snapshot.maker?.total_final ?? subtotal + ppnNilai
  const lines = [
    `Proyek: ${project.nama_proyek}`,
    `Dinas/SKPD: ${project.dinas}`,
    `Lokasi: ${safeText(project.lokasi_kecamatan)}`,
    `Tahun Anggaran: ${project.tahun_anggaran}`,
    `Status RAB: ${snapshot.maker?.status ?? 'belum dibuat'}`,
    '',
    `Subtotal: ${formatRupiah(subtotal)}`,
    `PPN ${ppnPersen}%: ${formatRupiah(ppnNilai)}`,
    `Total Final: ${formatRupiah(totalFinal)}`,
    '',
    'Daftar Item RAB',
    'No | Kode | Uraian | Vol | Satuan | Harga Satuan | Jumlah',
    ...snapshot.items.map((item, index) => [
      index + 1,
      item.kode_analisa_snapshot,
      item.uraian_pekerjaan_snapshot,
      item.volume,
      item.satuan_snapshot,
      formatRupiah(item.harga_satuan),
      formatRupiah(item.jumlah_harga),
    ].join(' | ')),
  ]

  return createSimplePdf({
    title: 'RAB / Engineering Estimate',
    lines,
  })
}
