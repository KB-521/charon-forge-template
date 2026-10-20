import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { getLogFileWriter } from './logging/log-file-writer';
import { FileLogger } from './logging/file-logger.service';
import { createAccessLogMiddleware } from './logging/access-log';
import { logText } from './logging/redact';

async function bootstrap(): Promise<void> {
  const writer = getLogFileWriter();
  const app = await NestFactory.create(AppModule, { logger: new FileLogger(writer) });
  app.use(createAccessLogMiddleware(writer));
  process.once('beforeExit', () => {
    void writer.flush();
  });
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  const config = app.get(ConfigService);
  const corsOrigins = config
    .get<string>('CORS_ORIGIN', '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (corsOrigins.length) app.enableCors({ origin: corsOrigins });
  app.enableShutdownHooks();

  const port = Number(config.get<string>('PORT', '7001'));
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be between 1 and 65535');
  await app.listen(port, '0.0.0.0');
}

void bootstrap().catch((error: unknown) => {
  console.error(logText(error));
  process.exitCode = 1;
});
