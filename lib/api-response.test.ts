import { describe, expect, it } from 'vitest'

import { apiData, apiError, apiOk, apiUnauthorized } from '@/lib/api-response'

describe('API cache policy', () => {
  it.each([
    ['success data', () => apiData({ id: 'project-1' })],
    ['success acknowledgement', () => apiOk()],
    ['error', () => apiError('NOT_FOUND', 'Tidak ditemukan.', 404)],
  ])('marks %s responses as private and non-cacheable', (_label, createResponse) => {
    const response = createResponse()

    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0')
  })
})

describe('apiError', () => {
  it('does not expose internal error messages or details to API clients', async () => {
    const response = apiError(
      'INTERNAL_ERROR',
      'relation public.proyek does not exist',
      500,
      { hint: 'Inspect the database migration history.' }
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Terjadi kesalahan pada server. Silakan coba lagi.',
      errorCode: 'INTERNAL_ERROR',
    })
  })
})

describe('apiUnauthorized', () => {
  it('returns the canonical API error contract for unauthenticated requests', async () => {
    const response = apiUnauthorized()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'Unauthorized',
      errorCode: 'UNAUTHORIZED',
    })
  })
})
