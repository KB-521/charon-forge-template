import type { AppLocale } from './locales'
import { DEFAULT_LOCALE, normalizeLocale } from './locales'
import enUSMessages from './messages/en-US.json'
import zhCNMessages from './messages/zh-CN.json'

export const LOCALE_STORAGE_KEY = 'app-locale'

type MessageParams = Record<string, string | number>
type MessageMap = Record<string, string>

const MESSAGE_MAP: Record<AppLocale, MessageMap> = {
  'zh-CN': zhCNMessages,
  'en-US': enUSMessages,
}

let currentLocale: AppLocale | undefined

/**
 * 初始化站点语言，并同步页面根节点的 lang 属性。
 * 语言来源优先级为 localStorage、浏览器语言、默认语言；服务端环境使用默认语言。
 * @returns 当前生效的站点语言。
 */
export function initLocale(): AppLocale {
  if (typeof window === 'undefined')
    return DEFAULT_LOCALE
  if (!currentLocale) {
    let storedLocale: string | null = null

    if (typeof window !== 'undefined') {
      try {
        storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY)
      }
      catch {
        // 浏览器禁用存储时继续使用浏览器语言或默认语言。
      }
    }

    const browserLocale = typeof navigator === 'undefined' ? null : navigator.language

    currentLocale = normalizeLocale(storedLocale || browserLocale || DEFAULT_LOCALE)
  }

  if (typeof document !== 'undefined')
    document.documentElement.lang = currentLocale

  return currentLocale
}

/**
 * 获取当前站点语言。
 * 首次调用时会初始化语言，后续仅返回内存中的语言值。
 * @returns 当前生效的站点语言。
 */
export function getLocale(): AppLocale {
  return currentLocale || initLocale()
}

export function isNotDefaultLocale(): boolean {
  return getLocale() !== DEFAULT_LOCALE
}

/**
 * 设置站点语言，并在语言发生变化时按配置刷新页面。
 * @param locale 要切换到的站点语言。
 * @param options 切换配置；reload 默认为 true。
 * @param options.reload 语言改变后是否刷新页面，默认为 true。
 */
export function setLocale(locale: AppLocale, options: { reload?: boolean } = {}): void {
  const normalizedLocale = normalizeLocale(locale)
  const localeChanged = normalizedLocale !== getLocale()

  if (typeof window === 'undefined')
    return

  currentLocale = normalizedLocale

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, normalizedLocale)
  }
  catch {
    // 浏览器禁用存储时仍更新内存语言和页面语言。
  }

  document.documentElement.lang = normalizedLocale

  if (localeChanged && (options.reload ?? true))
    window.location.reload()
}

/**
 * 根据词条 key 获取当前语言文案，并执行简单占位符插值。
 * @param key 词条 key。
 * @param params 可选插值参数，替换文案中的同名 `{参数}` 占位符。
 * @returns 当前语言文案；缺失时回退默认中文，仍缺失则返回 key。
 */
export function t(key: string, params?: MessageParams): string {
  const locale = getLocale()
  const message = MESSAGE_MAP[locale][key] || MESSAGE_MAP[DEFAULT_LOCALE][key] || key

  if (message === key) {
    console.error('i18n key not found:', key)
  }

  if (!params)
    return message

  return Object.entries(params).reduce(
    (result, [paramKey, value]) => result.split(`{${paramKey}}`).join(String(value)),
    message,
  )
}

/**
 * 统一解析带翻译 key 和兜底文案的配置文本。
 * @param key 可选词条 key。
 * @param fallback key 缺失或未配置时使用的兜底文案。
 * @returns 解析后的展示文案。
 */
export function resolveI18nText(key?: string, fallback = '', params?: MessageParams): string {
  if (!key)
    return interpolateMessage(fallback, params)

  const translatedText = t(key, params)
  return translatedText === key ? interpolateMessage(fallback, params) || key : translatedText
}

/**
 * 对兜底文案执行与词条一致的简单占位符插值。
 * @param message 待插值文案。
 * @param params 可选插值参数。
 * @returns 完成插值的文案。
 */
function interpolateMessage(message: string, params?: MessageParams): string {
  if (!params)
    return message

  return Object.entries(params).reduce(
    (result, [paramKey, value]) => result.split(`{${paramKey}}`).join(String(value)),
    message,
  )
}
