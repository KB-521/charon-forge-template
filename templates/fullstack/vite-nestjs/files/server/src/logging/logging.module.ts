import { Global, Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import { getLogFileWriter, LogFileWriter } from './log-file-writer';

@Injectable()
class FlushLogs implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await getLogFileWriter().flush();
  }
}

@Global()
@Module({
  providers: [{ provide: LogFileWriter, useFactory: getLogFileWriter }, FlushLogs],
  exports: [LogFileWriter],
})
export class LoggingModule {}
