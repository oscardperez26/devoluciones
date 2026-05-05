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

    const isProduction = process.env['NODE_ENV'] === 'production';

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
      this.logger.warn(
        `[${status}] ${exception instanceof Error ? exception.message : String(exception)}`,
      );
    }

    // En producción, los errores 5xx no exponen detalles internos al cliente
    const safeResponse =
      status >= 500 && isProduction
        ? 'Error interno del servidor'
        : rawResponse;

    const error =
      typeof safeResponse === 'string'
        ? { message: safeResponse }
        : safeResponse;

    response.status(status).json({
      success: false,
      error,
      meta: { timestamp: new Date().toISOString() },
    });
  }
}
