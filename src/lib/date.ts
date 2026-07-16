// UTC on purpose: publish dates are editorial facts, not timestamps — the
// same post shouldn't show different dates to visitors in different
// timezones (or flip days between server and local).
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
