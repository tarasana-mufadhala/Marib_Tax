import {
  Controller,
  Get,
  HttpStatus,
  UnauthorizedException,
  type INestApplication,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { PermissionCode } from '@marib-tax/contracts';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
import {
  AuthenticatedEndpoint,
  RequirePermission,
} from '../src/authz/authorization.decorators.js';
import { ApiExceptionFilter } from '../src/http/api-exception.filter.js';

@Controller('probe')
class ProbeController {
  @Get('me')
  @AuthenticatedEndpoint()
  me() {
    return { ok: true };
  }

  @Get('guarded')
  @RequirePermission('user.manage')
  guarded() {
    return { ok: true };
  }

  @Get('unannotated')
  unannotated() {
    return { ok: true };
  }
}

/**
 * `@AuthenticatedEndpoint` هو المنزلة بين العام والمحروس بصلاحية.
 *
 * وُجد لأن `/admin/me` كان يشترط صلاحية بعينها، فموظف لا يملكها لم يكن
 * يعرف هويته أصلاً ولا تعمل معه اللوحة. هذه الاختبارات تحرس حدوده.
 */
describe('AuthenticatedEndpoint', () => {
  let app: INestApplication;
  let permissions: PermissionCode[] = [];
  let roleActive = true;
  let assignmentActive = true;

  beforeEach(async () => {
    const tokens: AccessTokenVerifier = {
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
          roleActive,
          assignmentActive,
        }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
      providers: [
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
    roleActive = true;
    assignmentActive = true;
  });

  afterEach(async () => app.close());

  const get = (path: string, token?: string) => {
    const req = request(app.getHttpServer()).get(path);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  it('يسمح بجلسة صالحة ولو بلا أي صلاحية', async () => {
    permissions = [];
    await get('/probe/me', 'valid').expect(HttpStatus.OK);
  });

  it('يرفض بلا رمز جلسة — ليس عاماً', async () => {
    permissions = ['user.manage'];
    await get('/probe/me').expect(HttpStatus.UNAUTHORIZED);
  });

  it('يرفض الرمز غير الصالح', async () => {
    permissions = ['user.manage'];
    await get('/probe/me', 'forged').expect(HttpStatus.UNAUTHORIZED);
  });

  it('يرفض من عُطّل دوره أو إسناده', async () => {
    permissions = ['user.manage'];
    roleActive = false;
    await get('/probe/me', 'valid').expect(HttpStatus.FORBIDDEN);
  });

  it('لا يفتح النقاط المحروسة بصلاحية', async () => {
    permissions = ['report.view'];
    await get('/probe/guarded', 'valid').expect(HttpStatus.FORBIDDEN);
    await get('/probe/guarded', 'valid').expect(HttpStatus.FORBIDDEN);
  });

  it('النقطة بلا وسم تبقى مرفوضة — المنع هو الافتراض', async () => {
    permissions = ['user.manage'];
    await get('/probe/unannotated', 'valid').expect(HttpStatus.FORBIDDEN);
  });
});
