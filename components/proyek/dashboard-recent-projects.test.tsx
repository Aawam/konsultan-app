import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { DashboardRecentProjects } from '@/components/proyek/dashboard-recent-projects'
import type { ProyekDisplay } from '@/lib/types/proyek'

const project = {
  id: 'project-1',
  nama_proyek: 'Pembangunan Gedung Pelayanan',
  perusahaan: { nama_perusahaan: 'PT Konsultan Berau' },
  jenis_pekerjaan: 'Perencanaan',
  tahap_progress: 'Konsep Desain',
  dinas: 'Dinas Pekerjaan Umum',
  nilai_penawaran: 125_000_000,
} as ProyekDisplay

describe('DashboardRecentProjects', () => {
  it('renders mobile cards and the tablet table without a mobile horizontal-scroll instruction', () => {
    const markup = renderToStaticMarkup(
      <DashboardRecentProjects projects={[project]} canViewCommercial />
    )

    expect(markup).toContain('Pembangunan Gedung Pelayanan')
    expect(markup).toContain('sm:grid-cols-2 md:hidden')
    expect(markup).toContain('hidden overflow-x-auto md:block')
    expect(markup).not.toContain('Geser tabel')
  })

  it('does not render the commercial column for technical users', () => {
    const markup = renderToStaticMarkup(
      <DashboardRecentProjects projects={[project]} canViewCommercial={false} />
    )

    expect(markup).not.toContain('>Nilai<')
    expect(markup).not.toContain('Rp125.000.000')
  })
})
