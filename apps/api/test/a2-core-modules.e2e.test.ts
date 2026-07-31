import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
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
import { TaxpayerController } from '../src/taxpayers/taxpayer.controller.js';
import { TaxpayerService } from '../src/taxpayers/taxpayer.service.js';
import { TAXPAYER_REPOSITORY } from '../src/taxpayers/taxpayer.repository.js';
import { TaxpayerKyselyRepository } from '../src/taxpayers/taxpayer.kysely-repository.js';
import { ActivitiesBranchesController } from '../src/activities-branches/activities-branches.controller.js';
import { ActivitiesBranchesService } from '../src/activities-branches/activities-branches.service.js';
import { ACTIVITIES_BRANCHES_REPOSITORY } from '../src/activities-branches/activities-branches.repository.js';
import { ActivitiesBranchesKyselyRepository } from '../src/activities-branches/activities-branches.kysely-repository.js';
import { PropertiesController } from '../src/properties/properties.controller.js';
import { PropertiesService } from '../src/properties/properties.service.js';
import { PROPERTIES_REPOSITORY } from '../src/properties/properties.repository.js';
import { PropertiesKyselyRepository } from '../src/properties/properties.kysely-repository.js';
import { LegalEntitiesController } from '../src/legal-entities/legal-entities.controller.js';
import { LegalEntitiesService } from '../src/legal-entities/legal-entities.service.js';
import { LEGAL_ENTITIES_REPOSITORY } from '../src/legal-entities/legal-entities.repository.js';
import { LegalEntitiesKyselyRepository } from '../src/legal-entities/legal-entities.kysely-repository.js';
import { ServicesVersionsController } from '../src/services-versions/services-versions.controller.js';
import { ServicesVersionsService } from '../src/services-versions/services-versions.service.js';
import { SERVICES_VERSIONS_REPOSITORY } from '../src/services-versions/services-versions.repository.js';
import { ServicesVersionsKyselyRepository } from '../src/services-versions/services-versions.kysely-repository.js';
import { DatabaseService } from '../src/database/database.service.js';
import { ConfigService } from '@nestjs/config';

class MockPolicyEvaluator {
  evaluate(): Promise<{ allowed: boolean }> {
    return Promise.resolve({ allowed: true });
  }
}

describe('A2 Core Modules E2E flows (Taxpayers, Activities, Properties, LegalEntities, Services)', () => {
  let app: INestApplication;
  let actorId: string;

  function getServer(): Parameters<typeof request>[0] {
    return app.getHttpServer() as Parameters<typeof request>[0];
  }

  beforeEach(async () => {
    actorId = randomUUID();
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
          permissions: [
            'taxpayer.profile.read',
            'taxpayer.profile.update',
            'request.read',
            'request.review',
          ],
          roleActive: true,
          assignmentActive: true,
        }),
    };
    const actors = new BearerActorContextResolver(tokens, profiles);

    const moduleRef = await Test.createTestingModule({
      controllers: [
        TaxpayerController,
        ActivitiesBranchesController,
        PropertiesController,
        LegalEntitiesController,
        ServicesVersionsController,
      ],
      providers: [
        ConfigService,
        DatabaseService,
        TaxpayerService,
        {
          provide: TAXPAYER_REPOSITORY,
          useClass: TaxpayerKyselyRepository,
        },
        ActivitiesBranchesService,
        {
          provide: ACTIVITIES_BRANCHES_REPOSITORY,
          useClass: ActivitiesBranchesKyselyRepository,
        },
        PropertiesService,
        {
          provide: PROPERTIES_REPOSITORY,
          useClass: PropertiesKyselyRepository,
        },
        LegalEntitiesService,
        {
          provide: LEGAL_ENTITIES_REPOSITORY,
          useClass: LegalEntitiesKyselyRepository,
        },
        ServicesVersionsService,
        {
          provide: SERVICES_VERSIONS_REPOSITORY,
          useClass: ServicesVersionsKyselyRepository,
        },
        { provide: CURRENT_ACTOR, useClass: CurrentActorService },
        { provide: ACTOR_CONTEXT_RESOLVER, useValue: actors },
        {
          provide: AUTHORIZATION_POLICY_EVALUATOR,
          useClass: MockPolicyEvaluator,
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

  afterEach(async () => {
    await app.close();
  });

  it('performs taxpayer creation, search and account linking', async () => {
    // 1. Create taxpayer
    const taxpayerRes = await request(getServer())
      .post('/api/v1/taxpayers')
      .set('Authorization', 'Bearer valid')
      .send({
        displayName: 'مكلف شركة حضرموت التجارية',
        statusCode: 'active',
      });
    expect(taxpayerRes.status).toBe(201);
    const taxpayer = taxpayerRes.body as { id: string; displayName: string };
    expect(taxpayer.displayName).toBe('مكلف شركة حضرموت التجارية');
    expect(taxpayer.id).toBeDefined();

    // 2. Search taxpayer
    const searchRes = await request(getServer())
      .get('/api/v1/taxpayers/search?q=حضرموت')
      .set('Authorization', 'Bearer valid');
    expect(searchRes.status).toBe(200);
    const searchBody = searchRes.body as Array<{ id: string }>;
    expect(searchBody.length).toBeGreaterThan(0);
    expect(searchBody[0]?.id).toBe(taxpayer.id);

    // 3. Link profile
    const linkRes = await request(getServer())
      .post('/api/v1/taxpayers/links')
      .set('Authorization', 'Bearer valid')
      .send({
        userProfileId: actorId,
        taxpayerId: taxpayer.id,
        relationshipType: 'owner',
      });
    expect(linkRes.status).toBe(201);
    const linkBody = linkRes.body as { taxpayerId: string };
    expect(linkBody.taxpayerId).toBe(taxpayer.id);
  });

  it('performs activities and branches creation', async () => {
    // Register activity
    const actRes = await request(getServer())
      .post('/api/v1/activities')
      .set('Authorization', 'Bearer valid')
      .send({
        taxpayerId: randomUUID(),
        name: 'مطعم وادي سبأ مأرب',
        statusCode: 'active',
      });
    expect(actRes.status).toBe(201);
    const activity = actRes.body as { id: string };

    // Register branch
    const brnRes = await request(getServer())
      .post('/api/v1/activities/branches')
      .set('Authorization', 'Bearer valid')
      .send({
        commercialActivityId: activity.id,
        name: 'فرع الروضة',
        statusCode: 'active',
      });
    expect(brnRes.status).toBe(201);
  });

  it('performs property and units creation', async () => {
    // Register property
    const propRes = await request(getServer())
      .post('/api/v1/properties')
      .set('Authorization', 'Bearer valid')
      .send({
        statusCode: 'active',
        description: 'عمارة مأرب التجارية',
      });
    expect(propRes.status).toBe(201);
    const property = propRes.body as { id: string };

    // Register unit
    const unitRes = await request(getServer())
      .post('/api/v1/properties/units')
      .set('Authorization', 'Bearer valid')
      .send({
        propertyId: property.id,
        unitLabel: 'مكتب رقم 50',
        statusCode: 'available',
      });
    expect(unitRes.status).toBe(201);
  });

  it('performs legal entities and tax number registration', async () => {
    // Create legal entity
    const entRes = await request(getServer())
      .post('/api/v1/legal-entities')
      .set('Authorization', 'Bearer valid')
      .send({
        legalName: 'مؤسسة حضرموت للتجارة العامة',
        classificationCode: 'corporate',
      });
    expect(entRes.status).toBe(201);
    const entity = entRes.body as { id: string };

    // Issue tax number
    const taxRes = await request(getServer())
      .post('/api/v1/legal-entities/tax-numbers')
      .set('Authorization', 'Bearer valid')
      .send({
        legalEntityId: entity.id,
        taxNumberValue: 'TN-99887766',
      });
    expect(taxRes.status).toBe(201);
  });

  it('performs services versions registration', async () => {
    // Register service
    const serviceRes = await request(getServer())
      .post('/api/v1/services')
      .set('Authorization', 'Bearer valid')
      .send({
        code: 'SRV_ADDRESS_CHANGE',
        name: 'طلب تغيير عنوان نشاط تجاري',
        versionLabel: 'v1.0.0',
      });
    expect(serviceRes.status).toBe(201);
  });
});
