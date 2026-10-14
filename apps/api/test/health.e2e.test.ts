import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { ApiErrorEnvelope } from '@marib-tax/contracts';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('platform health endpoints', () => {
  let app: INestApplication;
  let previousSupabaseUrl: string | undefined;
  let previousServiceRoleKey: string | undefined;
  let previousNodeEnv: string | undefined;

  function getServer(): Parameters<typeof request>[0] {
    return app.getHttpServer() as Parameters<typeof request>[0];
  }

  beforeEach(async () => {
    previousSupabaseUrl = process.env.SUPABASE_URL;
    previousServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    previousNodeEnv = process.env.NODE_ENV;

    // Health tests boot the full AppModule but never call Supabase. Provide
    // explicit non-production placeholders so authentication providers can be
    // constructed without weakening their production fail-closed behavior.
    process.env.NODE_ENV = 'test';
    process.env.SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();

    if (previousSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousSupabaseUrl;

    if (previousServiceRoleKey === undefined)
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceRoleKey;

    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  });

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
