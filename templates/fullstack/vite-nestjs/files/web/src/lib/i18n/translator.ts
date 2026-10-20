import { useSyncExternalStore } from 'react';
import { DEFAULT_LOCALE, normalizeLocale, type AppLocale } from './locales';
import zh from './messages/zh-CN.json';
import en from './messages/en-US.json';

export const LOCALE_STORAGE_KEY = 'app-locale';
const catalogs: Record<AppLocale, Record<string, string>> = { 'zh-CN': zh, 'en-US': en };
const listeners = new Set<() => void>();
let locale: AppLocale = DEFAULT_LOCALE;

export function getLocale(): AppLocale {
  return locale;
}
export function setLocale(value: AppLocale): void {
  locale = normalizeLocale(value);
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* Storage may be unavailable. */
    }
  }
  for (const listener of listeners) listener();
}

/** Call before mounting React. Storage failure falls back to browser language. */
export function initLocale(): AppLocale {
  let stored: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      /* Use browser/default. */
    }
  }
  setLocale(
    normalizeLocale(
      stored || (typeof navigator !== 'undefined' ? navigator.language : DEFAULT_LOCALE),
    ),
  );
  return locale;
}

export function t(key: string, params: Record<string, string | number> = {}): string {
  const text = catalogs[locale][key] ?? catalogs[DEFAULT_LOCALE][key] ?? key;
  return text.replace(/\{([^{}]+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function useLocale(): AppLocale {
  return useSyncExternalStore(subscribe, getLocale, () => DEFAULT_LOCALE);
}
