import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

interface ErrorResponse {
  error: string;
  message: string;
  details?: { field: string; issue: string }[];
  timestamp: string;
  path: string;
  requestId: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId =
      (request.headers['x-request-id'] as string) || randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorResponse = {
      error: 'INTERNAL_ERROR',
      message: 'Ocorreu um erro inesperado.',
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      const code = this.statusToCode(status);

      if (typeof resp === 'string') {
        body = { ...body, error: code, message: resp };
      } else if (typeof resp === 'object' && resp !== null) {
        const r = resp as { message?: string | string[] };
        const msgs = Array.isArray(r.message) ? r.message : [r.message ?? ''];
        body = {
          ...body,
          error: code,
          message: msgs.length > 1 ? 'Falha na validação' : msgs[0],
          ...(msgs.length > 1 && {
            details: msgs.map((m) => ({ field: 'unknown', issue: m })),
          }),
        };
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json(body);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
    };
    return map[status] || 'UNKNOWN_ERROR';
  }
}
