import { UnauthorizedException, type INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { PermissionCode } from '@marib-tax/contracts';
import request from 'supertest';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { BearerActorContextResolver } from '../src/authn/bearer-actor-context.resolver.js';
import type {
  AccessTokenVerifier,
  ActorProfileRepository,
} from '../src/authn/authentication.contracts.js';
import { AuthorizationGuard } from '../src/authz/authorization.guard.js';
import {
  ACTOR_CONTEXT_RESOLVER,
  AUTHORIZATION_AUDIT_HOOK,
  AUTHORIZATION_POLICY_EVALUATOR,
} from '../src/authz/authorization.contracts.js';
import { ApiExceptionFilter } from '../src/http/api-exception.filter.js';
import { ReportsController } from '../src/admin/reports.controller.js';
import { DatabaseService } from '../src/database/database.service.js';

/**
 * التقارير الرقابية تكشف بيانات حساسة، فحمايتها على الخادم لا في الواجهة.
 * تغطي: بلا رمز، برمز غير صالح، بصلاحية عرض فقط، وبصلاحية التدقيق الحساس.
 */
describe('ReportsController authorization', () => {
  let app: INestApplication;
  let permissions: PermissionCode[] = [];

  beforeEach(async () => {
    const tokens: AccessTokenVerifier = {
      // يطابق عقد HybridAccessTokenVerifier: الرمز غير الصالح يرمي UnauthorizedException.
      verify: (token) =>
        token === 'valid'
          ? Promise.resolve({ authUserId: 'auth-user' })
          : Promise.reject(new UnauthorizedException()),
    };
    const profiles: ActorProfileRepository = {
      findActiveByAuthUserId: () =>
        Promise.resolve({
          actorId: 'profile-1',
          permissions,
          roleActive: true,
          assignmentActive: true,
        }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        // قاعدة غير مهيأة: التقارير تعيد available:false، والمهم هنا هو بوابة التفويض.
        { provide: DatabaseService, useValue: { isInitialized: false } },
        {
          provide: ACTOR_CONTEXT_RESOLVER,
          useValue: new BearerActorContextResolver(tokens, profiles),
        },
        {
          provide: AUTHORIZATION_POLICY_EVALUATOR,
          useValue: { evaluate: () => Promise.resolve(true) },
        },
        {
          provide: AUTHORIZATION_AUDIT_HOOK,
          useValue: { recordDenied: (): Promise<void> => Promise.resolve() },
        },
        { provide: APP_GUARD, useClass: AuthorizationGuard },
        { provide: APP_FILTER, useClass: ApiExceptionFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => app.close());

  const get = (path: string, token?: string) => {
    const req = request(app.getHttpServer()).get(path);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  it('rejects an unauthenticated request', async () => {
    permissions = ['report.view'];
    await get('/api/v1/reports/rep-01').expect(401);
    await get('/api/v1/reports/rep-27').expect(401);
  });

  it('rejects an invalid bearer token', async () => {
    permissions = ['report.view'];
    await get('/api/v1/reports/rep-01', 'forged').expect(401);
  });

  it('rejects an actor without report.view', async () => {
    permissions = ['request.read'];
    await get('/api/v1/reports/rep-01', 'valid').expect(403);
  });

  it('allows ordinary reports with report.view alone', async () => {
    permissions = ['report.view'];
    await get('/api/v1/reports/rep-01', 'valid').expect(200);
    await get('/api/v1/reports/executive-summary', 'valid').expect(200);
  });

  it('denies the audit and security reports without audit.sensitive.view', async () => {
    permissions = ['report.view'];
    for (const id of ['rep-25', 'rep-26', 'rep-27']) {
      await get(`/api/v1/reports/${id}`, 'valid').expect(403);
    }
  });

  it('allows the audit and security reports with audit.sensitive.view', async () => {
    permissions = ['report.view', 'audit.sensitive.view'];
    for (const id of ['rep-25', 'rep-26', 'rep-27']) {
      await get(`/api/v1/reports/${id}`, 'valid').expect(200);
    }
  });
});
