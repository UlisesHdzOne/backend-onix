import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
  metadata?: {
    path: string;
    method: string;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const now = new Date().toISOString();

    return next.handle().pipe(
      map((data) => {
        const baseResponse: Response<T> = {
          success: true,
          data,
          timestamp: now,
        };

        if (process.env.NODE_ENV === 'development') {
          baseResponse.metadata = {
            path: request.url,
            method: request.method,
          };
        }

        return baseResponse;
      }),
    );
  }
}
