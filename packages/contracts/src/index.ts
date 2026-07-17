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
