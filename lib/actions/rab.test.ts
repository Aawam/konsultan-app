import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CurrentUserProfile } from '@/lib/auth-types'
import { getProyekById } from '@/lib/actions/proyek'
import {
  assertRabDetailBelongsToProject,
  assertRabItemBelongsToProject,
  canAccessRabProject,
} from '@/lib/actions/rab'

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

function queryResult(result: { data: unknown; error: { message: string } | null }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
  }

  return query
}

describe('RAB nested resource binding', () => {
  it('accepts an item only when its maker belongs to the URL project', async () => {
    const itemQuery = queryResult({ data: { rab_maker_id: 'maker-1' }, error: null })
    const makerQuery = queryResult({ data: { id: 'maker-1' }, error: null })
    const client = {
      from: vi.fn((table: string) => table === 'rab_maker_items' ? itemQuery : makerQuery),
    }

    await expect(assertRabItemBelongsToProject('project-1', 'item-1', client as never)).resolves.toEqual({
      ok: true,
      error: null,
    })

    expect(makerQuery.eq).toHaveBeenCalledWith('proyek_id', 'project-1')
  })

  it('rejects an item when no maker matches the URL project', async () => {
    const itemQuery = queryResult({ data: { rab_maker_id: 'maker-1' }, error: null })
    const makerQuery = queryResult({ data: null, error: null })
    const client = {
      from: vi.fn((table: string) => table === 'rab_maker_items' ? itemQuery : makerQuery),
    }

    await expect(assertRabItemBelongsToProject('project-2', 'item-1', client as never)).resolves.toEqual({
      ok: false,
      error: null,
    })
  })

  it('rejects a detail when it is not under the URL item before checking the project', async () => {
    const detailQuery = queryResult({ data: { rab_maker_item_id: 'other-item' }, error: null })
    const client = {
      from: vi.fn(() => detailQuery),
    }

    await expect(assertRabDetailBelongsToProject('project-1', 'item-1', 'detail-1', client as never)).resolves.toEqual({
      ok: false,
      error: null,
    })

    expect(client.from).toHaveBeenCalledTimes(1)
  })
})
