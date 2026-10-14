import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  isPermissionCode,
  type AuthorizationPredicate,
  type PermissionCode,
} from '@marib-tax/contracts';
import {
  ACTOR_CONTEXT_RESOLVER,
  AUTHORIZATION_AUDIT_HOOK,
  AUTHORIZATION_POLICY_EVALUATOR,
  type ActorContextResolver,
  type AuthorizationAuditHook,
  type AuthorizationPolicyEvaluator,
} from './authorization.contracts.js';
import {
  AUTHENTICATED_ONLY_METADATA,
  PERMISSION_METADATA,
  PREDICATES_METADATA,
  PUBLIC_ENDPOINT_METADATA,
} from './authorization.decorators.js';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ACTOR_CONTEXT_RESOLVER)
    private readonly actors: ActorContextResolver,
    @Inject(AUTHORIZATION_POLICY_EVALUATOR)
    private readonly policies: AuthorizationPolicyEvaluator,
    @Inject(AUTHORIZATION_AUDIT_HOOK)
    private readonly audit: AuthorizationAuditHook,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (
      this.reflector.getAllAndOverride<boolean>(
        PUBLIC_ENDPOINT_METADATA,
        targets,
      ) === true
    )
      return true;

    // جلسة صالحة بلا صلاحية بعينها — لقراءة المستخدم هويته هو وحدها.
    const authenticatedOnly =
      this.reflector.getAllAndOverride<boolean>(
        AUTHENTICATED_ONLY_METADATA,
        targets,
      ) === true;

    if (authenticatedOnly) {
      const sessionActor = await this.actors.resolve(context);
      if (sessionActor === null) return this.deny('MISSING_ACTOR_CONTEXT');
      if (!sessionActor.roleActive || !sessionActor.assignmentActive) {
        return this.deny(
          'INACTIVE_AUTHORIZATION',
          undefined,
          sessionActor.actorId,
        );
      }
      return true;
    }

    const permission = this.reflector.getAllAndOverride<string>(
      PERMISSION_METADATA,
      targets,
    );
    if (permission === undefined || !isPermissionCode(permission))
      return this.deny('UNKNOWN_OR_MISSING_PERMISSION');

    const actor = await this.actors.resolve(context);
    if (actor === null) return this.deny('MISSING_ACTOR_CONTEXT', permission);
    if (!actor.roleActive || !actor.assignmentActive)
      return this.deny('INACTIVE_AUTHORIZATION', permission, actor.actorId);
    if (!actor.permissions.includes(permission))
      return this.deny('PERMISSION_DENIED', permission, actor.actorId);

    const predicates =
      this.reflector.getAllAndOverride<readonly AuthorizationPredicate[]>(
        PREDICATES_METADATA,
        targets,
      ) ?? [];
    for (const predicate of predicates) {
      if (!(await this.policies.evaluate(predicate, actor, context))) {
        return this.deny(
          `PREDICATE_DENIED:${predicate}`,
          permission,
          actor.actorId,
        );
      }
    }
    return true;
  }

  private async deny(
    reason: string,
    permission?: PermissionCode,
    actorId?: string,
  ): Promise<false> {
    await this.audit.recordDenied({
      ...(actorId === undefined ? {} : { actorId }),
      ...(permission === undefined ? {} : { permission }),
      reason,
    });
    return false;
  }
}
