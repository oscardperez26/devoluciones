import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Error interno del servidor';

    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
      );
    } else if (status >= 400) {
      this.logger.warn(`[${status}] ${exception instanceof Error ? exception.message : String(exception)}`);
    }

    const error =
      typeof rawResponse === 'string' ? { message: rawResponse } : rawResponse;

    response.status(status).json({
      success: false,
      error,
      meta: { timestamp: new Date().toISOString() },
    });
  }
}
