import { randomUUID } from 'node:crypto';

import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import type { ApiErrorEnvelope } from '@marib-tax/contracts';

import { DomainException } from './domain-exception.js';

const errorByStatus: Readonly<
  Record<number, { code: string; message: string }>
> = {
  [HttpStatus.BAD_REQUEST]: {
    code: 'BAD_REQUEST',
    message: 'The request is invalid.',
  },
  [HttpStatus.UNAUTHORIZED]: {
    code: 'AUTHENTICATION_REQUIRED',
    message: 'Authentication is required.',
  },
  [HttpStatus.FORBIDDEN]: {
    code: 'PERMISSION_DENIED',
    message: 'Permission is denied.',
  },
  [HttpStatus.NOT_FOUND]: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'The requested resource was not found.',
  },
  [HttpStatus.CONFLICT]: {
    code: 'RESOURCE_CONFLICT',
    message: 'The request conflicts with current state.',
  },
  [HttpStatus.UNPROCESSABLE_ENTITY]: {
    code: 'VALIDATION_FAILED',
    message: 'Request validation failed.',
  },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    code: 'RATE_LIMITED',
    message: 'Too many requests.',
  },
  [HttpStatus.SERVICE_UNAVAILABLE]: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'The service is temporarily unavailable.',
  },
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const requestedTraceId = request.header('x-request-id');
    const traceId = isSafeTraceId(requestedTraceId)
      ? requestedTraceId
      : randomUUID();

    // الرسائل العامة هي الافتراض حتى لا تتسرب تفاصيل داخلية. الاستثناء
    // الوحيد هو DomainException: رسالته مكتوبة عمداً ليقرأها المستخدم.
    const envelope: ApiErrorEnvelope =
      exception instanceof DomainException
        ? { error: { ...exception.payload, traceId } }
        : {
            error: {
              ...(errorByStatus[status] ?? {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred.',
              }),
              traceId,
            },
          };

    // عطل الخادم يُسجَّل بجانبه لا في رد المستخدم: بلا هذا يختفي كل خطأ 500
    // بلا أثر، فيُرى «حدث خطأ غير متوقع» وحده ولا يُعرف سببه إطلاقاً.
    // يُربط بالرد عبر traceId. أخطاء 4xx متوقّعة فلا تُضجّ السجل.
    if (status >= 500) {
      const detail =
        exception instanceof Error
          ? `${exception.name}: ${exception.message}`
          : String(exception);
      this.logger.error(
        `[${traceId}] ${request.method} ${request.url} → ${status} — ${detail}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.setHeader('x-request-id', traceId);
    response.status(status).json(envelope);
  }
}

function isSafeTraceId(value: string | undefined): value is string {
  return value !== undefined && /^[A-Za-z0-9._:-]{1,128}$/.test(value);
}
