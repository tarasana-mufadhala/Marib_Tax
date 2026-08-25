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

export const AUTHENTICATED_ONLY_METADATA = 'marib-tax:authenticated-only';

/**
 * تتطلب جلسة صالحة بلا صلاحية بعينها.
 *
 * لحالة واحدة مشروعة: أن يقرأ المستخدم هويته هو. اشتراط صلاحية هناك يعني
 * أن موظفاً لا يملكها لا يعرف من هو ولا تعمل معه اللوحة أصلاً؛ وجعلها
 * عامة يكشفها لغير المصادَق عليهم. هذه هي المنزلة بينهما.
 *
 * لا تُستعمل لأي نقطة تُرجع بيانات غير بيانات صاحب الجلسة.
 */
export const AuthenticatedEndpoint = (): MethodDecorator & ClassDecorator =>
  SetMetadata(AUTHENTICATED_ONLY_METADATA, true);
