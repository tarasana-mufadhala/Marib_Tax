import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('platform health endpoints', () => {
  let app: INestApplication;

  function getServer(): Parameters<typeof request>[0] {
    return app.getHttpServer() as Parameters<typeof request>[0];
  }

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => app.close());

  it('returns only non-sensitive liveness metadata', async () => {
    const response = await request(getServer()).get('/health').expect(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'marib-tax-api',
      version: 'v1',
    });
    expect(JSON.stringify(response.body)).not.toContain('secret');
  });

  it('returns only non-sensitive readiness metadata', async () => {
    const response = await request(getServer()).get('/ready').expect(200);
    expect(response.body).toEqual({
      status: 'ready',
      service: 'marib-tax-api',
      version: 'v1',
    });
  });

  it('does not expose a generic lifecycle action endpoint', async () => {
    await request(getServer())
      .post('/api/v1/requests/00000000-0000-4000-8000-000000000000/action')
      .expect(404);
  });
});
