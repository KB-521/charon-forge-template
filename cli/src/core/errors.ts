export class ForgeError extends Error {
  constructor(
    public code: string,
    public stage: string,
    message: string,
    public retryable = false,
  ) {
    super(message);
    this.name = 'ForgeError';
  }
}
export function fail(code: string, stage: string, message: string): never {
  throw new ForgeError(code, stage, message);
}
export function exitCode(error: unknown): number {
  if (!(error instanceof ForgeError)) return 1;
  if (error.code === 'E_CANCELLED') return 130;
  if (['E_INPUT', 'E_TARGET_EXISTS'].includes(error.code)) return 2;
  if (['E_NETWORK', 'E_OFFLINE_MISS'].includes(error.code)) return 3;
  if (['E_SCHEMA', 'E_COMPAT', 'E_INTEGRITY', 'E_ARCHIVE', 'E_RENDER'].includes(error.code))
    return 4;
  if (['E_WRITE', 'E_INCOMPLETE'].includes(error.code)) return 5;
  if (['E_TOOL', 'E_INSTALL'].includes(error.code)) return 6;
  return 1;
}
export function cancelled(signal?: AbortSignal): void {
  if (signal?.aborted) fail('E_CANCELLED', 'cancel', '操作已取消。');
}
