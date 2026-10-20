import { redactText } from './redact';

/** Keep bounded error causes and transport codes without dropping the underlying reason. */
export function describeError(error: unknown): string {
  const parts: string[] = [];
  let current = error;
  for (let depth = 0; depth < 5 && current != null; depth++) {
    if (!(current instanceof Error)) {
      parts.push(String(current));
      break;
    }
    const code = (current as { code?: unknown }).code;
    parts.push(
      `${current.name}: ${current.message}${typeof code === 'string' ? ` [${code}]` : ''}`,
    );
    current = current.cause;
  }
  return redactText(parts.join(' <- '));
}
