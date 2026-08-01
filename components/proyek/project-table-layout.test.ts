import { describe, expect, it } from 'vitest'

import {
  getProjectTableColumns,
  getProjectTableMinWidth,
} from '@/components/proyek/project-table-layout'

describe('project table desktop layout', () => {
  it('keeps the commercial column last and wide enough for desktop scrolling', () => {
    const columns = getProjectTableColumns(true)

    expect(columns.map((column) => column.key)).toEqual([
      'project',
      'company',
      'type',
      'year',
      'district',
      'progress',
      'contract',
    ])
    expect(getProjectTableMinWidth(true)).toBeGreaterThanOrEqual(1120)
  })

  it('removes only the commercial column for technical users', () => {
    const columns = getProjectTableColumns(false)

    expect(columns.map((column) => column.key)).toEqual([
      'project',
      'company',
      'type',
      'year',
      'district',
      'progress',
    ])
    expect(getProjectTableMinWidth(false)).toBeGreaterThanOrEqual(960)
  })
})
