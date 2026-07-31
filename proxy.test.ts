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

  it('redirects retired RAB pages back to active project monitoring', async () => {
    const listResponse = await proxy(new NextRequest('https://example.test/proyek/rab'))
    const detailResponse = await proxy(new NextRequest('https://example.test/proyek/project-1/rab'))

    expect(listResponse.status).toBe(307)
    expect(listResponse.headers.get('location')).toBe('https://example.test/proyek')
    expect(detailResponse.status).toBe(307)
    expect(detailResponse.headers.get('location')).toBe('https://example.test/proyek')
  })

  it('returns not found for retired RAB and AHSP API surfaces', async () => {
    const rabResponse = await proxy(new NextRequest('https://example.test/api/proyek/project-1/rab'))
    const workflowResponse = await proxy(new NextRequest('https://example.test/api/proyek/project-1/workflow'))
    const ahspResponse = await proxy(new NextRequest('https://example.test/api/master/ahsp'))

    expect(rabResponse.status).toBe(404)
    expect(workflowResponse.status).toBe(404)
    expect(ahspResponse.status).toBe(404)
    await expect(rabResponse.json()).resolves.toMatchObject({
      errorCode: 'NOT_FOUND',
    })
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
