import { describe, expect, it } from 'vitest'
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server'
import { NextRequest } from 'next/server'
import { config, proxy } from './proxy'

describe('proxy', () => {
  it('matches API routes so mutation rate limiting can run', () => {
    expect(unstable_doesMiddlewareMatch({ config, url: '/api/proyek' })).toBe(true)
    expect(unstable_doesMiddlewareMatch({ config, url: '/api/proyek/123/rab' })).toBe(true)
    expect(unstable_doesMiddlewareMatch({ config, url: '/_next/static/chunk.js' })).toBe(false)
  })

  it('rate-limits repeated API mutations before route handlers run', async () => {
    const pathname = `/api/test-rate-limit-${Date.now()}`
    let response: Response | undefined

    for (let index = 0; index <= 90; index += 1) {
      response = await proxy(new NextRequest(`https://example.test${pathname}`, {
        method: 'POST',
        headers: {
          'x-forwarded-for': '203.0.113.10',
        },
      }))
    }

    expect(response?.status).toBe(429)
    expect(response?.headers.get('retry-after')).toBe('60')
    await expect(response?.json()).resolves.toMatchObject({
      errorCode: 'TOO_MANY_REQUESTS',
    })
  })
})
