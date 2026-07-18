import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type {
  ActivityAddressChangeRequestResponse,
  ApiErrorEnvelope,
  PermissionCode,
} from '@marib-tax/contracts';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BearerActorContextResolver } from '../src/authn/bearer-actor-context.resolver.js';
import {
  CURRENT_ACTOR,
  type AccessTokenVerifier,
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
import { RequestDraftController } from '../src/requests/request-draft.controller.js';
import { RequestDraftPolicyEvaluator } from '../src/requests/request-draft.policy-evaluator.js';
import {
  REQUEST_DRAFT_REPOSITORY,
  type RequestDraftRepository,
  type StoredRequestDraft,
} from '../src/requests/request-draft.repository.js';
import { RequestDraftService } from '../src/requests/request-draft.service.js';

class MemoryRepository implements RequestDraftRepository {
  values = new Map<string, StoredRequestDraft>();
  create(value: StoredRequestDraft): Promise<void> {
    this.values.set(value.id, structuredClone(value));
    return Promise.resolve();
  }
  findById(id: string): Promise<StoredRequestDraft | null> {
    return Promise.resolve(structuredClone(this.values.get(id) ?? null));
  }
  save(value: StoredRequestDraft): Promise<void> {
    this.values.set(value.id, structuredClone(value));
    return Promise.resolve();
  }
}

describe('isolated authenticated request-draft runtime', () => {
  let app: INestApplication;
  let permissions: PermissionCode[];
  let actorId: string;

  function getServer(): Parameters<typeof request>[0] {
    return app.getHttpServer() as Parameters<typeof request>[0];
  }

  beforeEach(async () => {
    permissions = ['request.draft.create'];
    actorId = 'profile-1';
    const tokens: AccessTokenVerifier = {
      verify: (token) =>
        token === 'valid'
          ? Promise.resolve({ authUserId: 'auth-user' })
          : Promise.reject(new Error('invalid')),
    };
    const profiles: ActorProfileRepository = {
      findActiveByAuthUserId: () =>
        Promise.resolve({
          actorId,
          permissions,
          roleActive: true,
          assignmentActive: true,
        }),
    };
    const actors = new BearerActorContextResolver(tokens, profiles);
    const moduleRef = await Test.createTestingModule({
      controllers: [RequestDraftController],
      providers: [
        RequestDraftService,
        { provide: REQUEST_DRAFT_REPOSITORY, useClass: MemoryRepository },
        { provide: CURRENT_ACTOR, useClass: CurrentActorService },
        { provide: ACTOR_CONTEXT_RESOLVER, useValue: actors },
        {
          provide: AUTHORIZATION_POLICY_EVALUATOR,
          useClass: RequestDraftPolicyEvaluator,
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

  it('creates a draft for a verified actor with exact permission', async () => {
    const response = await request(getServer())
      .post('/api/v1/requests')
      .set('Authorization', 'Bearer valid')
      .send({
        serviceType: 'activity_address_change',
        schemaVersion: '1.0.0',
        targets: [
          {
            activityId: '00000000-0000-4000-8000-000000000001',
            newAddress: { district: 'Marib', street: '40' },
          },
        ],
      })
      .expect(201);
    const body = response.body as ActivityAddressChangeRequestResponse;
    expect(body.status).toBe('draft');
  });

  it('returns safe 401 for missing bearer token', async () => {
    const response = await request(getServer())
      .post('/api/v1/requests')
      .send({})
      .expect(401);
    const body = response.body as ApiErrorEnvelope;
    expect(body.error.traceId).toBeTypeOf('string');
    expect(JSON.stringify(body)).not.toMatch(/token|stack|sql|key|claim/i);
  });

  it('denies a verified actor without the exact permission', async () => {
    permissions = [];
    await request(getServer())
      .post('/api/v1/requests')
      .set('Authorization', 'Bearer valid')
      .send({})
      .expect(403);
  });

  it('denies reading a draft owned by another actor', async () => {
    const created = await createDraft();
    actorId = 'profile-2';
    permissions = ['request.read'];

    await request(getServer())
      .get(`/api/v1/requests/${created.id}`)
      .set('Authorization', 'Bearer valid')
      .expect(403);
  });

  it('denies editing a submitted request through the resource-state policy', async () => {
    const created = await createDraft();
    permissions = ['request.submit'];
    await request(getServer())
      .post(`/api/v1/requests/${created.id}/submit`)
      .set('Authorization', 'Bearer valid')
      .expect(200);

    permissions = ['request.draft.edit'];
    await request(getServer())
      .patch(`/api/v1/requests/${created.id}`)
      .set('Authorization', 'Bearer valid')
      .send({ targets: [] })
      .expect(403);
  });

  async function createDraft(): Promise<ActivityAddressChangeRequestResponse> {
    const response = await request(getServer())
      .post('/api/v1/requests')
      .set('Authorization', 'Bearer valid')
      .send({
        serviceType: 'activity_address_change',
        schemaVersion: '1.0.0',
        targets: [
          {
            activityId: '00000000-0000-4000-8000-000000000001',
            newAddress: { district: 'Marib', street: '40' },
          },
        ],
      })
      .expect(201);
    return response.body as ActivityAddressChangeRequestResponse;
  }
});
