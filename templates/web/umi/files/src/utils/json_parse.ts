export function parseJSON<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T
  }
  catch {
    return fallback
  }
}
