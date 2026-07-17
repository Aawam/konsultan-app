import { describe, expect, it } from 'vitest'
import { buildProjectListHref, readDashboardFilters } from '@/lib/dashboard-filters'

describe('readDashboardFilters', () => {
  it('reads supported dashboard filters and rejects invalid values', () => {
    expect(readDashboardFilters(new URLSearchParams('year=2026&jenis=Perencanaan&status=Work&perusahaan=Alpha'))).toEqual({
      year: 2026,
      jenis: 'Perencanaan',
      status: 'Work',
      perusahaan: 'Alpha',
    })

    expect(readDashboardFilters(new URLSearchParams('year=invalid&jenis=Lain&status=Unknown'))).toEqual({
      year: 'semua',
      jenis: 'Semua',
      status: 'Semua',
      perusahaan: 'Semua',
    })
  })
})

describe('buildProjectListHref', () => {
  it('preserves dashboard context while adding a work-list filter', () => {
    expect(buildProjectListHref({
      year: 2026,
      jenis: 'Perencanaan',
      status: 'Work',
      perusahaan: 'Alpha',
    }, { progress: 'berjalan' })).toBe(
      '/proyek?year=2026&jenis=Perencanaan&status=Work&perusahaan=Alpha&progress=berjalan'
    )
  })

  it('omits default filters from the work-list URL', () => {
    expect(buildProjectListHref({
      year: 'semua',
      jenis: 'Semua',
      status: 'Semua',
      perusahaan: 'Semua',
    })).toBe('/proyek')
  })
})
