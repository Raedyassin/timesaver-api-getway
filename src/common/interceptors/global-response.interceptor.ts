import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      // data is the value returned by the controller
      map((data) => ({
        status: 'success',
        message: data?.message || null,
        data: data?.data || null,
        meta: data?.meta || null,
      })),
    );
  }
}
