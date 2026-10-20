/** Link cancellation owners; release listeners when the operation settles. */
export function linkAbort(
  controller: AbortController,
  ...signals: Array<AbortSignal | null | undefined>
): () => void {
  const releases: Array<() => void> = [];
  for (const signal of new Set(signals)) {
    if (!signal || controller.signal.aborted) continue;
    const abort = () => controller.abort(signal.reason);
    if (signal.aborted) abort();
    else {
      signal.addEventListener('abort', abort, { once: true });
      releases.push(() => signal.removeEventListener('abort', abort));
    }
  }
  return () => releases.forEach((release) => release());
}
