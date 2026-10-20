import type { IncomingMessage, ServerResponse } from 'node:http';
import { performance } from 'node:perf_hooks';
import { formatLogLine, type LogFileWriter } from './log-file-writer';

/** Never record query values, headers or request bodies. */
export function createAccessLogMiddleware(
  writer: LogFileWriter,
): (request: IncomingMessage, response: ServerResponse, next: () => void) => void {
  return (request, response, next) => {
    const path = (request.url ?? '').split('?')[0] ?? '';
    if (path !== '/api' && !path.startsWith('/api/')) {
      next();
      return;
    }
    const started = performance.now();
    response.once('finish', () => {
      void writer.write(
        'access',
        formatLogLine(
          'ACCESS',
          'HTTP',
          `${request.method ?? '-'} ${path} ${response.statusCode} ${Math.round(performance.now() - started)}ms`,
        ),
      );
    });
    next();
  };
}
