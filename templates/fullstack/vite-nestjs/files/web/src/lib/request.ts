import { linkAbort } from './abort';

export interface RequestOptions extends RequestInit {
  /** 0 disables the default 15-second timeout. Covers body parsing too. */
  timeoutMs?: number;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
  ) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = 'HttpError';
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 15_000, signal, ...init } = options;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0)
    throw new RangeError('timeoutMs must be non-negative');
  const controller = new AbortController();
  const release = linkAbort(controller, signal);
  const timer =
    timeoutMs > 0
      ? setTimeout(
          () => controller.abort(new DOMException('Request timed out', 'TimeoutError')),
          timeoutMs,
        )
      : undefined;
  try {
    const base = window.RUNTIME_CONFIG?.API_BASE_URL ?? '/api';
    const response = await fetch(`${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`, {
      ...init,
      signal: controller.signal,
    });
    if (!response.ok) throw new HttpError(response.status, response.statusText);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
    release();
  }
}
