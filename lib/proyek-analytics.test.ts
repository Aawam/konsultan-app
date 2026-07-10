import { describe, expect, it } from 'vitest'
import {
  filterProjects,
  getMissingProjectFields,
  getProjectStats,
  groupProjectsByCount,
  groupProjectsByValue,
  type ProjectFilters,
} from '@/lib/proyek-analytics'
import type { ProyekDisplay } from '@/lib/types/proyek'

const projects: ProyekDisplay[] = [
  {
    id: '1',
    nama_proyek: 'Perencanaan Gedung Kantor',
    jenis_pekerjaan: 'Perencanaan',
    kategori_pekerjaan: 'Bangunan Gedung',
    tahun_anggaran: 2026,
    sumber_dana: 'APBD',
    dinas: 'Dinas PUPR',
    lokasi_kecamatan: 'Samarinda Ulu',
    nama_ppk: 'Budi, ST',
    pagu_dana: 100_000_000,
    hps: 95_000_000,
    nilai_penawaran: 80_000_000,
    tanggal_mulai: '2026-01-15',
    tanggal_selesai: '2026-03-15',
    tahap_progress: 'Konsep Desain',
    persentase_progress: 40,
    pernah_dioverride: false,
    status_proyek: 'Work',
    perusahaan_id: 'company-a',
    created_at: '2026-01-01',
    updated_at: '2026-01-02',
    perusahaan: { nama_perusahaan: 'Alpha Konsultan' },
  },
  {
    id: '2',
    nama_proyek: 'Pengawasan Jalan Kota',
    jenis_pekerjaan: 'Pengawasan',
    kategori_pekerjaan: 'Jalan & Jembatan',
    tahun_anggaran: 2025,
    sumber_dana: 'APBD',
    dinas: 'Dinas Perhubungan',
    lokasi_kecamatan: 'Balikpapan Utara',
    nama_ppk: 'Sari, ST',
    pagu_dana: 120_000_000,
    hps: 110_000_000,
    nilai_penawaran: 90_000_000,
    tanggal_mulai: '2025-03-05',
    tanggal_selesai: '2025-04-05',
    tahap_progress: 'Selesai (BAST)',
    persentase_progress: 100,
    pernah_dioverride: true,
    status_proyek: 'Borrowed',
    perusahaan_id: 'company-b',
    created_at: '2025-03-01',
    updated_at: '2025-04-01',
    perusahaan: { nama_perusahaan: 'Beta Teknik' },
  },
  {
    id: '3',
    nama_proyek: 'Perencanaan Drainase',
    jenis_pekerjaan: 'Perencanaan',
    kategori_pekerjaan: 'SDA',
    tahun_anggaran: 2026,
    sumber_dana: 'APBD',
    dinas: 'Dinas PUPR',
    lokasi_kecamatan: null,
    nama_ppk: 'Hasan, ST',
    pagu_dana: 75_000_000,
    hps: 70_000_000,
    nilai_penawaran: null,
    tanggal_mulai: '2026-02-10',
    tanggal_selesai: '2026-04-10',
    tahap_progress: null,
    persentase_progress: 0,
    pernah_dioverride: false,
    status_proyek: null,
    perusahaan_id: null,
    created_at: '2026-02-01',
    updated_at: null,
    perusahaan: null,
  },
]

const baseFilters: ProjectFilters = {
  year: 'semua',
  jenis: 'Semua',
  status: 'Semua',
  progress: 'semua',
  perusahaan: 'Semua',
  search: '',
}

describe('filterProjects', () => {
  it('filters by year, type, status, company, progress, and search', () => {
    expect(filterProjects(projects, { ...baseFilters, year: 2026 })).toHaveLength(2)
    expect(filterProjects(projects, { ...baseFilters, jenis: 'Pengawasan' })).toEqual([projects[1]])
    expect(filterProjects(projects, { ...baseFilters, status: 'Borrowed' })).toEqual([projects[1]])
    expect(filterProjects(projects, { ...baseFilters, perusahaan: 'Alpha Konsultan' })).toEqual([projects[0]])
    expect(filterProjects(projects, { ...baseFilters, progress: 'selesai' })).toEqual([projects[1]])
    expect(filterProjects(projects, { ...baseFilters, search: 'drainase' })).toEqual([projects[2]])
  })

  it('supports combined filters and empty datasets', () => {
    const filtered = filterProjects(projects, {
      ...baseFilters,
      year: 2026,
      jenis: 'Perencanaan',
      progress: 'berjalan',
      search: 'gedung',
    })

    expect(filtered).toEqual([projects[0]])
    expect(filterProjects([], { ...baseFilters, year: 2026 })).toEqual([])
  })

  it('filters records that need updates', () => {
    expect(filterProjects(projects, { ...baseFilters, progress: 'perlu_update' })).toEqual([projects[2]])
    expect(getMissingProjectFields(projects[2])).toEqual([
      'Perusahaan',
      'Kecamatan/Lokasi',
      'Status bendera',
      'Tahap progress',
    ])
  })
})

describe('getProjectStats', () => {
  it('calculates owner overview metrics', () => {
    expect(getProjectStats(projects)).toEqual({
      total: 3,
      berjalan: 1,
      selesai: 1,
      belumMulai: 1,
      perluUpdate: 1,
      override: 1,
      perencanaan: 2,
      pengawasan: 1,
      nilaiTotal: 170_000_000,
      avgProgress: 47,
    })
  })

  it('calculates group summaries by count and value', () => {
    expect(groupProjectsByCount(projects, (project) => project.dinas, 1)).toEqual([['Dinas PUPR', 2]])
    expect(groupProjectsByValue(projects, (project) => project.tahun_anggaran.toString())).toEqual([
      ['2025', { count: 1, value: 90_000_000 }],
      ['2026', { count: 2, value: 80_000_000 }],
    ])
  })
})
