import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getCurrentUserProfile } from '@/lib/auth'

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

const createSupabaseServerClientMock = vi.mocked(createSupabaseServerClient)

function buildClient(profile: Record<string, unknown> | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: profile, error: null })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'auth-user-id', email: 'user@example.com' } },
        error: null,
      }),
    },
    from,
  }
}

describe('getCurrentUserProfile', () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset()
  })

  it('does not invent a tenaga_ahli profile for an auth user missing from public.users', async () => {
    createSupabaseServerClientMock.mockResolvedValue(buildClient(null) as never)

    await expect(getCurrentUserProfile()).resolves.toEqual({ profile: null, error: null })
  })

  it('returns the persisted application profile', async () => {
    const profile = {
      id: 'auth-user-id',
      email: 'user@example.com',
      nama: 'User',
      role: 'tenaga_ahli',
    }
    createSupabaseServerClientMock.mockResolvedValue(buildClient(profile) as never)

    await expect(getCurrentUserProfile()).resolves.toEqual({ profile, error: null })
  })
})
