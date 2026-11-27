import { INestApplication } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ResponseInterceptor } from './common/response.interceptor';

export const API_PREFIX = 'api/v1';

// Expo's web preview runs on a different origin. Native apps don't use CORS.
const DEV_WEB_ORIGINS = ['http://localhost:8081'];

export function configureApp(app: INestApplication): void {
  if (process.env.NODE_ENV !== 'production') {
    app.enableCors({ origin: DEV_WEB_ORIGINS });
  }
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
}
