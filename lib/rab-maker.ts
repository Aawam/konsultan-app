export function parseRabDecimalInput(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeOverrideReason(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().replace(/\s+/g, ' ')
  return normalized.length > 0 ? normalized : null
}
