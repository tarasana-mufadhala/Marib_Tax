import {
  Controller,
  Get,
  HttpStatus,
  type INestApplication,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { ApiErrorBody, ApiErrorEnvelope } from '@marib-tax/contracts';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ApiExceptionFilter } from '../src/http/api-exception.filter.js';
import { DomainException } from '../src/http/domain-exception.js';
import { PublicEndpoint } from '../src/authz/authorization.decorators.js';

@Controller('test-errors')
@PublicEndpoint()
class ErrorsController {
  @Get('domain-conflict')
  domainConflict(): never {
    throw DomainException.conflict('لا يمكن تعديل الطلب بعد تقديمه');
  }

  @Get('domain-details')
  domainDetails(): never {
    throw DomainException.unprocessable(
      'لا يمكن تقديم الطلب قبل إرفاق المستندات الإلزامية',
      {
        missingDocuments: [
          { code: 'commercial_register', label: 'صورة السجل التجاري' },
        ],
      },
      'MISSING_REQUIRED_DOCUMENTS',
    );
  }

  @Get('internal-leak')
  internalLeak(): never {
    // خطأ داخلي برسالة تكشف تفاصيل التنفيذ.
    throw new Error('relation "requests.service_requests" does not exist');
  }
}

const errorOf = (response: { body: unknown }): ApiErrorBody =>
  (response.body as ApiErrorEnvelope).error;

describe('ApiExceptionFilter', () => {
  let app: INestApplication;
  const server = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ErrorsController],
      providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => app.close());

  it('يمرّر رسالة DomainException العربية كما كُتبت', async () => {
    const response = await request(server())
      .get('/test-errors/domain-conflict')
      .expect(HttpStatus.CONFLICT);

    expect(errorOf(response).message).toBe('لا يمكن تعديل الطلب بعد تقديمه');
    expect(errorOf(response).code).toBe('RESOURCE_CONFLICT');
    expect(errorOf(response).traceId).toBeTruthy();
  });

  it('يمرّر التفاصيل المبنيّة التي يحتاجها العميل ليتصرف', async () => {
    const response = await request(server())
      .get('/test-errors/domain-details')
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(errorOf(response).code).toBe('MISSING_REQUIRED_DOCUMENTS');
    expect(
      (errorOf(response).details as Record<string, unknown> | undefined)?.[
        'missingDocuments'
      ],
    ).toEqual([{ code: 'commercial_register', label: 'صورة السجل التجاري' }]);
  });

  it('يبقي الأخطاء الداخلية عامة فلا تتسرب تفاصيل التنفيذ', async () => {
    const response = await request(server())
      .get('/test-errors/internal-leak')
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);

    expect(errorOf(response).code).toBe('INTERNAL_ERROR');
    expect(errorOf(response).message).toBe('An unexpected error occurred.');
    // لا اسم جدول ولا أي أثر من رسالة الخطأ الأصلية.
    expect(JSON.stringify(response.body)).not.toContain('service_requests');
    expect(JSON.stringify(response.body)).not.toContain('relation');
  });

  it('يعيد معرّف تتبّع في الترويسة والجسم معاً', async () => {
    const response = await request(server())
      .get('/test-errors/domain-conflict')
      .expect(HttpStatus.CONFLICT);

    expect(response.headers['x-request-id']).toBe(errorOf(response).traceId);
  });

  it('يقبل معرّف تتبّع آمن من العميل ويرفض غير الآمن', async () => {
    const safe = await request(server())
      .get('/test-errors/domain-conflict')
      .set('x-request-id', 'trace-123')
      .expect(HttpStatus.CONFLICT);
    expect(errorOf(safe).traceId).toBe('trace-123');

    const unsafe = await request(server())
      .get('/test-errors/domain-conflict')
      .set('x-request-id', '<script>alert(1)</script>')
      .expect(HttpStatus.CONFLICT);
    expect(errorOf(unsafe).traceId).not.toContain('script');
  });
});
