import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

function isEnveloped(body: unknown): boolean {
  return typeof body === 'object' && body !== null && 'data' in body;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next
      .handle()
      .pipe(
        map((body: unknown) => (isEnveloped(body) ? body : { data: body })),
      );
  }
}
