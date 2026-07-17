import { describe, expect, it } from 'vitest'

import { apiError } from '@/lib/api-response'

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
