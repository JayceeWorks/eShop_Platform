import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

const INTERNAL_ERROR_MESSAGE = 'Something went wrong';

type ErrorBody = { message?: string | string[]; code?: string };

function messageFrom(body: string | ErrorBody, fallback: string): string {
  if (typeof body === 'string') return body;
  if (Array.isArray(body.message)) return body.message.join(', ');
  return body.message ?? fallback;
}

/** Throw `new SomeHttpException(appError('CODE', 'message'))` to send a specific error code. */
export function appError(code: string, message: string): ErrorBody {
  return { code, message };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as string | ErrorBody;
      const code = typeof body === 'object' ? body.code : undefined;
      response.status(status).json({
        error: {
          code: code ?? HttpStatus[status] ?? 'ERROR',
          message: messageFrom(body, exception.message),
        },
      });
      return;
    }

    this.logger.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR],
        message: INTERNAL_ERROR_MESSAGE,
      },
    });
  }
}
