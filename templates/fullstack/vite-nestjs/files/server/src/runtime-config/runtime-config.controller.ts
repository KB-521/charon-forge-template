import { Controller, Get, Header } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class RuntimeConfigController {
  constructor(private readonly config: ConfigService) {}

  @Get('runtime-config.js')
  @Header('Content-Type', 'application/javascript; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  configScript(): string {
    const config = { API_BASE_URL: this.config.get<string>('API_BASE_URL', '/api') };
    const serialized = JSON.stringify(config)
      .replace(/</g, '\\u003c')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
    return `window.RUNTIME_CONFIG = ${serialized};`;
  }
}
