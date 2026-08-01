import { beforeEach, describe, expect, it, vi } from 'vitest'

const { revalidateTag } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidateTag }))

import {
  invalidateDinasCache,
  invalidatePerusahaanCache,
  invalidateProyekCache,
} from '@/lib/cache-invalidation'
import { CACHE_TAGS } from '@/lib/query-cache'

describe('reference cache invalidation', () => {
  beforeEach(() => {
    revalidateTag.mockClear()
  })

  it('expires project-derived reference data immediately after project mutations', () => {
    invalidateProyekCache()

    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.proyek, { expire: 0 })
  })

  it('expires company references immediately after company mutations', () => {
    invalidatePerusahaanCache()

    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.perusahaan, { expire: 0 })
  })

  it('expires dinas references and project rows after a dinas rename', () => {
    invalidateDinasCache()

    expect(revalidateTag).toHaveBeenNthCalledWith(1, CACHE_TAGS.dinas, { expire: 0 })
    expect(revalidateTag).toHaveBeenNthCalledWith(2, CACHE_TAGS.proyek, { expire: 0 })
  })
})
