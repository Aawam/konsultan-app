import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CurrentUserProfile } from '@/lib/auth-types'
import type { ProyekDetail } from '@/lib/types/proyek'

const {
  getCurrentUserProfile,
  getOverrideLogsByProyekId,
  getProyekById,
} = vi.hoisted(() => ({
  getCurrentUserProfile: vi.fn(),
  getOverrideLogsByProyekId: vi.fn(),
  getProyekById: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUserProfile,
  isOwnerAdmin: (profile: CurrentUserProfile | null) => profile?.role === 'owner_admin',
}))

vi.mock('@/lib/actions/proyek', () => ({
  getOverrideLogsByProyekId,
  getProyekById,
}))

vi.mock('@/components/proyek/proyek-actions', () => ({
  TombolAksi: () => <button type="button">Aksi proyek</button>,
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

import DetailProyekPage from '@/app/proyek/[id]/page'

const projectId = '00000000-0000-4000-8000-000000000001'

const project = {
  id: projectId,
  nama_proyek: 'Pengawasan Jalan',
  paket_pekerjaan_induk: 'Jalan Kabupaten',
  nomor_kontrak: '01/KONTRAK/2026',
  jenis_pekerjaan: 'Pengawasan',
  kategori_pekerjaan: 'Jalan & Jembatan',
  tahun_anggaran: 2026,
  sumber_dana: 'APBD',
  dinas: 'Dinas PUPR',
  lokasi_kecamatan: 'Tanjung Redeb',
  nama_ppk: 'Budi',
  pagu_dana: 500_000_000,
  hps: 450_000_000,
  nilai_penawaran: 400_000_000,
  perusahaan_id: '00000000-0000-4000-8000-000000000002',
  tanggal_mulai: '2026-01-01',
  tanggal_selesai: '2026-02-01',
  durasi_hari: 30,
  tahap_progress: 'Pelaksanaan Minggu 1',
  persentase_progress: 10,
  pernah_dioverride: true,
  status_proyek: 'Work',
  jalur_masuk: 'manual',
  catatan: 'Catatan internal',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
  is_deleted: false,
  perusahaan: {
    nama_perusahaan: 'Konsultan Berau',
    adalah_perusahaan_sendiri: true,
  },
} satisfies ProyekDetail

const overrideLog = {
  id: 'override-1',
  field_dioverride: 'nilai_penawaran',
  alasan: 'Alasan internal Owner/Admin',
  dilakukan_pada: '2026-01-03T00:00:00Z',
}

describe('DetailProyekPage role boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getProyekById.mockResolvedValue({ data: project, error: null })
    getOverrideLogsByProyekId.mockResolvedValue({ data: [overrideLog], error: null })
  })

  it('does not fetch or render override history for technical users', async () => {
    getCurrentUserProfile.mockResolvedValue({
      profile: {
        id: '00000000-0000-4000-8000-000000000003',
        email: 'teknis@example.com',
        nama: 'Tenaga Ahli',
        role: 'tenaga_ahli',
      },
    })

    const markup = renderToStaticMarkup(
      await DetailProyekPage({ params: Promise.resolve({ id: projectId }) })
    )

    expect(markup).not.toContain('Riwayat Override')
    expect(markup).not.toContain('Alasan internal Owner/Admin')
    expect(getOverrideLogsByProyekId).not.toHaveBeenCalled()
    expect(getProyekById).toHaveBeenCalledWith(projectId, { includeSensitive: false })
  })

  it('keeps override history available for Owner/Admin', async () => {
    getCurrentUserProfile.mockResolvedValue({
      profile: {
        id: '00000000-0000-4000-8000-000000000004',
        email: 'owner@example.com',
        nama: 'Owner',
        role: 'owner_admin',
      },
    })

    const markup = renderToStaticMarkup(
      await DetailProyekPage({ params: Promise.resolve({ id: projectId }) })
    )

    expect(markup).toContain('Riwayat Override')
    expect(markup).toContain('Alasan internal Owner/Admin')
    expect(getOverrideLogsByProyekId).toHaveBeenCalledWith(projectId)
    expect(getProyekById).toHaveBeenCalledWith(projectId, { includeSensitive: true })
  })
})
