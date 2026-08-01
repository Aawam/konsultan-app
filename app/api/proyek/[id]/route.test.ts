import type { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createAuthenticatedSupabaseServerClient,
  getProyekById,
  getOverrideLogsByProyekId,
  requireCurrentUserProfileApi,
} = vi.hoisted(() => ({
  createAuthenticatedSupabaseServerClient: vi.fn(),
  getProyekById: vi.fn(),
  getOverrideLogsByProyekId: vi.fn(),
  requireCurrentUserProfileApi: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createAuthenticatedSupabaseServerClient,
}))

vi.mock('@/lib/api-auth', () => ({
  requireCurrentUserProfileApi,
  requireOwnerAdminApi: vi.fn(),
}))

vi.mock('@/lib/actions/proyek', () => ({
  buildProyekPayload: vi.fn(),
  getProyekById,
  getOverrideLogsByProyekId,
}))

import { GET } from '@/app/api/proyek/[id]/route'

const projectId = '00000000-0000-4000-8000-000000000001'

describe('GET /api/proyek/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireCurrentUserProfileApi.mockResolvedValue({
      profile: {
        id: '00000000-0000-4000-8000-000000000002',
        email: 'teknis@example.com',
        nama: 'Tenaga Ahli',
        role: 'Teknis',
      },
      response: null,
    })
    getProyekById.mockResolvedValue({
      data: {
        id: projectId,
        nama_proyek: 'Pengawasan Jalan',
        pagu_dana: null,
        hps: null,
        nilai_penawaran: null,
        catatan: null,
      },
      error: null,
    })

    const notFoundQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    notFoundQuery.select.mockReturnValue(notFoundQuery)
    notFoundQuery.eq.mockReturnValue(notFoundQuery)

    createAuthenticatedSupabaseServerClient.mockResolvedValue({
      supabase: { from: vi.fn(() => notFoundQuery) },
      authError: null,
    })
  })

  it('loads the technical projection without exposing commercial data or override logs', async () => {
    const response = await GET(
      new Request(`http://localhost/api/proyek/${projectId}`) as NextRequest,
      { params: Promise.resolve({ id: projectId }) }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      data: {
        proyek: {
          id: projectId,
          pagu_dana: null,
          hps: null,
          nilai_penawaran: null,
          catatan: null,
        },
        overrideLogs: [],
      },
    })
    expect(getProyekById).toHaveBeenCalledWith(projectId, { includeSensitive: false })
    expect(getOverrideLogsByProyekId).not.toHaveBeenCalled()
  })
})
