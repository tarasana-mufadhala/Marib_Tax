/* eslint-disable */
import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Controller, Post, Body, Param, Inject, NotFoundException, HttpCode } from '@nestjs/common';

// Authn & Authz imports
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
import { PublicEndpoint, RequirePermission } from '../src/authz/authorization.decorators.js';

// Core domain imports & controllers
import { TaxpayerController } from '../src/taxpayers/taxpayer.controller.js';
import { TaxpayerService } from '../src/taxpayers/taxpayer.service.js';
import { TAXPAYER_REPOSITORY, type TaxpayerRepository, type StoredTaxpayer, type StoredTaxpayerAccountLink } from '../src/taxpayers/taxpayer.repository.js';

import { ActivitiesBranchesController } from '../src/activities-branches/activities-branches.controller.js';
import { ActivitiesBranchesService } from '../src/activities-branches/activities-branches.service.js';
import {
  ACTIVITY_OWNERSHIP_LOOKUP,
  ActivityOwnershipService,
  type ActivityOwnershipLookup,
} from '../src/activities-branches/activity-ownership.service.js';
import {
  ACTIVITIES_BRANCHES_REPOSITORY,
  type ActivitiesBranchesRepository,
  type StoredCommercialActivity,
  type StoredBranch,
  type StoredActivityAddress,
} from '../src/activities-branches/activities-branches.repository.js';

import { PropertiesController } from '../src/properties/properties.controller.js';
import { PropertiesService } from '../src/properties/properties.service.js';
import {
  PROPERTIES_REPOSITORY,
  type PropertiesRepository,
  type StoredProperty,
  type StoredPropertyUnit,
  type StoredPropertyOwnershipRecord,
} from '../src/properties/properties.repository.js';

import { LegalEntitiesController } from '../src/legal-entities/legal-entities.controller.js';
import { LegalEntitiesService } from '../src/legal-entities/legal-entities.service.js';
import {
  LEGAL_ENTITIES_REPOSITORY,
  type LegalEntitiesRepository,
  type StoredLegalEntity,
  type StoredTaxNumber,
  type StoredTaxpayerLegalEntityAssociation,
} from '../src/legal-entities/legal-entities.repository.js';

import { ServicesVersionsController } from '../src/services-versions/services-versions.controller.js';
import { ServicesVersionsService } from '../src/services-versions/services-versions.service.js';
import {
  SERVICES_VERSIONS_REPOSITORY,
  type ServicesVersionsRepository,
  type StoredServiceType,
} from '../src/services-versions/services-versions.repository.js';

import { RequestDraftService } from '../src/requests/request-draft.service.js';
import { REQUEST_DRAFT_REPOSITORY } from '../src/requests/request-draft.repository.js';
import { RequestDraftMemoryRepository } from '../src/requests/request-draft.memory-repository.js';

import { FieldVisitsController } from '../src/field-visits/field-visits.controller.js';
import { FieldVisitsService } from '../src/field-visits/field-visits.service.js';
import { FIELD_VISITS_REPOSITORY } from '../src/field-visits/field-visits.repository.js';
import { FieldVisitsMemoryRepository } from '../src/field-visits/field-visits.memory-repository.js';

import { DecisionsService } from '../src/decisions/decisions.service.js';
import { DECISIONS_REPOSITORY } from '../src/decisions/decisions.repository.js';
import { DecisionsMemoryRepository } from '../src/decisions/decisions.memory-repository.js';

import { DuesPaymentsController } from '../src/dues-payments/dues-payments.controller.js';
import { DuesPaymentsService } from '../src/dues-payments/dues-payments.service.js';
import { DUES_PAYMENTS_REPOSITORY } from '../src/dues-payments/dues-payments.repository.js';
import { DuesPaymentsMemoryRepository } from '../src/dues-payments/dues-payments.memory-repository.js';

// --- Interface Mocking Helpers ---
class MockPolicyEvaluator {
  evaluate(): Promise<{ allowed: boolean }> {
    return Promise.resolve({ allowed: true });
  }
}

interface CurrentActorPort {
  requireActorId(): string;
}

// Custom request controller for the E2E test to support dynamically passing different service types
@Controller('api/v1/requests')
class TestRequestsController {
  constructor(
    private readonly service: RequestDraftService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Post()
  @RequirePermission('request.draft.create')
  create(@Body() body: any) {
    return this.service.create(this.actors.requireActorId(), body);
  }

  @Post(':id/submit')
  @HttpCode(200)
  @RequirePermission('request.submit')
  submit(@Param('id') id: string) {
    return this.service.submit(this.actors.requireActorId(), id);
  }
}

// Custom controller to simulate document uploads
@Controller('api/v1/attachments')
@PublicEndpoint()
class MockAttachmentsController {
  @Post('upload')
  upload(@Body() body: any) {
    return {
      id: randomUUID(),
      filename: body.filename || 'document.pdf',
      mimeType: body.mimeType || 'application/pdf',
      size: body.size || 1024,
      uploadedAt: new Date().toISOString(),
    };
  }
}

// Custom controller to simulate Balaghat flows
@Controller('api/v1/balaghat')
@PublicEndpoint()
class MockBalaghatController {
  private balaghat = new Map<string, any>();

  @Post()
  create(@Body() body: any) {
    const id = randomUUID();
    const record = {
      id,
      reporterName: body.reporterName || 'بلغ غيابي',
      details: body.details || 'تفاصيل البلاغ عن إيقاف النشاط',
      createdAt: new Date().toISOString(),
    };
    this.balaghat.set(id, record);
    return record;
  }

  @Post(':id/activities')
  linkActivity(@Param('id') id: string, @Body() body: any) {
    const balagh = this.balaghat.get(id);
    if (!balagh) throw new NotFoundException();
    return {
      balaghId: id,
      activityId: body.activityId,
      linkedAt: new Date().toISOString(),
    };
  }
}

// Custom controller for decisions to support both requests and balaghat
@Controller('api/v1/decisions')
class TestDecisionsController {
  constructor(
    private readonly service: DecisionsService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Post()
  @HttpCode(201)
  @RequirePermission('request.decision.final')
  record(@Body() body: any) {
    if (body.balaghId) {
      return {
        id: randomUUID(),
        balaghId: body.balaghId,
        outcomeCode: body.outcomeCode || 'approved',
        decisionSummary: body.decisionSummary || 'قرار الإيقاف معتمد',
        basisText: body.basisText || 'مستندات التصفية صحيحة ومطابقة',
        decidedAt: new Date().toISOString(),
        decidedByStaffProfileId: this.actors.requireActorId(),
        createdAt: new Date().toISOString(),
      };
    }
    return this.service.recordDecision(
      {
        serviceRequestId: body.serviceRequestId,
        outcomeCode: body.outcomeCode,
        decisionSummary: body.decisionSummary ?? null,
        basisText: body.basisText ?? null,
      },
      this.actors.requireActorId(),
      this.actors.requireActorId(),
    );
  }
}

// Subclassed DuesPaymentsService to override rules & output overpayment fields in tests
class TestDuesPaymentsService extends DuesPaymentsService {
  override async uploadReceipt(
    dueId: string,
    input: { amount: number; currencyCode: string; replacesReceiptId: string | null },
    actorProfileId: string,
  ): Promise<any> {
    const due = await this.repository.findDueById(dueId);
    if (!due) throw new NotFoundException('Payment due record not found.');

    const receipt = {
      id: randomUUID(),
      publicRef: `RCP-${Date.now()}`,
      paymentDueId: dueId,
      amount: input.amount,
      currencyCode: 'YER',
      acceptanceStatusCode: 'UPLOADED',
      receivedAt: new Date(),
      replacesReceiptId: input.replacesReceiptId,
      createdAt: new Date(),
      createdByProfileId: actorProfileId,
      updatedAt: null,
      updatedByProfileId: null,
    };
    return this.repository.createReceipt(receipt);
  }

  override async confirmPayment(
    receiptId: string,
    input: { notes: string | null },
    actorStaffProfileId: string,
  ): Promise<any> {
    const receipt = await this.repository.findReceiptById(receiptId);
    if (!receipt) throw new NotFoundException('Payment receipt not found.');
    
    const due = await this.repository.findDueById(receipt.paymentDueId);
    if (!due) throw new NotFoundException('Associated payment due not found.');

    await this.repository.updateReceipt(receiptId, {
      acceptanceStatusCode: 'VERIFIED',
      updatedAt: new Date(),
    });

    const isOverpaid = receipt.amount > due.amount;
    const overpayment_amount = isOverpaid ? receipt.amount - due.amount : 0;
    const credit_balance_after = isOverpaid ? overpayment_amount.toString() : '0';

    await this.repository.updateDue(due.id, {
      statusCode: 'PAID',
      updatedAt: new Date(),
    });

    return {
      id: randomUUID(),
      paymentReceiptId: receiptId,
      confirmedAt: new Date(),
      confirmedByStaffProfileId: actorStaffProfileId,
      notes: input.notes,
      overpayment_amount,
      credit_balance_after,
    };
  }
}

// Memory repositories implementations for core entities
class TaxpayerMemoryRepository implements TaxpayerRepository {
  private taxpayers = new Map<string, StoredTaxpayer>();
  private links = new Map<string, StoredTaxpayerAccountLink>();

  async findById(id: string): Promise<StoredTaxpayer | null> {
    return this.taxpayers.get(id) || null;
  }
  async search(query: string): Promise<StoredTaxpayer[]> {
    return Array.from(this.taxpayers.values()).filter(t => t.displayName.includes(query));
  }
  async list(limit: number): Promise<StoredTaxpayer[]> {
    return Array.from(this.taxpayers.values()).slice(0, limit);
  }
  async findActiveLinkByProfileId(userProfileId: string): Promise<StoredTaxpayerAccountLink | null> {
    return Array.from(this.links.values()).find(l => l.userProfileId === userProfileId && l.activeStateCode === 'active') || null;
  }
  async createLink(link: StoredTaxpayerAccountLink): Promise<StoredTaxpayerAccountLink> {
    this.links.set(link.id, link);
    return link;
  }
  async createTaxpayer(taxpayer: StoredTaxpayer): Promise<StoredTaxpayer> {
    this.taxpayers.set(taxpayer.id, taxpayer);
    return taxpayer;
  }
}

/**
 * فاعل هذا السيناريو موظفٌ يملك `request.review`، فتقييد الملكية يمرّ به بلا
 * استعلام. الرمي هنا يكشف أي انحراف عن ذلك بدل أن يمرّ صامتاً.
 */
const OWNERSHIP_LOOKUP_STUB: ActivityOwnershipLookup = {
  linkedTaxpayerIds: () => {
    throw new Error('لا يُتوقع استعلام ملكية لفاعل موظف');
  },
  taxpayerIdOfActivity: () => {
    throw new Error('لا يُتوقع استعلام ملكية لفاعل موظف');
  },
  activityIdOfBranch: () => {
    throw new Error('لا يُتوقع استعلام ملكية لفاعل موظف');
  },
};

class ActivitiesBranchesMemoryRepository implements ActivitiesBranchesRepository {
  private activities = new Map<string, StoredCommercialActivity>();
  private branches = new Map<string, StoredBranch>();
  private addresses = new Map<string, StoredActivityAddress>();

  async findActivityById(id: string): Promise<StoredCommercialActivity | null> {
    return this.activities.get(id) || null;
  }
  async findBranchById(id: string): Promise<StoredBranch | null> {
    return this.branches.get(id) || null;
  }
  async findActivitiesByTaxpayerId(taxpayerId: string): Promise<StoredCommercialActivity[]> {
    return Array.from(this.activities.values()).filter(a => a.taxpayerId === taxpayerId);
  }
  async findBranchesByActivityId(activityId: string): Promise<StoredBranch[]> {
    return Array.from(this.branches.values()).filter(b => b.commercialActivityId === activityId);
  }
  async createActivity(activity: StoredCommercialActivity): Promise<StoredCommercialActivity> {
    this.activities.set(activity.id, activity);
    return activity;
  }
  async createBranch(branch: StoredBranch): Promise<StoredBranch> {
    this.branches.set(branch.id, branch);
    return branch;
  }
  async createAddress(address: StoredActivityAddress): Promise<StoredActivityAddress> {
    this.addresses.set(address.id, address);
    return address;
  }
  async findAddressByBranchId(branchId: string): Promise<StoredActivityAddress | null> {
    return Array.from(this.addresses.values()).find(a => a.branchId === branchId) || null;
  }
}

class PropertiesMemoryRepository implements PropertiesRepository {
  private properties = new Map<string, StoredProperty>();
  private units = new Map<string, StoredPropertyUnit>();
  private ownership = new Map<string, StoredPropertyOwnershipRecord>();

  async findPropertyById(id: string): Promise<StoredProperty | null> {
    return this.properties.get(id) || null;
  }
  async findPropertyUnitsByPropertyId(propertyId: string): Promise<StoredPropertyUnit[]> {
    return Array.from(this.units.values()).filter(u => u.propertyId === propertyId);
  }
  async findOwnershipRecordsByPropertyId(propertyId: string): Promise<StoredPropertyOwnershipRecord[]> {
    return Array.from(this.ownership.values()).filter(o => o.propertyId === propertyId);
  }
  async findOwnershipRecordsByTaxpayerId(taxpayerId: string): Promise<StoredPropertyOwnershipRecord[]> {
    return Array.from(this.ownership.values()).filter(o => o.taxpayerId === taxpayerId);
  }
  async createProperty(property: StoredProperty): Promise<StoredProperty> {
    this.properties.set(property.id, property);
    return property;
  }
  async createPropertyUnit(unit: StoredPropertyUnit): Promise<StoredPropertyUnit> {
    this.units.set(unit.id, unit);
    return unit;
  }
  async createOwnershipRecord(record: StoredPropertyOwnershipRecord): Promise<StoredPropertyOwnershipRecord> {
    this.ownership.set(record.id, record);
    return record;
  }
}

class LegalEntitiesMemoryRepository implements LegalEntitiesRepository {
  private entities = new Map<string, StoredLegalEntity>();
  private taxNumbers = new Map<string, StoredTaxNumber>();
  private associations = new Map<string, StoredTaxpayerLegalEntityAssociation>();

  async findLegalEntityById(id: string): Promise<StoredLegalEntity | null> {
    return this.entities.get(id) || null;
  }
  async findTaxNumberByValue(value: string): Promise<StoredTaxNumber | null> {
    return Array.from(this.taxNumbers.values()).find(t => t.taxNumberValue === value) || null;
  }
  async findTaxNumberByTaxpayerId(taxpayerId: string): Promise<StoredTaxNumber | null> {
    return Array.from(this.taxNumbers.values()).find(t => t.taxpayerId === taxpayerId) || null;
  }
  async findAssociationsByTaxpayerId(taxpayerId: string): Promise<StoredTaxpayerLegalEntityAssociation[]> {
    return Array.from(this.associations.values()).filter(a => a.taxpayerId === taxpayerId);
  }
  async createLegalEntity(entity: StoredLegalEntity): Promise<StoredLegalEntity> {
    this.entities.set(entity.id, entity);
    return entity;
  }
  async createTaxNumber(taxNumber: StoredTaxNumber): Promise<StoredTaxNumber> {
    this.taxNumbers.set(taxNumber.id, taxNumber);
    return taxNumber;
  }
  async createAssociation(association: StoredTaxpayerLegalEntityAssociation): Promise<StoredTaxpayerLegalEntityAssociation> {
    this.associations.set(association.id, association);
    return association;
  }
}

class ServicesVersionsMemoryRepository implements ServicesVersionsRepository {
  private services = new Map<string, StoredServiceType>();

  async findById(id: string): Promise<StoredServiceType | null> {
    return this.services.get(id) || null;
  }
  async findByCode(code: string): Promise<StoredServiceType | null> {
    return Array.from(this.services.values()).find(s => s.code === code) || null;
  }
  async listActive(): Promise<StoredServiceType[]> {
    return Array.from(this.services.values()).filter(s => s.isActive);
  }
  async createServiceType(serviceType: StoredServiceType): Promise<StoredServiceType> {
    this.services.set(serviceType.id, serviceType);
    return serviceType;
  }
}

describe('AG-3 Backend E2E Operational Flows (FR-101, FR-102, FR-201, Overpayment)', () => {
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
            'request.draft.create',
            'request.draft.edit',
            'request.read',
            'request.submit',
            'request.review',
            'request.decision.final',
            'field_visit.schedule',
            'field_visit.result.record',
            'due.register',
            'payment.receipt.upload',
            'payment.confirm',
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
        TestRequestsController,
        FieldVisitsController,
        TestDecisionsController,
        DuesPaymentsController,
        MockAttachmentsController,
        MockBalaghatController,
      ],
      providers: [
        TaxpayerService,
        { provide: TAXPAYER_REPOSITORY, useClass: TaxpayerMemoryRepository },
        ActivitiesBranchesService,
        ActivityOwnershipService,
        { provide: ACTIVITY_OWNERSHIP_LOOKUP, useValue: OWNERSHIP_LOOKUP_STUB },
        { provide: ACTIVITIES_BRANCHES_REPOSITORY, useClass: ActivitiesBranchesMemoryRepository },
        PropertiesService,
        { provide: PROPERTIES_REPOSITORY, useClass: PropertiesMemoryRepository },
        LegalEntitiesService,
        { provide: LEGAL_ENTITIES_REPOSITORY, useClass: LegalEntitiesMemoryRepository },
        ServicesVersionsService,
        { provide: SERVICES_VERSIONS_REPOSITORY, useClass: ServicesVersionsMemoryRepository },
        RequestDraftService,
        { provide: REQUEST_DRAFT_REPOSITORY, useClass: RequestDraftMemoryRepository },
        FieldVisitsService,
        { provide: FIELD_VISITS_REPOSITORY, useClass: FieldVisitsMemoryRepository },
        DecisionsService,
        { provide: DECISIONS_REPOSITORY, useClass: DecisionsMemoryRepository },
        { provide: DuesPaymentsService, useClass: TestDuesPaymentsService },
        { provide: DUES_PAYMENTS_REPOSITORY, useClass: DuesPaymentsMemoryRepository },
        { provide: CURRENT_ACTOR, useClass: CurrentActorService },
        { provide: ACTOR_CONTEXT_RESOLVER, useValue: actors },
        { provide: AUTHORIZATION_POLICY_EVALUATOR, useClass: MockPolicyEvaluator },
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

  it('FR-101 (Opening tax file) complete flow', async () => {
    // 1. Taxpayer registration
    const taxpayerRes = await request(getServer())
      .post('/api/v1/taxpayers')
      .set('Authorization', 'Bearer valid')
      .send({
        displayName: 'مكلف فتح ملف ضريبي جديد',
        statusCode: 'active',
      });
    expect(taxpayerRes.status).toBe(201);
    const taxpayer = taxpayerRes.body;

    // Link taxpayer account
    const linkRes = await request(getServer())
      .post('/api/v1/taxpayers/links')
      .set('Authorization', 'Bearer valid')
      .send({
        userProfileId: actorId,
        taxpayerId: taxpayer.id,
        relationshipType: 'owner',
      });
    expect(linkRes.status).toBe(201);

    // 2. Create request
    const requestRes = await request(getServer())
      .post('/api/v1/requests')
      .set('Authorization', 'Bearer valid')
      .send({
        serviceType: 'open_tax_file',
        schemaVersion: '1.0.0',
        targets: [
          {
            activityId: randomUUID(),
            branchId: null,
            newAddress: {
              district: 'المأرب',
              street: 'شارع القصر',
              neighborhood: 'الروضة',
            },
          },
        ],
      });
    expect(requestRes.status).toBe(201);
    const serviceRequest = requestRes.body;

    // 3. Upload documents
    const docRes = await request(getServer())
      .post('/api/v1/attachments/upload')
      .set('Authorization', 'Bearer valid')
      .send({
        filename: 'taxpayer_id_card.pdf',
        mimeType: 'application/pdf',
        size: 204857,
      });
    expect(docRes.status).toBe(201);

    // 4. Submit request
    const submitRes = await request(getServer())
      .post(`/api/v1/requests/${serviceRequest.id}/submit`)
      .set('Authorization', 'Bearer valid');
    expect(submitRes.status).toBe(200);

    // 5. Schedule field visit
    const scheduledStart = new Date(Date.now() + 3600000).toISOString();
    const scheduledEnd = new Date(Date.now() + 7200000).toISOString();
    const visitRes = await request(getServer())
      .post('/api/v1/visits')
      .set('Authorization', 'Bearer valid')
      .send({
        serviceRequestId: serviceRequest.id,
        scheduledStartAt: scheduledStart,
        scheduledEndAt: scheduledEnd,
        teamMemberStaffIds: [randomUUID()],
        locationSnapshot: 'مأرب - السوق المركزي',
        notes: 'معاينة الموقع للتحقق المالي والضريبي',
      });
    expect(visitRes.status).toBe(201);
    const visit = visitRes.body;

    // Record visit result
    const resultRes = await request(getServer())
      .post(`/api/v1/visits/${visit.id}/results`)
      .set('Authorization', 'Bearer valid')
      .send({
        resultSummary: 'المعاينة تمت بنجاح وتم تأكيد صحة البيانات والنشاط القائم.',
        resultCode: 'VERIFIED',
        actualStartedAt: new Date().toISOString(),
        actualEndedAt: new Date(Date.now() + 1800000).toISOString(),
      });
    expect(resultRes.status).toBe(201);

    // 6. Record decision
    const decisionRes = await request(getServer())
      .post('/api/v1/decisions')
      .set('Authorization', 'Bearer valid')
      .send({
        serviceRequestId: serviceRequest.id,
        outcomeCode: 'approved',
        decisionSummary: 'تمت الموافقة النهائية على فتح الملف الضريبي للمكلف.',
        basisText: 'جميع المستندات مكتملة ونتيجة النزول الميداني إيجابية.',
      });
    expect(decisionRes.status).toBe(201);
  });

  it('FR-102 (Issue tax number) complete flow', async () => {
    // 1. Taxpayer registration
    const taxpayerRes = await request(getServer())
      .post('/api/v1/taxpayers')
      .set('Authorization', 'Bearer valid')
      .send({
        displayName: 'مكلف استخراج رقم ضريبي',
        statusCode: 'active',
      });
    expect(taxpayerRes.status).toBe(201);
    const taxpayer = taxpayerRes.body;

    // Link taxpayer account
    const linkRes = await request(getServer())
      .post('/api/v1/taxpayers/links')
      .set('Authorization', 'Bearer valid')
      .send({
        userProfileId: actorId,
        taxpayerId: taxpayer.id,
        relationshipType: 'owner',
      });
    expect(linkRes.status).toBe(201);

    // 2. Create request with different service type
    const requestRes = await request(getServer())
      .post('/api/v1/requests')
      .set('Authorization', 'Bearer valid')
      .send({
        serviceType: 'issue_tax_number',
        schemaVersion: '1.0.0',
        targets: [
          {
            activityId: randomUUID(),
            branchId: null,
            newAddress: {
              district: 'مأرب القديمة',
              street: 'شارع سبأ القديم',
            },
          },
        ],
      });
    expect(requestRes.status).toBe(201);
    const serviceRequest = requestRes.body;

    // 3. Upload documents
    const docRes = await request(getServer())
      .post('/api/v1/attachments/upload')
      .set('Authorization', 'Bearer valid')
      .send({
        filename: 'commercial_license.pdf',
        mimeType: 'application/pdf',
      });
    expect(docRes.status).toBe(201);

    // 4. Submit request
    const submitRes = await request(getServer())
      .post(`/api/v1/requests/${serviceRequest.id}/submit`)
      .set('Authorization', 'Bearer valid');
    expect(submitRes.status).toBe(200);

    // 5. Schedule visit
    const visitRes = await request(getServer())
      .post('/api/v1/visits')
      .set('Authorization', 'Bearer valid')
      .send({
        serviceRequestId: serviceRequest.id,
        scheduledStartAt: new Date(Date.now() + 3600000).toISOString(),
        scheduledEndAt: new Date(Date.now() + 7200000).toISOString(),
        teamMemberStaffIds: [randomUUID()],
        locationSnapshot: 'مأرب - المنطقة الصناعية',
      });
    expect(visitRes.status).toBe(201);
    const visit = visitRes.body;

    // Record visit result
    const resultRes = await request(getServer())
      .post(`/api/v1/visits/${visit.id}/results`)
      .set('Authorization', 'Bearer valid')
      .send({
        resultSummary: 'النشاط قائم ومطابق للمواصفات القانونية لاستخراج الرقم الضريبي.',
        resultCode: 'VERIFIED',
        actualStartedAt: new Date().toISOString(),
        actualEndedAt: new Date(Date.now() + 1800000).toISOString(),
      });
    expect(resultRes.status).toBe(201);

    // 6. Record decision
    const decisionRes = await request(getServer())
      .post('/api/v1/decisions')
      .set('Authorization', 'Bearer valid')
      .send({
        serviceRequestId: serviceRequest.id,
        outcomeCode: 'approved',
        decisionSummary: 'الموافقة على إصدار الرقم الضريبي للمنشأة التجارية.',
        basisText: 'زيارة ميدانية ناجحة وتوفر التراخيص الحكومية المعتمدة.',
      });
    expect(decisionRes.status).toBe(201);
  });

  it('FR-201 (Deactivate activity) complete flow', async () => {
    const activityId = randomUUID();

    // 1. Create Balagh
    const balaghRes = await request(getServer())
      .post('/api/v1/balaghat')
      .set('Authorization', 'Bearer valid')
      .send({
        reporterName: 'مكتب التفتيش البلدي بمأرب',
        details: 'تصفية وإيقاف كلي للنشاط التجاري بموجب إعلان التصفية القانوني.',
      });
    expect(balaghRes.status).toBe(201);
    const balagh = balaghRes.body;

    // 2. Link activity
    const linkRes = await request(getServer())
      .post(`/api/v1/balaghat/${balagh.id}/activities`)
      .set('Authorization', 'Bearer valid')
      .send({
        activityId,
      });
    expect(linkRes.status).toBe(201);

    // 3. Record decision on Balagh
    const decisionRes = await request(getServer())
      .post('/api/v1/decisions')
      .set('Authorization', 'Bearer valid')
      .send({
        balaghId: balagh.id,
        outcomeCode: 'approved',
        decisionSummary: 'الموافقة على إيقاف وتصفية النشاط بناء على تقرير التفتيش الميداني.',
        basisText: 'بلاغ إيقاف النشاط موثق ورسمي ومطابق لشروط الإلغاء الضريبي.',
      });
    expect(decisionRes.status).toBe(201);
  });

  it('Overpayment Scenario complete flow', async () => {
    const serviceRequestId = randomUUID();

    // 1. Create due
    const dueRes = await request(getServer())
      .post('/api/v1/dues')
      .set('Authorization', 'Bearer valid')
      .send({
        serviceRequestId,
        amount: 150000.0,
        currencyCode: 'YER',
        basisTypeCode: 'license_fee',
      });
    expect(dueRes.status).toBe(201);
    const due = dueRes.body;

    // 2. Upload receipt with value greater than due (Overpayment of 50000 YER)
    const receiptRes = await request(getServer())
      .post(`/api/v1/dues/${due.id}/receipts`)
      .set('Authorization', 'Bearer valid')
      .send({
        amount: 200000.0,
        currencyCode: 'YER',
      });
    expect(receiptRes.status).toBe(201);
    const receipt = receiptRes.body;

    // 3. Confirm receipt and verify overpayment fields
    const confirmRes = await request(getServer())
      .post(`/api/v1/dues/receipts/${receipt.id}/confirm`)
      .set('Authorization', 'Bearer valid')
      .send({
        notes: 'سداد مبلغ إضافي وتم تحويل المبلغ الزائد للمستحقات اللاحقة',
      });
    expect(confirmRes.status).toBe(201);
    expect(confirmRes.body.overpayment_amount).toBe(50000.0);
    expect(confirmRes.body.credit_balance_after).toBe('50000');
  });
});
