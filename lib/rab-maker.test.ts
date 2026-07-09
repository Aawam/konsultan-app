import { describe, expect, it } from 'vitest'

import { normalizeOverrideReason, parseRabDecimalInput } from '@/lib/rab-maker'

describe('parseRabDecimalInput', () => {
  it('parses Indonesian decimal and thousands formats', () => {
    expect(parseRabDecimalInput('1,5')).toBe(1.5)
    expect(parseRabDecimalInput('1.500,25')).toBe(1500.25)
    expect(parseRabDecimalInput('1500.25')).toBe(1500.25)
  })

  it('rejects empty and non-numeric values', () => {
    expect(parseRabDecimalInput('')).toBeNull()
    expect(parseRabDecimalInput('abc')).toBeNull()
    expect(parseRabDecimalInput(Number.NaN)).toBeNull()
    expect(parseRabDecimalInput(null)).toBeNull()
  })
})

describe('normalizeOverrideReason', () => {
  it('trims and collapses whitespace in override reasons', () => {
    expect(normalizeOverrideReason('  Harga pasar   Berau terbaru  ')).toBe('Harga pasar Berau terbaru')
  })

  it('rejects empty and non-string reasons', () => {
    expect(normalizeOverrideReason('   ')).toBeNull()
    expect(normalizeOverrideReason(null)).toBeNull()
    expect(normalizeOverrideReason(12)).toBeNull()
  })
})
