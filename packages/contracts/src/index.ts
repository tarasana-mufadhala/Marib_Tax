export type ApiUuid = string;

export interface ApiFieldError {
  field: string;
  code: string;
  message: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiFieldError[];
  traceId: string;
}

export interface ApiErrorEnvelope {
  error: ApiErrorBody;
}

export interface PageMetadata {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface HealthResponse {
  status: 'ok';
  service: 'marib-tax-api';
  version: 'v1';
}

export interface ReadinessResponse {
  status: 'ready';
  service: 'marib-tax-api';
  version: 'v1';
}

export const permissionCodes = [
  'taxpayer.profile.read',
  'taxpayer.profile.update',
  'request.read',
  'request.draft.create',
  'request.draft.edit',
  'request.draft.delete',
  'request.submit',
  'request.completion.provide',
  'request.review',
  'request.completion.request',
  'request.decision.recommend',
  'request.decision.final',
  'request.admin.close',
  'request.archive',
  'balagh.read',
  'balagh.create',
  'balagh.draft.edit',
  'balagh.draft.delete',
  'balagh.submit',
  'balagh.completion.provide',
  'balagh.review',
  'balagh.completion.request',
  'balagh.decision.recommend',
  'balagh.decision.final',
  'balagh.admin.close',
  'balagh.archive',
  'field_visit.schedule',
  'field_visit.result.record',
  'due.register',
  'due.correct',
  'payment.confirm',
  'payment.receipt.upload',
  'notification.read',
  'notification.mark_read',
  'content.publish',
  'content.withdraw',
  'import.preview',
  'import.validate',
  'import.approve',
  'import.commit',
  'import.reject',
  'report.view',
  'report.export',
  'audit.sensitive.view',
] as const;

export type PermissionCode = (typeof permissionCodes)[number];

export const authorizationPredicates = [
  'OWNERSHIP',
  'ACTIVE_ASSIGNMENT',
  'OFFICE_SCOPE',
  'UNIT_SCOPE',
  'RESOURCE_STATE',
  'SEPARATION_OF_DUTIES',
  'REQUIRED_EVIDENCE',
] as const;

export type AuthorizationPredicate = (typeof authorizationPredicates)[number];

export function isPermissionCode(value: string): value is PermissionCode {
  return permissionCodes.includes(value as PermissionCode);
}

export * from './request-draft.js';
export * from './taxpayer-registry.js';
export * from './masterdata.js';
export * from './attachments.js';
