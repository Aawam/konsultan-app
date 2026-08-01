import { describe, expect, it } from 'vitest'

import { getVisibleNavGroups } from '@/components/layout/sidebar-layout'

describe('getVisibleNavGroups', () => {
  it('removes empty owner-only groups for technical users', () => {
    expect(getVisibleNavGroups(false).map((group) => group.group)).toEqual(['Monitoring'])
  })

  it('keeps reference navigation for Owner/Admin', () => {
    expect(getVisibleNavGroups(true).map((group) => group.group)).toEqual([
      'Monitoring',
      'Referensi',
    ])
  })
})
