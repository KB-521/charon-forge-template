import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get('check')
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('api/health')
  health(): { status: 'ok'; service: string; environment: string; timestamp: string } {
    return {
      status: 'ok',
      service: '__PROJECT_NAME__-server',
      environment: this.config.get<string>('APP_ENV', 'dev'),
      timestamp: new Date().toISOString(),
    };
  }
}
