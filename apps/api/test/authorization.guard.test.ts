import 'reflect-metadata';

import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import type {
  AuthorizationPredicate,
  PermissionCode,
} from '@marib-tax/contracts';
import { AuthorizationGuard } from '../src/authz/authorization.guard.js';
import type {
  ActorAuthorizationContext,
  ActorContextResolver,
  AuthorizationAuditHook,
  AuthorizationPolicyEvaluator,
} from '../src/authz/authorization.contracts.js';
import {
  PERMISSION_METADATA,
  PREDICATES_METADATA,
  PUBLIC_ENDPOINT_METADATA,
} from '../src/authz/authorization.decorators.js';

class TestActorResolver implements ActorContextResolver {
  constructor(public actor: ActorAuthorizationContext | null) {}
  resolve(): Promise<ActorAuthorizationContext | null> {
    return Promise.resolve(this.actor);
  }
}

class TestPolicyEvaluator implements AuthorizationPolicyEvaluator {
  constructor(
    private readonly results: Partial<
      Record<AuthorizationPredicate, boolean>
    > = {},
  ) {}
  evaluate(predicate: AuthorizationPredicate): Promise<boolean> {
    return Promise.resolve(this.results[predicate] ?? false);
  }
}

class TestAuditHook implements AuthorizationAuditHook {
  reasons: string[] = [];
  recordDenied(input: { reason: string }): Promise<void> {
    this.reasons.push(input.reason);
    return Promise.resolve();
  }
}

function context(
  permission?: string,
  predicates: readonly AuthorizationPredicate[] = [],
  isPublic = false,
): ExecutionContext {
  const handler = (): void => undefined;
  class Controller {}
  if (permission !== undefined)
    Reflect.defineMetadata(PERMISSION_METADATA, permission, handler);
  if (predicates.length > 0)
    Reflect.defineMetadata(PREDICATES_METADATA, predicates, handler);
  if (isPublic) Reflect.defineMetadata(PUBLIC_ENDPOINT_METADATA, true, handler);
  return {
    getHandler: () => handler,
    getClass: () => Controller,
  } as unknown as ExecutionContext;
}

function actor(
  permissions: readonly PermissionCode[],
  overrides: Partial<ActorAuthorizationContext> = {},
): ActorAuthorizationContext {
  return {
    actorId: 'actor-1',
    permissions,
    roleActive: true,
    assignmentActive: true,
    ...overrides,
  };
}

async function authorize(input: {
  permission?: string;
  permissions?: readonly PermissionCode[];
  predicates?: readonly AuthorizationPredicate[];
  policyResults?: Partial<Record<AuthorizationPredicate, boolean>>;
  actorOverrides?: Partial<ActorAuthorizationContext>;
  missingActor?: boolean;
  isPublic?: boolean;
}): Promise<{ allowed: boolean; reasons: string[] }> {
  const audit = new TestAuditHook();
  const resolver = new TestActorResolver(
    input.missingActor
      ? null
      : actor(input.permissions ?? [], input.actorOverrides),
  );
  const guard = new AuthorizationGuard(
    new Reflector(),
    resolver,
    new TestPolicyEvaluator(input.policyResults),
    audit,
  );
  return {
    allowed: await guard.canActivate(
      context(input.permission, input.predicates, input.isPublic),
    ),
    reasons: audit.reasons,
  };
}

describe('fail-closed authorization guard', () => {
  it('allows an explicit public health endpoint only', async () => {
    await expect(authorize({ isPublic: true })).resolves.toMatchObject({
      allowed: true,
    });
  });

  it('allows permission with ownership and resource state', async () => {
    await expect(
      authorize({
        permission: 'request.submit',
        permissions: ['request.submit'],
        predicates: ['OWNERSHIP', 'RESOURCE_STATE'],
        policyResults: { OWNERSHIP: true, RESOURCE_STATE: true },
      }),
    ).resolves.toMatchObject({ allowed: true });
  });

  it.each([
    ['missing permission metadata', { permissions: ['request.submit'] }],
    [
      'missing actor context',
      { permission: 'request.submit', missingActor: true },
    ],
    [
      'role without exact permission',
      { permission: 'request.decision.final', permissions: ['request.review'] },
    ],
    [
      'reviewer final decision',
      {
        permission: 'request.decision.final',
        permissions: ['request.decision.recommend'],
      },
    ],
    [
      'payment officer final decision',
      {
        permission: 'request.decision.final',
        permissions: ['payment.confirm'],
      },
    ],
    [
      'report reader mutation',
      { permission: 'request.submit', permissions: ['report.view'] },
    ],
    [
      'report view does not export',
      { permission: 'report.export', permissions: ['report.view'] },
    ],
    [
      'inactive role',
      {
        permission: 'request.submit',
        permissions: ['request.submit'],
        actorOverrides: { roleActive: false },
      },
    ],
    [
      'revoked assignment',
      {
        permission: 'request.submit',
        permissions: ['request.submit'],
        actorOverrides: { assignmentActive: false },
      },
    ],
    ['unknown permission', { permission: 'admin.*', permissions: [] }],
  ] as const)('denies %s', async (_name, input) => {
    const result = await authorize(input);
    expect(result.allowed).toBe(false);
    expect(result.reasons).toHaveLength(1);
  });

  it('denies permission without ownership', async () => {
    const result = await authorize({
      permission: 'request.read',
      permissions: ['request.read'],
      predicates: ['OWNERSHIP'],
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons[0]).toBe('PREDICATE_DENIED:OWNERSHIP');
  });

  it('denies import when separation of duties fails', async () => {
    const result = await authorize({
      permission: 'import.commit',
      permissions: ['import.commit'],
      predicates: ['SEPARATION_OF_DUTIES'],
      policyResults: { SEPARATION_OF_DUTIES: false },
    });
    expect(result.allowed).toBe(false);
  });
});
