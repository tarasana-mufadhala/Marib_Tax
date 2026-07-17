import type { ExecutionContext } from '@nestjs/common';
import type {
  AuthorizationPredicate,
  PermissionCode,
} from '@marib-tax/contracts';

export interface ActorAuthorizationContext {
  actorId: string;
  permissions: readonly PermissionCode[];
  roleActive: boolean;
  assignmentActive: boolean;
}

export interface ActorContextResolver {
  resolve(context: ExecutionContext): Promise<ActorAuthorizationContext | null>;
}

export interface AuthorizationPolicyEvaluator {
  evaluate(
    predicate: AuthorizationPredicate,
    actor: ActorAuthorizationContext,
    context: ExecutionContext,
  ): Promise<boolean>;
}

export interface AuthorizationAuditHook {
  recordDenied(input: {
    actorId?: string;
    permission?: PermissionCode;
    reason: string;
  }): Promise<void>;
}

export const ACTOR_CONTEXT_RESOLVER = Symbol('ACTOR_CONTEXT_RESOLVER');
export const AUTHORIZATION_POLICY_EVALUATOR = Symbol(
  'AUTHORIZATION_POLICY_EVALUATOR',
);
export const AUTHORIZATION_AUDIT_HOOK = Symbol('AUTHORIZATION_AUDIT_HOOK');
