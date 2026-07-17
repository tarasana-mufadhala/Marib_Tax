import type {
  ActorAuthorizationContext,
  ActorContextResolver,
  AuthorizationAuditHook,
  AuthorizationPolicyEvaluator,
} from './authorization.contracts.js';

export class MissingActorContextResolver implements ActorContextResolver {
  resolve(): Promise<ActorAuthorizationContext | null> {
    return Promise.resolve(null);
  }
}

export class DenyAuthorizationPolicyEvaluator implements AuthorizationPolicyEvaluator {
  evaluate(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

export class NoopAuthorizationAuditHook implements AuthorizationAuditHook {
  recordDenied(): Promise<void> {
    return Promise.resolve();
  }
}
