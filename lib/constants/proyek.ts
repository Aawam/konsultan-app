// Kategori pekerjaan yang digunakan di seluruh aplikasi
export const KATEGORI_PEKERJAAN = [
  'Bangunan Gedung',
  'SDA',
  'Jalan & Jembatan',
  'Irigasi',
  'Sanitasi & Air Minum',
  'Listrik & Mekanikal',
  'Lainnya',
] as const

export type KategoriPekerjaan = typeof KATEGORI_PEKERJAAN[number]

// Daftar fase progress untuk proyek Perencanaan
export const FASE_PERENCANAAN = [
  { label: 'Persiapan & SPMK', persentase: 5 },
  { label: 'Survey Lapangan', persentase: 20 },
  { label: 'Konsep Desain', persentase: 40 },
  { label: 'Penyusunan Laporan Antara', persentase: 60 },
  { label: 'Penyusunan Laporan Akhir & RAB', persentase: 80 },
  { label: 'Penyerahan & Revisi', persentase: 95 },
  { label: 'Selesai (BAST)', persentase: 100 },
] as const

// Daftar fase progress untuk proyek Pengawasan
export const FASE_PENGAWASAN = [
  { label: 'Persiapan', persentase: 10 },
  { label: 'Pengawasan Tahap 1', persentase: 30 },
  { label: 'Pengawasan Tahap 2', persentase: 60 },
  { label: 'Pengawasan Tahap 3', persentase: 90 },
  { label: 'Selesai (BAST)', persentase: 100 },
] as const

// Progress bar colors keyed by tahap label
export const TAHAP_BAR_COLOR: Record<string, string> = {
  'Persiapan & SPMK':              'bg-brand',
  'Survey Lapangan':                'bg-brand',
  'Konsep Desain':                  'bg-amber',
  'Penyusunan Laporan Antara':      'bg-amber',
  'Penyusunan Laporan Akhir & RAB': 'bg-violet',
  'Penyerahan & Revisi':            'bg-violet',
  'Selesai (BAST)':                 'bg-emerald',
  'Persiapan':                      'bg-brand',
  'Pengawasan Tahap 1':             'bg-amber',
  'Pengawasan Tahap 2':             'bg-amber',
  'Pengawasan Tahap 3':             'bg-violet',
}

// Helper: cari persentase dari label fase
export function getPersentaseFromFase(
  jenis: 'Perencanaan' | 'Pengawasan',
  faseLabel: string | null
): number {
  if (!faseLabel) return 0
  const list = jenis === 'Perencanaan' ? FASE_PERENCANAAN : FASE_PENGAWASAN
  const found = list.find((f) => f.label === faseLabel)
  return found?.persentase ?? 0
}