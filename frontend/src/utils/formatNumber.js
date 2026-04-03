/** Indian-style digit grouping (e.g. 4,95,000 / 30,000) */
export const NUMBER_LOCALE = 'en-IN'

export function formatInt(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return Math.trunc(n).toLocaleString(NUMBER_LOCALE)
}

export function formatAmount(value, { maxDecimals = 2 } = {}) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(NUMBER_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
}
