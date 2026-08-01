import { describe, expect, it } from 'vitest'
import {
  formatCompactRupiah,
  formatNumberInput,
  formatRupiah,
  formatTanggal,
  parseNumberInput,
} from '@/lib/utils'

describe('formatRupiah', () => {
  it('formats Indonesian rupiah without fraction digits', () => {
    expect(formatRupiah(1250000)).toBe('Rp\u00a01.250.000')
  })

  it('uses a dash for null values', () => {
    expect(formatRupiah(null)).toBe('-')
  })
})

describe('formatCompactRupiah', () => {
  it('formats billion values in a compact Indonesian form', () => {
    expect(formatCompactRupiah(79_552_250_000)).toBe('Rp 79,55 M')
  })

  it('formats million values in a compact Indonesian form', () => {
    expect(formatCompactRupiah(1_250_000)).toBe('Rp 1,3 jt')
  })

  it('keeps smaller values in the standard rupiah form', () => {
    expect(formatCompactRupiah(750_000)).toBe('Rp\u00a0750.000')
  })

  it('uses a dash for null values', () => {
    expect(formatCompactRupiah(null)).toBe('-')
  })
})

describe('formatTanggal', () => {
  it('formats dates in Indonesian long format', () => {
    expect(formatTanggal('2026-06-16')).toContain('2026')
  })

  it('uses a dash for empty values', () => {
    expect(formatTanggal(null)).toBe('-')
  })
})

describe('number input helpers', () => {
  it('parses formatted strings into numbers', () => {
    expect(parseNumberInput('1.250.000')).toBe(1250000)
  })

  it('formats numeric strings with thousand separators', () => {
    expect(formatNumberInput('1250000')).toBe('1.250.000')
  })
})
