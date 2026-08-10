import { Controller, Get, HttpStatus, type INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
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

describe('ApiExceptionFilter', () => {
  let app: INestApplication;

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
    const response = await request(app.getHttpServer())
      .get('/test-errors/domain-conflict')
      .expect(HttpStatus.CONFLICT);

    expect(response.body.error.message).toBe('لا يمكن تعديل الطلب بعد تقديمه');
    expect(response.body.error.code).toBe('RESOURCE_CONFLICT');
    expect(response.body.error.traceId).toBeTruthy();
  });

  it('يمرّر التفاصيل المبنيّة التي يحتاجها العميل ليتصرف', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-errors/domain-details')
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(response.body.error.code).toBe('MISSING_REQUIRED_DOCUMENTS');
    expect(response.body.error.details.missingDocuments).toEqual([
      { code: 'commercial_register', label: 'صورة السجل التجاري' },
    ]);
  });

  it('يبقي الأخطاء الداخلية عامة فلا تتسرب تفاصيل التنفيذ', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-errors/internal-leak')
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);

    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(response.body.error.message).toBe('An unexpected error occurred.');
    // لا اسم جدول ولا أي أثر من رسالة الخطأ الأصلية.
    expect(JSON.stringify(response.body)).not.toContain('service_requests');
    expect(JSON.stringify(response.body)).not.toContain('relation');
  });

  it('يعيد معرّف تتبّع في الترويسة والجسم معاً', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-errors/domain-conflict')
      .expect(HttpStatus.CONFLICT);

    expect(response.headers['x-request-id']).toBe(response.body.error.traceId);
  });

  it('يقبل معرّف تتبّع آمن من العميل ويرفض غير الآمن', async () => {
    const safe = await request(app.getHttpServer())
      .get('/test-errors/domain-conflict')
      .set('x-request-id', 'trace-123')
      .expect(HttpStatus.CONFLICT);
    expect(safe.body.error.traceId).toBe('trace-123');

    const unsafe = await request(app.getHttpServer())
      .get('/test-errors/domain-conflict')
      .set('x-request-id', '<script>alert(1)</script>')
      .expect(HttpStatus.CONFLICT);
    expect(unsafe.body.error.traceId).not.toContain('script');
  });
});
