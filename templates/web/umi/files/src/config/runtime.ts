export interface RuntimeConfig {
  APP_NAME: string
  MODE: 'demo' | 'api'
  API_BASE_URL: string
}
export function getRuntimeConfig(): RuntimeConfig {
  const raw = typeof window === 'undefined' ? undefined : window.CONFIG
  const mode = raw?.MODE ?? 'demo'
  if (mode !== 'demo' && mode !== 'api')
    throw new Error('运行模式必须为 demo 或 api')
  const base = raw?.API_BASE_URL ?? '/api'
  if (!(base.startsWith('/') && !base.startsWith('//'))) {
    const url = new URL(base)
    if (
      !['http:', 'https:'].includes(url.protocol)
      || url.username
      || url.password
      || url.search
      || url.hash
    ) {
      throw new Error('API_BASE_URL 配置不合法')
    }
  }
  return {
    APP_NAME: raw?.APP_NAME || 'Umi Admin',
    MODE: mode,
    API_BASE_URL: base,
  }
}
