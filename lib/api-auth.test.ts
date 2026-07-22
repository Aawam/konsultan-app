import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentUserProfile } from '@/lib/auth'
import { requireCurrentUserProfileApi, requireOwnerAdminApi } from '@/lib/api-auth'

vi.mock('@/lib/auth', () => ({
  getCurrentUserProfile: vi.fn(),
  isOwnerAdmin: (profile: { role?: string } | null) => profile?.role === 'owner_admin',
}))

const getCurrentUserProfileMock = vi.mocked(getCurrentUserProfile)

describe('API auth guards', () => {
  beforeEach(() => {
    getCurrentUserProfileMock.mockReset()
  })

  it('returns UNAUTHORIZED for requests without an authenticated user', async () => {
    getCurrentUserProfileMock.mockResolvedValue({
      user: null,
      profile: null,
      error: null,
    })

    const { response } = await requireCurrentUserProfileApi()

    expect(response?.status).toBe(401)
    await expect(response?.json()).resolves.toMatchObject({
      errorCode: 'UNAUTHORIZED',
    })
  })

  it('returns FORBIDDEN for authenticated users outside the app profile table', async () => {
    getCurrentUserProfileMock.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
      profile: null,
      error: null,
    })

    const { response } = await requireCurrentUserProfileApi()

    expect(response?.status).toBe(403)
    await expect(response?.json()).resolves.toMatchObject({
      errorCode: 'FORBIDDEN',
    })
  })

  it('requires the owner_admin role for owner/admin endpoints', async () => {
    getCurrentUserProfileMock.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
      profile: {
        id: 'user-1',
        email: 'user@example.com',
        nama: 'Tenaga Ahli',
        role: 'tenaga_ahli',
      },
      error: null,
    })

    const response = await requireOwnerAdminApi('Hanya Owner/Admin.')

    expect(response?.status).toBe(403)
    await expect(response?.json()).resolves.toEqual({
      error: 'Hanya Owner/Admin.',
      errorCode: 'FORBIDDEN',
    })
  })
})
