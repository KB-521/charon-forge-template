import { getLocale } from './i18n/translator';

/** Defaults to UTC; callers may choose any Intl-supported display time zone. */
export function formatDateTime(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
  locale = getLocale(),
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    ...(options ?? { dateStyle: 'medium', timeStyle: 'medium' }),
  }).format(date);
}
