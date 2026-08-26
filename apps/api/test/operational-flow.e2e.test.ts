import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { PermissionCode } from '@marib-tax/contracts';
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
import { FieldVisitsController } from '../src/field-visits/field-visits.controller.js';
import { FieldVisitsService } from '../src/field-visits/field-visits.service.js';
import {
  FIELD_VISITS_REPOSITORY,
  type StoredFieldVisit,
  type StoredVisitResult,
} from '../src/field-visits/field-visits.repository.js';
import { FieldVisitsMemoryRepository } from '../src/field-visits/field-visits.memory-repository.js';
import { DecisionsController } from '../src/decisions/decisions.controller.js';
import { DecisionsService } from '../src/decisions/decisions.service.js';
import {
  DECISIONS_REPOSITORY,
  type StoredDecisionRecord,
} from '../src/decisions/decisions.repository.js';
import { DecisionsMemoryRepository } from '../src/decisions/decisions.memory-repository.js';
import { DatabaseService } from '../src/database/database.service.js';
import { DuesPaymentsController } from '../src/dues-payments/dues-payments.controller.js';
import { DuesPaymentsService } from '../src/dues-payments/dues-payments.service.js';
import {
  DUES_PAYMENTS_REPOSITORY,
  type StoredPaymentDue,
  type StoredPaymentReceipt,
  type StoredPaymentConfirmation,
} from '../src/dues-payments/dues-payments.repository.js';
import { DuesPaymentsMemoryRepository } from '../src/dues-payments/dues-payments.memory-repository.js';
import { NotificationsController } from '../src/notifications/notifications.controller.js';
import { NotificationsService } from '../src/notifications/notifications.service.js';
import {
  NOTIFICATIONS_REPOSITORY,
  type StoredNotificationMessage,
  type StoredNotificationReadState,
} from '../src/notifications/notifications.repository.js';
import { NotificationsMemoryRepository } from '../src/notifications/notifications.memory-repository.js';

class MockPolicyEvaluator {
  evaluate(): Promise<{ allowed: boolean }> {
    return Promise.resolve({ allowed: true });
  }
}

describe('operational modules E2E flows (visits, decisions, dues, payments, notifications)', () => {
  let app: INestApplication;
  let permissions: PermissionCode[];
  let actorId: string;
  let notificationsRepo: NotificationsMemoryRepository;

  function getServer(): Parameters<typeof request>[0] {
    return app.getHttpServer() as Parameters<typeof request>[0];
  }

  beforeEach(async () => {
    permissions = [
      'field_visit.schedule',
      'field_visit.result.record',
      'request.review',
      'request.decision.final',
      'due.register',
      'due.correct',
      'payment.receipt.upload',
      'payment.confirm',
      'request.read',
      'notification.read',
      'notification.mark_read',
    ];
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
          permissions,
          roleActive: true,
          assignmentActive: true,
        }),
    };
    const actors = new BearerActorContextResolver(tokens, profiles);
    notificationsRepo = new NotificationsMemoryRepository();

    const moduleRef = await Test.createTestingModule({
      controllers: [
        FieldVisitsController,
        DecisionsController,
        DuesPaymentsController,
        NotificationsController,
      ],
      providers: [
        FieldVisitsService,
        {
          provide: FIELD_VISITS_REPOSITORY,
          useClass: FieldVisitsMemoryRepository,
        },
        DecisionsService,
        { provide: DECISIONS_REPOSITORY, useClass: DecisionsMemoryRepository },
        DuesPaymentsService,
        {
          provide: DUES_PAYMENTS_REPOSITORY,
          useClass: DuesPaymentsMemoryRepository,
        },
        // المتحكّم يستعلم القاعدة لتقييد المستحقات بملكيتها؛ هنا مستودع في
        // الذاكرة بلا قاعدة، فقاعدة غير مُهيّأة تُسقط فحص الملكية وتُبقي
        // المسار الوظيفي المُختبَر كما هو.
        { provide: DatabaseService, useValue: { isInitialized: false } },
        NotificationsService,
        { provide: NOTIFICATIONS_REPOSITORY, useValue: notificationsRepo },
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
  }, 30000);

  afterEach(async () => app.close());

  it('performs full field visits lifecycle, request decisions, dues/receipts, and inbox reading E2E', async () => {
    const serviceRequestId = randomUUID();
    const staffId = randomUUID();

    // 1. Schedule a field visit
    const startStr = new Date(Date.now() + 3600000).toISOString();
    const endStr = new Date(Date.now() + 7200000).toISOString();

    const visitRes = await request(getServer())
      .post('/api/v1/visits')
      .set('Authorization', 'Bearer valid')
      .send({
        serviceRequestId,
        scheduledStartAt: startStr,
        scheduledEndAt: endStr,
        teamMemberStaffIds: [staffId],
        locationSnapshot: 'مارب - شارع صنعاء',
        notes: 'زيارة معاينة المحل للتأكد من النشاط الفعلي',
      });

    expect(visitRes.status).toBe(201);
    const visitBody = visitRes.body as StoredFieldVisit;
    expect(visitBody.statusCode).toBe('scheduled');
    const visitId = visitBody.id;

    // 2. Get visit details
    const getVisitRes = await request(getServer())
      .get(`/api/v1/visits/${visitId}`)
      .set('Authorization', 'Bearer valid');

    expect(getVisitRes.status).toBe(200);
    const getVisitBody = getVisitRes.body as StoredFieldVisit;
    expect(getVisitBody.id).toBe(visitId);

    // 3. Record visit results
    const actualStartStr = new Date().toISOString();
    const actualEndStr = new Date(Date.now() + 1800000).toISOString();

    const resultRes = await request(getServer())
      .post(`/api/v1/visits/${visitId}/results`)
      .set('Authorization', 'Bearer valid')
      .send({
        resultSummary:
          'تمت المعاينة وثبت نشاط المحل الفعلي ومطابقته لكافة البيانات المسجلة.',
        resultCode: 'VERIFIED',
        actualStartedAt: actualStartStr,
        actualEndedAt: actualEndStr,
      });

    expect(resultRes.status).toBe(201);
    const resultBody = resultRes.body as StoredVisitResult;
    expect(resultBody.resultCode).toBe('VERIFIED');

    // 4. Record request decision
    const decisionRes = await request(getServer())
      .post('/api/v1/decisions')
      .set('Authorization', 'Bearer valid')
      .send({
        serviceRequestId,
        outcomeCode: 'approved',
        decisionSummary:
          'موافق على المعاملة بناء على تقرير النزول الميداني الناجح.',
        basisText: 'زيارة ميدانية موثقة ورأي المفتش الإيجابي.',
      });

    expect(decisionRes.status).toBe(201);
    const decisionBody = decisionRes.body as StoredDecisionRecord;
    expect(decisionBody.outcomeCode).toBe('approved');
    const decisionId = decisionBody.id;
    expect(decisionId).toBeDefined();

    // 5. Assess payment due
    const dueRes = await request(getServer())
      .post('/api/v1/dues')
      .set('Authorization', 'Bearer valid')
      .send({
        serviceRequestId,
        amount: 250000.0,
        currencyCode: 'YER',
        basisTypeCode: 'license_fee',
        documentReference: 'LICENSE-FEE-2026-09',
      });

    expect(dueRes.status).toBe(201);
    const dueBody = dueRes.body as StoredPaymentDue;
    expect(dueBody.statusCode).toBe('PENDING');
    expect(dueBody.amount).toBe(250000.0);
    const dueId = dueBody.id;

    // 6. Correct payment due
    const correctRes = await request(getServer())
      .post(`/api/v1/dues/${dueId}/corrections`)
      .set('Authorization', 'Bearer valid')
      .send({
        newAmount: 230000.0,
        reason: 'حسم تشجيعي للسداد المبكر للأنشطة الصغيرة',
      });

    expect(correctRes.status).toBe(201);
    const correctBody = correctRes.body as StoredPaymentDue;
    expect(correctBody.amount).toBe(230000.0);

    // 7. Upload receipt evidence
    const receiptRes = await request(getServer())
      .post(`/api/v1/dues/${dueId}/receipts`)
      .set('Authorization', 'Bearer valid')
      .send({
        amount: 230000.0,
        currencyCode: 'YER',
      });

    expect(receiptRes.status).toBe(201);
    const receiptBody = receiptRes.body as StoredPaymentReceipt;
    expect(receiptBody.acceptanceStatusCode).toBe('UPLOADED');
    const receiptId = receiptBody.id;

    // 8. Confirm payment receipt
    const confirmRes = await request(getServer())
      .post(`/api/v1/dues/receipts/${receiptId}/confirm`)
      .set('Authorization', 'Bearer valid')
      .send({
        notes: 'تم مطابقة إشعار البنك وتأكيد الإيداع في البنك المركزي بمأرب',
      });

    expect(confirmRes.status).toBe(201);
    const confirmBody = confirmRes.body as StoredPaymentConfirmation;
    expect(confirmBody.paymentReceiptId).toBe(receiptId);

    // 9. Notifications flow integration E2E
    // Setup active template first
    await notificationsRepo.createTemplate({
      id: randomUUID(),
      code: 'DECISION_APPROVED',
      name: 'معاملة معتمدة ومقبولة',
      channelCode: 'in_app',
      isActive: true,
    });

    // Enqueue message
    const notificationsService = app.get(NotificationsService);
    const msg = await notificationsService.enqueueNotification({
      serviceRequestId,
      balaghId: null,
      paymentNoticeId: null,
      recipientProfileId: actorId,
      templateCode: 'DECISION_APPROVED',
      payloadRef: null,
      idempotencyKey: null,
    });

    // Fetch inbox via HTTP
    const getNotificationsRes = await request(getServer())
      .get('/api/v1/notifications')
      .set('Authorization', 'Bearer valid');

    expect(getNotificationsRes.status).toBe(200);
    const getNotificationsBody = getNotificationsRes.body as Array<{
      message: StoredNotificationMessage;
      readState: StoredNotificationReadState | null;
    }>;
    expect(getNotificationsBody).toHaveLength(1);
    expect(getNotificationsBody[0]?.message.id).toBe(msg.id);
    expect(getNotificationsBody[0]?.readState).toBeNull(); // unread

    // Mark as read via HTTP
    const readRes = await request(getServer())
      .post(`/api/v1/notifications/${msg.id}/read`)
      .set('Authorization', 'Bearer valid');

    expect(readRes.status).toBe(200);
    const readBody = readRes.body as StoredNotificationReadState;
    expect(readBody.readStatusCode).toBe('read');

    // Fetch inbox again to check read state status is updated
    const finalNotificationsRes = await request(getServer())
      .get('/api/v1/notifications')
      .set('Authorization', 'Bearer valid');

    expect(finalNotificationsRes.status).toBe(200);
    const finalNotificationsBody = finalNotificationsRes.body as Array<{
      message: StoredNotificationMessage;
      readState: StoredNotificationReadState | null;
    }>;
    expect(finalNotificationsBody[0]?.readState?.readStatusCode).toBe('read');
  });
});
