import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useMediaQuery } from '@/hooks/use-media-query'

function MediaQueryProbe() {
  return <span>{String(useMediaQuery('(max-width: 1023px)'))}</span>
}

describe('useMediaQuery', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the first browser render aligned with the server snapshot', () => {
    vi.stubGlobal('window', {
      matchMedia: vi.fn(() => ({ matches: true })),
    })

    expect(renderToString(<MediaQueryProbe />)).toContain('false')
  })
})
