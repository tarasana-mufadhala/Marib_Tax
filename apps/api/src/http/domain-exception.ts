import { HttpException, HttpStatus } from '@nestjs/common';

export interface DomainErrorPayload {
  /** رمز ثابت يعتمد عليه العميل. */
  code: string;
  /** رسالة عربية مكتوبة عمداً للعرض على المستخدم. */
  message: string;
  /** بيانات إضافية آمنة — مثل قائمة المستندات الناقصة. */
  details?: Record<string, unknown>;
}

/**
 * استثناء رسالته مقصودة للعرض على المستخدم.
 *
 * `ApiExceptionFilter` يستبدل رسائل الاستثناءات العادية برسائل عامة عمداً،
 * حتى لا تتسرب تفاصيل داخلية للعميل. لكن بعض الرسائل مكتوبة أصلاً ليقرأها
 * المكلف («لا يمكن تعديل الطلب بعد تقديمه»)، وبعضها يحمل بيانات يحتاجها
 * التطبيق ليتصرف (قائمة المستندات الناقصة).
 *
 * هذا الصنف هو القناة الصريحة لتلك الحالة: ما يُرمى به يمر كما هو، وما عداه
 * يبقى خاضعاً للرسائل العامة. الاشتراك صريح لا افتراضي.
 */
export class DomainException extends HttpException {
  constructor(status: HttpStatus, payload: DomainErrorPayload) {
    super(payload, status);
  }

  get payload(): DomainErrorPayload {
    return this.getResponse() as DomainErrorPayload;
  }

  static notFound(message: string, code = 'RESOURCE_NOT_FOUND'): DomainException {
    return new DomainException(HttpStatus.NOT_FOUND, { code, message });
  }

  static forbidden(message: string, code = 'PERMISSION_DENIED'): DomainException {
    return new DomainException(HttpStatus.FORBIDDEN, { code, message });
  }

  static conflict(message: string, code = 'RESOURCE_CONFLICT'): DomainException {
    return new DomainException(HttpStatus.CONFLICT, { code, message });
  }

  static badRequest(message: string, code = 'BAD_REQUEST'): DomainException {
    return new DomainException(HttpStatus.BAD_REQUEST, { code, message });
  }

  static unprocessable(
    message: string,
    details?: Record<string, unknown>,
    code = 'VALIDATION_FAILED',
  ): DomainException {
    return new DomainException(HttpStatus.UNPROCESSABLE_ENTITY, {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    });
  }

  static preconditionFailed(
    message: string,
    code = 'PRECONDITION_FAILED',
  ): DomainException {
    return new DomainException(HttpStatus.PRECONDITION_FAILED, { code, message });
  }

  static unavailable(
    message: string,
    code = 'SERVICE_UNAVAILABLE',
  ): DomainException {
    return new DomainException(HttpStatus.SERVICE_UNAVAILABLE, { code, message });
  }
}
