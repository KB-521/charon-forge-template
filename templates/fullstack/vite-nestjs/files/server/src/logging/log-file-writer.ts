import { appendFile, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadRuntimeConfiguration } from '../config/runtime-configuration';
import { logText } from './redact';

export type LogStream = 'app' | 'error' | 'access';
export interface LogFileOptions {
  directory: string;
  retentionDays: number;
  enabled: boolean;
  timeZone: string;
}

function dateLabel(now: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const read = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${read('year')}-${read('month')}-${read('day')}`;
}

export function resolveLogFileOptions(): LogFileOptions {
  const config = loadRuntimeConfiguration();
  const read = (key: string): string | undefined => process.env[key] ?? config[key];
  const enabled = read('LOG_TO_FILE') ?? 'true';
  if (!['true', 'false'].includes(enabled)) throw new Error('LOG_TO_FILE must be true or false');
  const retentionDays = Number(read('LOG_RETENTION_DAYS') ?? 14);
  if (!Number.isInteger(retentionDays) || retentionDays < 1)
    throw new Error('LOG_RETENTION_DAYS must be positive');
  const timeZone = read('LOG_TIME_ZONE') ?? 'UTC';
  dateLabel(Date.now(), timeZone);
  return {
    directory: resolve(__dirname, '..', '..', read('LOG_DIR') || 'log'),
    retentionDays,
    enabled: enabled === 'true',
    timeZone,
  };
}

export function formatLogLine(
  level: string,
  context: string | undefined,
  message: unknown,
): string {
  return `${new Date().toISOString()} pid=${process.pid} ${level.padEnd(6)} ${context ? `[${logText(context)}] ` : ''}${logText(message)}`;
}

/** Sequential writes preserve ordering; only dated directories inside the configured root are pruned. */
export class LogFileWriter {
  private queue: Promise<void> = Promise.resolve();
  private currentDay = '';
  private failed = false;
  constructor(private readonly options: LogFileOptions) {}
  get enabled(): boolean {
    return this.options.enabled && !this.failed;
  }
  get directory(): string {
    return this.options.directory;
  }

  write(stream: LogStream, line: string): Promise<void> {
    if (!this.enabled) return Promise.resolve();
    this.queue = this.queue.then(async () => {
      if (!this.enabled) return;
      try {
        if (!['app', 'error', 'access'].includes(stream)) throw new Error('Unknown log stream');
        const now = Date.now();
        const day = dateLabel(now, this.options.timeZone);
        await mkdir(this.options.directory, { recursive: true });
        if (day !== this.currentDay) {
          await this.prune(day);
          this.currentDay = day;
        }
        const directory = resolve(this.options.directory, day);
        await mkdir(directory, { recursive: true });
        await appendFile(resolve(directory, `${stream}.log`), `${logText(line)}\n`, {
          encoding: 'utf8',
          mode: 0o600,
        });
      } catch (error) {
        this.failed = true;
        console.warn(`File logging disabled: ${logText(error)}`);
      }
    });
    return this.queue;
  }
  flush(): Promise<void> {
    return this.queue;
  }

  private async prune(today: string): Promise<void> {
    const cutoff = Date.parse(`${today}T00:00:00Z`) - (this.options.retentionDays - 1) * 86_400_000;
    for (const entry of await readdir(this.options.directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || !/^\d{4}-\d{2}-\d{2}$/.test(entry.name)) continue;
      const time = Date.parse(`${entry.name}T00:00:00Z`);
      if (Number.isFinite(time) && time < cutoff)
        await rm(resolve(this.options.directory, entry.name), { recursive: true, force: true });
    }
  }
}

let writer: LogFileWriter | undefined;
export function getLogFileWriter(): LogFileWriter {
  return (writer ??= new LogFileWriter(resolveLogFileOptions()));
}
