import { describe, expect, it } from 'vitest'
import { getPersentaseFromFase } from '@/lib/constants/proyek'

describe('getPersentaseFromFase', () => {
  it('maps perencanaan phases to their configured percentages', () => {
    expect(getPersentaseFromFase('Perencanaan', 'Konsep Desain')).toBe(40)
    expect(getPersentaseFromFase('Perencanaan', 'Selesai (BAST)')).toBe(100)
  })

  it('maps pengawasan phases to their configured percentages', () => {
    expect(getPersentaseFromFase('Pengawasan', 'Pengawasan Tahap 2')).toBe(60)
    expect(getPersentaseFromFase('Pengawasan', 'Selesai (BAST)')).toBe(100)
  })

  it('returns 0 when no phase is selected or the label is unknown', () => {
    expect(getPersentaseFromFase('Perencanaan', null)).toBe(0)
    expect(getPersentaseFromFase('Pengawasan', 'Tidak Ada')).toBe(0)
  })
})
