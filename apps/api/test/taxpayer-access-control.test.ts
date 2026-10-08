import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { BearerActorContextResolver } from '../src/authn/bearer-actor-context.resolver.js';
import {
  CURRENT_ACTOR,
  type ActorProfileRepository,
} from '../src/authn/authentication.contracts.js';
import { CurrentActorService } from '../src/authn/current-actor.service.js';
import { AuthorizationGuard } from '../src/authz/authorization.guard.js';
import {
  ACTOR_CONTEXT_RESOLVER,
  AUTHORIZATION_AUDIT_HOOK,
  AUTHORIZATION_POLICY_EVALUATOR,
} from '../src/authz/authorization.contracts.js';
import { ApiExceptionFilter } from '../src/http/api-exception.filter.js';
import { TaxpayerController } from '../src/taxpayers/taxpayer.controller.js';
import { TaxpayerService } from '../src/taxpayers/taxpayer.service.js';

const ID = '33333333-3333-3333-3333-333333333333';
const CITIZEN_PERMISSIONS = ['taxpayer.profile.read', 'taxpayer.profile.update'];
const STAFF_PERMISSIONS = ['taxpayer.admin.read', 'taxpayer.admin.status'];

const SERVICE_STUB = {
  listTaxpayers: (): Promise<unknown> => Promise.resolve([]),
  searchTaxpayers: (): Promise<unknown> => Promise.resolve([]),
  findTaxpayer: (): Promise<unknown> => Promise.resolve({ id: ID }),
  getAccountLink: (): Promise<unknown> => Promise.resolve(null),
  createTaxpayer: (): Promise<unknown> => Promise.resolve({ id: ID }),
  linkAccount: (): Promise<unknown> => Promise.resolve({ taxpayerId: ID }),
};

const ROUTES: Array<['get' | 'post', string]> = [
  ['get', '/api/v1/taxpayers'],
  ['get', '/api/v1/taxpayers/search?q=ab'],
  ['get', `/api/v1/taxpayers/${ID}`],
  ['get', `/api/v1/taxpayers/profiles/${ID}/link`],
  ['post', '/api/v1/taxpayers'],
  ['post', '/api/v1/taxpayers/links'],
];

describe('TaxpayerController access control', () => {
  let app: INestApplication;

  async function boot(permissions: string[]): Promise<void> {
    const profiles = {
      findActiveByAuthUserId: (): Promise<unknown> =>
        Promise.resolve({
          actorId: ID,
          permissions,
          roleActive: true,
          assignmentActive: true,
        }),
    } as unknown as ActorProfileRepository;
    const tokens = { verify: (): Promise<{ authUserId: string }> => Promise.resolve({ authUserId: 'u' }) };
    const moduleRef = await Test.createTestingModule({
      controllers: [TaxpayerController],
      providers: [
        { provide: TaxpayerService, useValue: SERVICE_STUB },
        { provide: CURRENT_ACTOR, useClass: CurrentActorService },
        {
          provide: ACTOR_CONTEXT_RESOLVER,
          useValue: new BearerActorContextResolver(tokens, profiles),
        },
        {
          provide: AUTHORIZATION_POLICY_EVALUATOR,
          useValue: { evaluate: (): Promise<{ allowed: boolean }> => Promise.resolve({ allowed: true }) },
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
  }

  const call = (method: 'get' | 'post', url: string): request.Test => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    return request(server)[method](url).set('Authorization', 'Bearer t').send({});
  };

  afterEach(async () => {
    await app.close();
  });

  it.each(ROUTES)('citizen gets 403 on %s %s', async (method, url) => {
    await boot(CITIZEN_PERMISSIONS);
    expect((await call(method, url)).status).toBe(403);
  });

  it.each(ROUTES)('staff is allowed on %s %s', async (method, url) => {
    await boot(STAFF_PERMISSIONS);
    expect((await call(method, url)).status).toBeLessThan(300);
  });
});
