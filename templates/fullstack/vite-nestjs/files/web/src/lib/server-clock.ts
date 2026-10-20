import { useSyncExternalStore } from 'react';

let base = Number.NaN;
let baseAt = 0;
let snapshot = Number.NaN;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

/** Elapsed time uses a monotonic clock, independent of user/system clock adjustments. */
export function serverClockMs(): number {
  return Number.isFinite(base) ? base + performance.now() - baseAt : Number.NaN;
}

function publish(): void {
  snapshot = serverClockMs();
  for (const listener of listeners) listener();
}

/** Calibrate once when a server response arrives, not on every consumer render. */
export function setServerClock(value: string | number | null | undefined): void {
  const parsed = typeof value === 'number' ? value : value ? Date.parse(value) : Number.NaN;
  if (!Number.isFinite(parsed)) return;
  base = parsed;
  baseAt = performance.now();
  publish();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  publish();
  timer ??= setInterval(publish, 1000);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** All consumers share a timer; the last unmount stops it. Uncalibrated reads are NaN. */
export function useServerClock(): number {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => Number.NaN,
  );
}
