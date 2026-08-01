import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PageError } from '@/components/ui/page-error'

describe('PageError', () => {
  it('shows a useful recovery message without exposing the technical payload', () => {
    const markup = renderToStaticMarkup(
      <PageError error={{ message: 'database failure', token: 'sensitive-value' }} />
    )

    expect(markup).toContain('Tidak dapat memuat data')
    expect(markup).toContain('Muat ulang halaman')
    expect(markup).not.toContain('database failure')
    expect(markup).not.toContain('sensitive-value')
  })
})
