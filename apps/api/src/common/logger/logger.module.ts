import { Global, Module } from '@nestjs/common';
import { BetterStackLogger } from './betterstack-logger.service';

@Global()
@Module({
  providers: [BetterStackLogger],
  exports: [BetterStackLogger],
})
export class LoggerModule {}
