import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../http/domain-exception.js';
import {
  availableServices,
  missingRequiredDocuments,
  serviceCatalog,
  type CreateServiceRequest,
  type EditServiceRequest,
  type IdentityDocumentType,
  type ServiceDefinition,
  type ServiceRequestListItem,
  type ServiceRequestResponse,
} from '@marib-tax/contracts';
import {
  SERVICE_REQUEST_REPOSITORY,
  type ServiceRequestRepository,
  type StoredServiceRequest,
} from './service-request.repository.js';

@Injectable()
export class ServiceRequestService {
  constructor(
    @Inject(SERVICE_REQUEST_REPOSITORY)
    private readonly repository: ServiceRequestRepository,
  ) {}

  /** الخدمات المتاحة لهذا المكلف — FR-102 تُخفى عمّن يملك رقماً ضريبياً. */
  async catalogFor(ownerActorId: string): Promise<ServiceDefinition[]> {
    return availableServices(await this.repository.hasTaxNumber(ownerActorId));
  }

  async create(
    ownerActorId: string,
    input: CreateServiceRequest,
  ): Promise<ServiceRequestResponse> {
    // FR-102 مقصورة على من لا يملك رقماً ضريبياً — يُفرَض على الخادم لا في الواجهة.
    if (serviceCatalog[input.serviceCode].availability === 'without_tax_number_only') {
      if (await this.repository.hasTaxNumber(ownerActorId)) {
        throw DomainException.conflict(
          'هذه الخدمة متاحة لمن لا يملك رقماً ضريبياً مسبقاً',
          'SERVICE_NOT_AVAILABLE',
        );
      }
    }

    const now = new Date().toISOString();
    const request: StoredServiceRequest = {
      id: randomUUID(),
      publicRef: null,
      serviceCode: input.serviceCode,
      schemaVersion: input.schemaVersion,
      status: 'draft',
      form: structuredClone(input.form),
      ownerActorId,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
    };
    await this.repository.create(request);
    return toResponse((await this.repository.findById(request.id)) ?? request);
  }

  async read(ownerActorId: string, id: string): Promise<ServiceRequestResponse> {
    return toResponse(await this.owned(ownerActorId, id));
  }

  list(
    ownerActorId: string | undefined,
    limit = 50,
  ): Promise<ServiceRequestListItem[]> {
    return this.repository.list(ownerActorId, Math.min(Math.max(limit, 1), 200));
  }

  async edit(
    ownerActorId: string,
    id: string,
    input: EditServiceRequest,
  ): Promise<ServiceRequestResponse> {
    const request = await this.owned(ownerActorId, id);
    if (request.status !== 'draft') {
      throw DomainException.conflict('لا يمكن تعديل الطلب بعد تقديمه');
    }
    request.form = structuredClone(input.form);
    request.updatedAt = new Date().toISOString();
    await this.repository.save(request);
    return toResponse(request);
  }

  /** المستندات الإلزامية الناقصة — يستعملها التطبيق قبل الإرسال. */
  async missingDocuments(
    ownerActorId: string,
    id: string,
  ): Promise<{ code: string; label: string }[]> {
    const request = await this.owned(ownerActorId, id);
    return (await this.computeMissing(request)).map((document) => ({
      code: document.code,
      label: document.label,
    }));
  }

  /**
   * التقديم يفرض «ملاحظات القبول» في القسم 4.3: طلب تنقصه مستندات إلزامية
   * لا يُقدَّم أصلاً، بدل أن يصل المكتب ناقصاً ويُرد لاحقاً.
   */
  async submit(
    ownerActorId: string,
    id: string,
  ): Promise<ServiceRequestResponse> {
    const request = await this.owned(ownerActorId, id);
    if (request.status !== 'draft') {
      throw DomainException.conflict('هذا الطلب مُقدَّم مسبقاً');
    }

    const missing = await this.computeMissing(request);
    if (missing.length > 0) {
      throw DomainException.unprocessable(
        'لا يمكن تقديم الطلب قبل إرفاق المستندات الإلزامية',
        {
          missingDocuments: missing.map((d) => ({ code: d.code, label: d.label })),
        },
        'MISSING_REQUIRED_DOCUMENTS',
      );
    }

    const submittedAt = new Date().toISOString();
    request.status = 'submitted';
    request.submittedAt = submittedAt;
    request.updatedAt = submittedAt;
    await this.repository.save(request);
    return toResponse(request);
  }

  private async computeMissing(request: StoredServiceRequest) {
    const [provided, isCompany] = await Promise.all([
      this.repository.attachedDocumentCodes(request.id),
      this.repository.isCompanyTaxpayer(request.ownerActorId),
    ]);

    return missingRequiredDocuments(
      request.serviceCode,
      {
        isCompany,
        identityDocumentType: identityTypeOf(request.form),
      },
      provided,
    );
  }

  private async owned(
    actorId: string,
    id: string,
  ): Promise<StoredServiceRequest> {
    const request = await this.repository.findById(id);
    if (request === null) throw DomainException.notFound('الطلب غير موجود');
    if (request.ownerActorId !== actorId) {
      throw DomainException.forbidden('لا تملك صلاحية الوصول لهذا الطلب');
    }
    return request;
  }
}

/** نوع وثيقة الهوية المختارة في النموذج، إن كانت الخدمة تطلبها. */
function identityTypeOf(form: unknown): IdentityDocumentType | null {
  if (typeof form !== 'object' || form === null) return null;
  const value = (form as { identityDocumentType?: unknown }).identityDocumentType;
  return value === 'national_id' || value === 'passport' ? value : null;
}

function toResponse(request: StoredServiceRequest): ServiceRequestResponse {
  return {
    id: request.id,
    publicRef: request.publicRef,
    serviceCode: request.serviceCode,
    schemaVersion: request.schemaVersion,
    status: request.status,
    form: structuredClone(request.form),
    ownerActorId: request.ownerActorId,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    submittedAt: request.submittedAt,
  };
}
