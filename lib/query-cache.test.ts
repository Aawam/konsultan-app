import { beforeEach, describe, expect, it, vi } from 'vitest'

const { unstableCache } = vi.hoisted(() => ({
  unstableCache: vi.fn((loader: () => Promise<unknown>) => loader),
}))

vi.mock('next/cache', () => ({
  unstable_cache: unstableCache,
}))

import { cacheSuccessfulQuery } from '@/lib/query-cache'

describe('cacheSuccessfulQuery', () => {
  beforeEach(() => {
    unstableCache.mockClear()
  })

  it('runs directly when no authenticated cache scope is provided', async () => {
    const load = vi.fn().mockResolvedValue({ data: ['Dinas PUPR'], error: null })

    await expect(cacheSuccessfulQuery(load, {
      scope: undefined,
      keyParts: ['dinas-list'],
      tags: ['dinas'],
    })).resolves.toEqual({ data: ['Dinas PUPR'], error: null })

    expect(unstableCache).not.toHaveBeenCalled()
  })

  it('isolates persistent entries by user scope and applies tags plus TTL', async () => {
    const load = vi.fn().mockResolvedValue({ data: ['Dinas PUPR'], error: null })

    await expect(cacheSuccessfulQuery(load, {
      scope: 'user-1:owner',
      keyParts: ['dinas-list'],
      tags: ['dinas', 'proyek'],
    })).resolves.toEqual({ data: ['Dinas PUPR'], error: null })

    expect(unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ['dinas-list', 'user-1:owner'],
      { tags: ['dinas', 'proyek'], revalidate: 300 }
    )
  })

  it('rejects failed loads inside the cache and returns the original error uncached', async () => {
    const databaseError = { message: 'database unavailable' }
    const load = vi.fn().mockResolvedValue({ data: null, error: databaseError })

    await expect(cacheSuccessfulQuery(load, {
      scope: 'user-1:owner',
      keyParts: ['perusahaan-list'],
      tags: ['perusahaan'],
    })).resolves.toEqual({ data: null, error: databaseError })
  })
})
