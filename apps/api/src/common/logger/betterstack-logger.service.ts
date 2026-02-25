import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface LogtailPayload {
  dt: string;
  level: string;
  message: string;
  context?: string;
  trace?: string;
  [key: string]: unknown;
}

/**
 * NestJS logger that extends ConsoleLogger to also ship logs to Better Stack (Logtail).
 * Falls back to console-only when BETTERSTACK_LOGS_TOKEN is not set.
 */
@Injectable()
export class BetterStackLogger extends ConsoleLogger {
  private readonly token: string | undefined;
  private readonly endpoint: string;
  private buffer: LogtailPayload[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly flushIntervalMs = 2000;
  private readonly maxBufferSize = 50;

  constructor(private configService: ConfigService) {
    super();
    this.token = this.configService.get<string>('BETTERSTACK_LOGS_TOKEN');
    this.endpoint = this.configService.get<string>('BETTERSTACK_LOGS_ENDPOINT')
      || 'https://in.logs.betterstack.com';

    if (this.token) {
      this.flushTimer = setInterval(() => this.flush(), this.flushIntervalMs);
      // Ensure logs are flushed on shutdown
      process.on('beforeExit', () => this.flush());
    }
  }

  log(message: unknown, context?: string) {
    super.log(message, context);
    this.enqueue('info', message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    super.error(message, trace, context);
    this.enqueue('error', message, context, trace);
  }

  warn(message: unknown, context?: string) {
    super.warn(message, context);
    this.enqueue('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    super.debug(message, context);
    this.enqueue('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    super.verbose(message, context);
    this.enqueue('verbose', message, context);
  }

  private enqueue(
    level: string,
    message: unknown,
    context?: string,
    trace?: string,
  ) {
    if (!this.token) return;

    const payload: LogtailPayload = {
      dt: new Date().toISOString(),
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      ...(context && { context }),
      ...(trace && { trace }),
    };

    this.buffer.push(payload);

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  private flush() {
    if (!this.token || this.buffer.length === 0) return;

    const batch = this.buffer.splice(0);

    fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(batch),
    }).catch(() => {
      // Silently drop — don't let logging failures crash the app
    });
  }

  onModuleDestroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}
