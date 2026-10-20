import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OSS_CLIENT, OSS_CONFIG } from './oss.constants';
import { createLazyOssClient } from './oss-client';
import { loadOssConfig, type OssYamlConfig } from './oss.config';
import { OssService } from './oss.service';

@Global()
@Module({
  providers: [
    { provide: OSS_CONFIG, inject: [ConfigService], useFactory: loadOssConfig },
    {
      provide: OSS_CLIENT,
      inject: [OSS_CONFIG],
      useFactory: (config: OssYamlConfig) => createLazyOssClient(config),
    },
    OssService,
  ],
  exports: [OSS_CLIENT, OSS_CONFIG, OssService],
})
export class OssModule {}
