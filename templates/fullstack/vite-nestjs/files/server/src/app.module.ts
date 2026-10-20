import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';

import { loadRuntimeConfiguration } from './config/runtime-configuration';
import { HealthModule } from './health/health.module';
import { RuntimeConfigModule } from './runtime-config/runtime-config.module';
import { OssModule } from './oss/oss.module';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [loadRuntimeConfiguration] }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api', '/api/{*path}', '/check', '/runtime-config.js'],
    }),
    HealthModule,
    RuntimeConfigModule,
    OssModule,
    LoggingModule,
  ],
})
export class AppModule {}
