function params(url = '') {
  const parsed = new URL(url || window.location.href, 'http://localhost')
  const result = new URLSearchParams(parsed.search)
  const start = parsed.hash.indexOf('?')
  if (start >= 0) {
    new URLSearchParams(parsed.hash.slice(start + 1)).forEach((value, key) =>
      result.append(key, value),
    )
  }
  return result
}
export function getUrlQuery(name: string, url = '') {
  return params(url).get(name)
}
export function getUrlAllQuery(url = '') {
  const values = new Map<string, string | string[]>()
  params(url).forEach((value, key) => {
    const prev = values.get(key)
    values.set(
      key,
      prev === undefined
        ? value
        : [...new Set([...(Array.isArray(prev) ? prev : [prev]), value])],
    )
  })
  return Object.fromEntries(values)
}
