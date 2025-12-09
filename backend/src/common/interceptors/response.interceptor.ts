import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  path: string;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();

    return next.handle().pipe(
      map((data: any) => {
       
        const hasCustomMessage =
          data &&
          typeof data === 'object' &&
          'message' in data &&
          'data' in data;

        if (hasCustomMessage) {
          return {
            success: true,
            message: data.message,
            data: data.data,
            path: (request as any).url,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          message: null,
          data,
          path: (request as any).url,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
