import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CurrentUserProfile } from '@/lib/auth-types'
import { getProyekById } from '@/lib/actions/proyek'
import { canAccessRabProject } from '@/lib/actions/rab'

vi.mock('@/lib/actions/proyek', () => ({
  DEFAULT_PROYEK_LIST_PAGE_SIZE: 25,
  getDaftarProyekPage: vi.fn(),
  getProyekById: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

const getProyekByIdMock = vi.mocked(getProyekById)

const tenagaAhliProfile: CurrentUserProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'teknis@example.com',
  nama: 'Tenaga Ahli',
  role: 'tenaga_ahli',
}

const ownerProfile: CurrentUserProfile = {
  id: '00000000-0000-4000-8000-000000000002',
  email: 'owner@example.com',
  nama: 'Owner',
  role: 'owner_admin',
}

describe('canAccessRabProject', () => {
  beforeEach(() => {
    getProyekByIdMock.mockReset()
  })

  it('allows a technical user to access an active planning project without project assignment checks', async () => {
    getProyekByIdMock.mockResolvedValue({
      data: { jenis_pekerjaan: 'Perencanaan' },
      error: null,
    } as Awaited<ReturnType<typeof getProyekById>>)

    await expect(canAccessRabProject('project-id', tenagaAhliProfile)).resolves.toBe(true)

    expect(getProyekByIdMock).toHaveBeenCalledWith('project-id', { includeSensitive: false })
  })

  it('keeps RAB blocked for non-planning projects', async () => {
    getProyekByIdMock.mockResolvedValue({
      data: { jenis_pekerjaan: 'Pengawasan' },
      error: null,
    } as Awaited<ReturnType<typeof getProyekById>>)

    await expect(canAccessRabProject('project-id', tenagaAhliProfile)).resolves.toBe(false)
  })

  it('uses sensitive owner/admin reads without bypassing the planning-project check', async () => {
    getProyekByIdMock.mockResolvedValue({
      data: { jenis_pekerjaan: 'Perencanaan' },
      error: null,
    } as Awaited<ReturnType<typeof getProyekById>>)

    await expect(canAccessRabProject('project-id', ownerProfile)).resolves.toBe(true)

    expect(getProyekByIdMock).toHaveBeenCalledWith('project-id', { includeSensitive: true })
  })

  it('blocks anonymous access', async () => {
    await expect(canAccessRabProject('project-id', null)).resolves.toBe(false)

    expect(getProyekByIdMock).not.toHaveBeenCalled()
  })
})
