import { describe, expect, it } from 'vitest'
import type { NextRequest } from 'next/server'

import { POST } from '@/app/api/proyek/route'

describe('POST /api/proyek', () => {
  it('returns a structured BAD_REQUEST response for malformed JSON', async () => {
    const request = new Request('http://localhost/api/proyek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    }) as NextRequest

    const response = await POST(request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Body request harus berupa JSON valid.',
      errorCode: 'BAD_REQUEST',
    })
  })
})
