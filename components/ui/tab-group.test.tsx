import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { TabGroup } from '@/components/ui/tab-group'

describe('TabGroup', () => {
  it('renders non-submit controls with an accessible group name', () => {
    const markup = renderToStaticMarkup(
      <form>
        <TabGroup
          ariaLabel="Filter tahun"
          tabs={[{ label: 'Semua', value: 'semua' }]}
          value="semua"
          onChange={() => undefined}
        />
      </form>
    )

    expect(markup).toContain('role="group"')
    expect(markup).toContain('aria-label="Filter tahun"')
    expect(markup).toContain('type="button"')
  })
})
