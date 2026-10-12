export function normalizeWebUrl(input: string | undefined): string | null {
  const value = (input ?? '').trim()
  if (!value) return ''

  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) return null

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

    return url.href
  } catch {
    return null
  }
}
