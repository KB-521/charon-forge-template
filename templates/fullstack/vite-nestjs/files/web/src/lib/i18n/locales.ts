export type AppLocale = 'zh-CN' | 'en-US';
export const DEFAULT_LOCALE: AppLocale = 'zh-CN';
export function normalizeLocale(value?: string | null): AppLocale {
  return value?.trim().replace('_', '-').toLowerCase().split('-')[0] === 'en'
    ? 'en-US'
    : DEFAULT_LOCALE;
}
