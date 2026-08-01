import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: () => '/proyek',
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

import { ProyekTableClient } from '@/components/proyek/proyek-table-client'

describe('ProyekTableClient', () => {
  it('names every project filter and keeps compact controls touch-friendly', () => {
    const markup = renderToStaticMarkup(
      <ProyekTableClient
        proyek={[]}
        pagination={{ page: 1, pageSize: 25, total: 0, pageCount: 1 }}
        filters={{
          page: 1,
          pageSize: 25,
          year: 'semua',
          jenis: 'Semua',
          status: 'Semua',
          progress: 'semua',
          perusahaanId: 'Semua',
          search: '',
        }}
        filterOptions={{ years: [2026], perusahaanList: [] }}
        canViewCommercial={false}
        canManageProjects={false}
      />
    )

    for (const label of [
      'Filter jenis pekerjaan',
      'Filter progress',
      'Filter status proyek',
      'Filter perusahaan',
      'Jumlah proyek per halaman',
    ]) {
      expect(markup).toContain(`aria-label="${label}"`)
    }
    expect(markup).toContain('h-10 shrink-0')
  })
})
