export const DEFAULT_LOCALE = 'zh-CN'

export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

const LOCALE_ALIAS_MAP: Record<string, AppLocale> = {
  'zh': 'zh-CN',
  'zh-cn': 'zh-CN',
  'zh-hans': 'zh-CN',
  'en': 'en-US',
  'en-us': 'en-US',
}

/**
 * 将外部语言值归一化为站点支持的语言。
 * @param locale 待归一化的语言值。
 * @returns 支持的站点语言；未命中时返回默认语言。
 */
export function normalizeLocale(locale?: string | null): AppLocale {
  if (!locale)
    return DEFAULT_LOCALE

  const normalizedLocale = locale.trim().replace('_', '-').toLowerCase()
  return LOCALE_ALIAS_MAP[normalizedLocale] || DEFAULT_LOCALE
}
