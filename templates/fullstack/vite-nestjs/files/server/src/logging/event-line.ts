import { logText, redactValue } from './redact';

export function formatEventLine(event: string, fields: Record<string, unknown> = {}): string {
  const safe = redactValue(fields) as Record<string, unknown>;
  const details = Object.entries(safe)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${logText(key)}=${value === null ? '-' : logText(value)}`);
  return [logText(event), ...details].join(' ');
}
