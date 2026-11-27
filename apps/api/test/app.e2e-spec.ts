import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/configure-app';
import { PrismaService } from './../src/prisma/prisma.service';

describe('API foundation (e2e)', () => {
  let app: INestApplication<App>;
  const queryRaw = jest.fn();

  beforeEach(async () => {
    queryRaw.mockReset();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: queryRaw })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('wraps successful responses in data', () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({ data: { status: 'ok' } });
  });

  it('reports database failure in the error shape', () => {
    queryRaw.mockRejectedValue(new Error('connection refused'));
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(503)
      .expect({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Database unavailable',
        },
      });
  });

  it('returns unknown routes in the error shape', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/missing')
      .expect(404);
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: expect.any(String) as string },
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
