import { SetMetadata } from '@nestjs/common';
import type {
  AuthorizationPredicate,
  PermissionCode,
} from '@marib-tax/contracts';

export const PERMISSION_METADATA = 'marib-tax:permission';
export const PREDICATES_METADATA = 'marib-tax:authorization-predicates';
export const PUBLIC_ENDPOINT_METADATA = 'marib-tax:public-endpoint';

export const RequirePermission = (
  permission: PermissionCode,
): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSION_METADATA, permission);

export const RequirePredicates = (
  ...predicates: readonly AuthorizationPredicate[]
): MethodDecorator & ClassDecorator =>
  SetMetadata(PREDICATES_METADATA, predicates);

export const PublicEndpoint = (): MethodDecorator & ClassDecorator =>
  SetMetadata(PUBLIC_ENDPOINT_METADATA, true);
