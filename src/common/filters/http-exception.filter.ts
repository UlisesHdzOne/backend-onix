import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../../core/errors/custom.errors';
import { winstonLogger } from '../../core/logger/winston.config';

// ==================== TIPOS ====================
interface ErrorDetail {
  message: string;
  field?: string;
}

interface ErrorResponseBody {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
    timestamp: string;
    path: string;
    method: string;
    statusCode: number;
  };
}

interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  details?: ErrorDetail[];
}

interface ValidationError {
  property: string;
  constraints?: Record<string, string>;
}

// ==================== FILTER ====================
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logError(exception, request);
    const errorResponse = this.buildErrorResponse(exception, request);

    response.status(errorResponse.error.statusCode).json(errorResponse);
  }

  private logError(exception: unknown, request: Request): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.url,
      ip: request.ip,
      userAgent: request.get('user-agent') ?? undefined,
    };

    if (exception instanceof AppError) {
      winstonLogger.log(exception.isOperational ? 'warn' : 'error', exception.message, {
        ...logEntry,
        error: exception.message,
        stack: exception.stack,
      });
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      winstonLogger.log(status >= 500 ? 'error' : 'warn', 'HttpException', {
        ...logEntry,
        error: exception.message,
        stack: exception.stack,
      });
    } else if (exception instanceof Error) {
      winstonLogger.error('Unexpected Error', {
        ...logEntry,
        error: exception.message,
        stack: exception.stack,
      });
    } else {
      winstonLogger.error('Unknown Error Type', {
        ...logEntry,
        error: String(exception),
      });
    }
  }

  private buildErrorResponse(exception: unknown, request: Request): ErrorResponseBody {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    if (this.isAppError(exception)) {
      return {
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.serializeErrors(),
          timestamp,
          path,
          method,
          statusCode: exception.statusCode,
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message = this.getHttpExceptionMessage(response);
      const details = this.extractHttpExceptionDetails(response);

      return {
        success: false,
        error: {
          code: this.getHttpExceptionCode(status),
          message,
          details,
          timestamp,
          path,
          method,
          statusCode: status,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno del servidor',
        timestamp,
        path,
        method,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    };
  }

  // ==================== HELPER METHODS ====================
  private isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }

  private isHttpExceptionResponse(obj: unknown): obj is HttpExceptionResponse {
    return (
      obj !== null &&
      typeof obj === 'object' &&
      ('message' in obj || 'error' in obj || 'statusCode' in obj)
    );
  }

  private isValidationError(obj: unknown): obj is ValidationError {
    return (
      obj !== null &&
      typeof obj === 'object' &&
      'property' in obj &&
      typeof (obj as Record<string, unknown>).property === 'string'
    );
  }

  private getHttpExceptionMessage(response: string | object): string {
    if (typeof response === 'string') {
      return response;
    }

    if (!this.isHttpExceptionResponse(response)) {
      return 'Error HTTP';
    }

    const { message, error } = response;

    if (typeof message === 'string') {
      return message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (Array.isArray(message) && message.length > 0) {
      return 'Error de validación';
    }

    return 'Error HTTP';
  }

  private extractHttpExceptionDetails(response: string | object): ErrorDetail[] {
    const details: ErrorDetail[] = [];

    if (typeof response === 'string' || !this.isHttpExceptionResponse(response)) {
      return details;
    }

    const responseObj = response;

    if ('details' in responseObj && Array.isArray(responseObj.details)) {
      for (const detail of responseObj.details) {
        if (this.isErrorDetail(detail)) {
          details.push(detail);
        }
      }
      return details;
    }

    if ('message' in responseObj && Array.isArray(responseObj.message)) {
      return this.extractValidationErrors(responseObj.message);
    }

    if ('message' in responseObj && typeof responseObj.message === 'string') {
      details.push({ message: responseObj.message });
    }

    return details;
  }

  private extractValidationErrors(messages: unknown[]): ErrorDetail[] {
    const details: ErrorDetail[] = [];

    for (const error of messages) {
      if (this.isValidationError(error)) {
        const messagesArray = Object.values(error.constraints ?? {});
        details.push({
          field: error.property,
          message: messagesArray.join(', ') || 'Campo inválido',
        });
      }
    }

    return details;
  }

  private isErrorDetail(obj: unknown): obj is ErrorDetail {
    return (
      obj !== null &&
      typeof obj === 'object' &&
      'message' in obj &&
      typeof (obj as Record<string, unknown>).message === 'string'
    );
  }

  private getHttpExceptionCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return codes[status] ?? 'HTTP_ERROR';
  }
}
