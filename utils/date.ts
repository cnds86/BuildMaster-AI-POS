/**
 * Date helpers — single source of truth for safe date rendering.
 *
 * BUG-FIX (FIX-BUGS-01, BUG-FE-02): some backend rows have null/invalid
 * `scheduledDate` / `completedAt` strings. `new Date('garbage')` returns
 * Invalid Date, and `toLocaleDateString` then renders the literal string
 * "Invalid Date" in the UI. Guard against this once and reuse.
 */

/**
 * Returns true iff `value` parses to a real Date (not Invalid Date).
 * Treats null, undefined, empty string, and bad strings as invalid.
 */
export function isValidDate(value: unknown): value is string | number | Date {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  const d = value instanceof Date ? value : new Date(value as string | number)
  return d instanceof Date && !Number.isNaN(d.getTime())
}

/**
 * Safe date formatter. Returns the placeholder em-dash for null/invalid
 * input so the UI never shows "Invalid Date" or "NaN".
 */
export function formatDate(
  value: unknown,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  },
  locale: string = 'en-GB',
  placeholder: string = '—',
): string {
  if (!isValidDate(value)) return placeholder
  const d = value instanceof Date ? value : new Date(value as string | number)
  try {
    return d.toLocaleDateString(locale, options)
  } catch {
    return placeholder
  }
}

/**
 * Safe date+time formatter. Same guards as `formatDate` but with hours/minutes.
 */
export function formatDateTime(
  value: unknown,
  locale: string = 'en-GB',
  placeholder: string = '—',
): string {
  return formatDate(
    value,
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    locale,
    placeholder,
  )
}
