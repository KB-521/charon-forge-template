import type { Locale } from 'antd/es/locale'
import type { AppLocale } from './locales'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import { normalizeLocale } from './locales'

export const antdLocaleMap: Record<AppLocale, Locale> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

/**
 * 根据站点语言获取 Ant Design locale。
 * @param locale 当前站点语言。
 * @returns 对应的 Ant Design locale；未命中时回退中文。
 */
export function getAntdLocale(locale: AppLocale): Locale {
  return antdLocaleMap[normalizeLocale(locale)]
}
