import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

type ValidationErrorResponse = {
  statusCode: number;
  message: string[];
  error: string;
};

@Catch(BadRequestException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const exceptionResponse = exception.getResponse();

    if (this.isValidationErrorResponse(exceptionResponse)) {
      const errors: Record<string, string[]> = {};

      for (const message of exceptionResponse.message) {
        const field = message.split(' ')[0];
        errors[field] ??= [];
        errors[field].push(message);
      }

      response.status(400).json(errors);
      return;
    }

    response.status(400).json(exceptionResponse);
  }

  private isValidationErrorResponse(response: unknown): response is ValidationErrorResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      'message' in response &&
      Array.isArray((response as ValidationErrorResponse).message)
    );
  }
}
