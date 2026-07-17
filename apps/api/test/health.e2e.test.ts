import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { ApiErrorEnvelope } from '@marib-tax/contracts';
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
    const response = await request(getServer())
      .post('/api/v1/requests/00000000-0000-4000-8000-000000000000/action')
      .set('x-request-id', 'contract-negative-test')
      .expect(404);

    expect(response.body).toEqual({
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'The requested resource was not found.',
        traceId: 'contract-negative-test',
      },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/stack|sql|secret/i);
  });

  it('rejects unsafe correlation identifiers without reflecting them', async () => {
    const response = await request(getServer())
      .get('/missing')
      .set('x-request-id', '<script>unsafe</script>')
      .expect(404);
    const body = response.body as ApiErrorEnvelope;

    expect(body.error.traceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.error.traceId).not.toContain('unsafe');
  });
});
