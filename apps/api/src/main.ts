import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { UPLOAD_URL_PREFIX, uploadRoot } from './uploads/local-image-storage';

const STATIC_URL_PREFIX = '/static/';
const STATIC_CACHE_MAX_AGE = '7d';

async function bootstrap() {
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  // Sample product pictures shipped with the code, and photos uploaded by the admin.
  app.useStaticAssets(resolve('public'), {
    prefix: STATIC_URL_PREFIX,
    maxAge: STATIC_CACHE_MAX_AGE,
  });
  app.useStaticAssets(uploadRoot(), {
    prefix: UPLOAD_URL_PREFIX,
    maxAge: STATIC_CACHE_MAX_AGE,
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
