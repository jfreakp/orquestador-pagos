import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const SENSITIVE_FIELDS = new Set([
  'credentials',
  'secret',
  'data',
  'accessToken',
  'publicKey',
  'privateKey',
  'merchantHash',
]);

const REDACTED = '[REDACTED]';

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SENSITIVE_FIELDS.has(key) ? REDACTED : redact(val),
      ]),
    );
  }
  return value;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl, body } = request;
    const startedAt = Date.now();

    this.logger.log(
      `--> ${method} ${originalUrl} ${JSON.stringify(redact(body))}`,
    );

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        const elapsedMs = Date.now() - startedAt;
        this.logger.log(
          `<-- ${method} ${originalUrl} ${response.statusCode} ${elapsedMs}ms`,
        );
      }),
    );
  }
}
