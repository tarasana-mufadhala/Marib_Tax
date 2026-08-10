import type {
  ServiceCode,
  ServiceRequestListItem,
  ServiceRequestResponse,
} from '@marib-tax/contracts';

export interface StoredServiceRequest extends ServiceRequestResponse {
  ownerActorId: string;
}

export interface ServiceRequestRepository {
  create(request: StoredServiceRequest): Promise<void>;
  findById(id: string): Promise<StoredServiceRequest | null>;
  save(request: StoredServiceRequest): Promise<void>;
  /** بلا معرّف مالك تُعاد طلبات الجميع (للموظفين فقط). */
  list(
    ownerActorId: string | undefined,
    limit: number,
  ): Promise<ServiceRequestListItem[]>;
  /** رموز المستندات المرفوعة على الطلب — أساس التحقق من قاعدة القبول. */
  attachedDocumentCodes(requestId: string): Promise<string[]>;
  /** هل الكيان القانوني للمكلف شركة؟ يفعّل مستندات الشركات. */
  isCompanyTaxpayer(ownerActorId: string): Promise<boolean>;
  /** هل للمكلف رقم ضريبي؟ يحدد إتاحة FR-102. */
  hasTaxNumber(ownerActorId: string): Promise<boolean>;
  serviceCodeOf(requestId: string): Promise<ServiceCode | null>;
}

export const SERVICE_REQUEST_REPOSITORY = Symbol('SERVICE_REQUEST_REPOSITORY');
