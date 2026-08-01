import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import type { ProyekDisplay } from '@/lib/types/proyek'

vi.mock('next/navigation', () => ({
  usePathname: () => '/proyek/dashboard',
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

import { DashboardClient } from '@/components/proyek/dashboard-client'

const technicalProject = {
  id: '00000000-0000-4000-8000-000000000001',
  nama_proyek: 'Pengawasan Jalan',
  jenis_pekerjaan: 'Pengawasan',
  kategori_pekerjaan: 'Jalan & Jembatan',
  tahun_anggaran: 2026,
  sumber_dana: 'APBD',
  dinas: 'Dinas PUPR',
  lokasi_kecamatan: 'Tanjung Redeb',
  nama_ppk: 'Budi',
  pagu_dana: null,
  hps: null,
  nilai_penawaran: null,
  tanggal_mulai: '2026-01-01',
  tanggal_selesai: '2026-02-01',
  tahap_progress: 'Pelaksanaan Minggu 1',
  persentase_progress: 10,
  pernah_dioverride: false,
  status_proyek: 'Work',
  perusahaan_id: '00000000-0000-4000-8000-000000000002',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
  perusahaan: { nama_perusahaan: 'Konsultan Berau' },
} satisfies ProyekDisplay

describe('DashboardClient', () => {
  it('does not treat hidden commercial fields as missing for technical users', () => {
    const markup = renderToStaticMarkup(
      <DashboardClient proyek={[technicalProject]} canViewCommercial={false} />
    )

    expect(markup).toMatch(/Butuh Review[\s\S]*?stat-value text-amber[^>]*>0</)
    expect(markup).toContain('aria-label="Filter perusahaan dashboard"')
    expect(markup).toContain('aria-label="Filter status dashboard"')
  })
})
