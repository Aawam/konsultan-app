import { describe, expect, it } from 'vitest'

import {
  buildRequestHeaders,
  getMeasuredPaths,
} from './measure-latency-options.mjs'

describe('latency measurement options', () => {
  it('keeps warm-cache measurements cacheable by default', () => {
    expect(buildRequestHeaders({ bypassCache: false })).toEqual({
      'User-Agent': 'konsultan-app-latency-check/1.0',
    })
  })

  it('bypasses caches only when explicitly requested', () => {
    expect(buildRequestHeaders({ bypassCache: true })).toEqual({
      'User-Agent': 'konsultan-app-latency-check/1.0',
      'Cache-Control': 'no-cache',
    })
  })

  it('adds an authenticated cookie without exposing it in output metadata', () => {
    const headers = buildRequestHeaders({
      bypassCache: false,
      cookie: 'sb-session=secret',
    })

    expect(headers.Cookie).toBe('sb-session=secret')
    expect(getMeasuredPaths()).toEqual(['/', '/login'])
    expect(getMeasuredPaths('sb-session=secret')).toEqual(['/', '/login', '/proyek', '/database'])
  })
})
