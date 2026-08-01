import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'

describe('Select', () => {
  it('uses touch-friendly default controls on compact viewports', () => {
    const markup = renderToStaticMarkup(
      <Select defaultValue="semua">
        <SelectTrigger aria-label="Contoh filter">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="semua">Semua</SelectItem>
        </SelectContent>
      </Select>
    )

    expect(markup).toContain('data-[size=default]:h-10')
    expect(markup).toContain('lg:data-[size=default]:h-9')
  })
})
