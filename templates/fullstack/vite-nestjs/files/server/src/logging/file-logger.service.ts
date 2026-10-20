import { ConsoleLogger, type LoggerService } from '@nestjs/common';
import { formatLogLine, type LogFileWriter } from './log-file-writer';
import { logText } from './redact';

type ConsoleMethod = 'log' | 'warn' | 'error' | 'debug' | 'verbose' | 'fatal';

/** Console and file output receive the same sanitized values. */
export class FileLogger implements LoggerService {
  private readonly console = new ConsoleLogger('app');
  constructor(private readonly writer: LogFileWriter) {}
  log(message: unknown, ...args: unknown[]): void {
    this.emit('log', 'INFO', message, args);
  }
  warn(message: unknown, ...args: unknown[]): void {
    this.emit('warn', 'WARN', message, args);
  }
  error(message: unknown, ...args: unknown[]): void {
    this.emit('error', 'ERROR', message, args);
  }
  debug(message: unknown, ...args: unknown[]): void {
    this.emit('debug', 'DEBUG', message, args);
  }
  verbose(message: unknown, ...args: unknown[]): void {
    this.emit('verbose', 'VERBOSE', message, args);
  }
  fatal(message: unknown, ...args: unknown[]): void {
    this.emit('fatal', 'FATAL', message, args);
  }
  private emit(method: ConsoleMethod, level: string, message: unknown, args: unknown[]): void {
    const safe = logText(message);
    const extra = args.map((value) => logText(value));
    this.console[method](safe, ...extra);
    const line = formatLogLine(level, undefined, [safe, ...extra].join(' '));
    void this.writer.write('app', line);
    if (['warn', 'error', 'fatal'].includes(method)) void this.writer.write('error', line);
  }
}
