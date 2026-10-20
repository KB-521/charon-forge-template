import { inspect } from 'node:util';

const PRIVATE_KEY =
  /password|passwd|secret|token|authorization|cookie|credential|(?:access|api)[-_]?key/i;
const HIDDEN = '[REDACTED]';

export function redactText(text: string): string {
  let safe = text;
  for (const [key, value] of Object.entries(process.env).sort(
    (a, b) => (b[1]?.length ?? 0) - (a[1]?.length ?? 0),
  )) {
    if (PRIVATE_KEY.test(key) && value && value.length >= 4) safe = safe.split(value).join(HIDDEN);
  }
  return safe
    .replace(/\b(https?:\/\/)[^/\s:@]+:[^/\s@]+@/gi, `$1${HIDDEN}@`)
    .replace(
      /\b(?:authorization|cookie)\s*[:=]\s*[^\r\n]+/gi,
      (match) => `${match.split(/[:=]/, 1)[0]}=${HIDDEN}`,
    )
    .replace(
      /((?:["']?)(?:[\w-]*(?:password|passwd|secret|token|credential|(?:access|api)[_-]?key)[\w-]*)(?:["']?)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&}]+)/gi,
      `$1${HIDDEN}`,
    );
}

export function redactValue(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
  if (typeof value === 'string') return redactText(value);
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  if (depth > 6) return '[Max depth]';
  seen.add(value);
  if (value instanceof Error)
    return {
      name: value.name,
      message: redactText(value.message),
      stack: value.stack && redactText(value.stack),
      cause: redactValue(value.cause, seen, depth + 1),
    };
  if (Array.isArray(value)) return value.map((item) => redactValue(item, seen, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      PRIVATE_KEY.test(key) ? HIDDEN : redactValue(item, seen, depth + 1),
    ]),
  );
}

export function logText(value: unknown): string {
  const safe = redactValue(value);
  return (
    typeof safe === 'string'
      ? safe
      : inspect(safe, { depth: 6, breakLength: Infinity, colors: false })
  ).replace(/[\r\n]/g, (character) => (character === '\r' ? '\\r' : '\\n'));
}
