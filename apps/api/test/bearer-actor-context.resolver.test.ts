import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  BearerActorContextResolver,
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from '../src/authn/bearer-actor-context.resolver.js';
import type {
  AccessTokenVerifier,
  ActorProfileRepository,
} from '../src/authn/authentication.contracts.js';

function context(headers: Record<string, string> = {}): {
  context: ExecutionContext;
  request: AuthenticatedRequest;
} {
  const request = { headers } as unknown as AuthenticatedRequest;
  return {
    request,
    context: {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext,
  };
}

const tokens: AccessTokenVerifier = {
  verify: () => Promise.resolve({ authUserId: 'auth-user' }),
};
const activeProfile: ActorProfileRepository = {
  findActiveByAuthUserId: () =>
    Promise.resolve({
      actorId: 'profile-1',
      permissions: ['request.draft.create'],
      roleActive: true,
      assignmentActive: true,
    }),
};

describe('bearer actor context resolver', () => {
  it('creates an immutable server-resolved actor context', async () => {
    const input = context({ authorization: 'Bearer verified-token' });
    const actor = await new BearerActorContextResolver(
      tokens,
      activeProfile,
    ).resolve(input.context);
    expect(actor.actorId).toBe('profile-1');
    expect(Object.isFrozen(actor)).toBe(true);
    expect(input.request[VERIFIED_ACTOR]).toBe(actor);
  });

  it.each([
    {},
    { authorization: 'Basic token' },
    { authorization: 'Bearer token', 'x-actor-id': 'spoofed' },
  ])(
    'rejects missing, malformed, or caller-supplied identity headers',
    async (headers) => {
      await expect(
        new BearerActorContextResolver(tokens, activeProfile).resolve(
          context(headers).context,
        ),
      ).rejects.toMatchObject({ status: 401 });
    },
  );

  it('denies an unknown or inactive application profile', async () => {
    const profiles: ActorProfileRepository = {
      findActiveByAuthUserId: () => Promise.resolve(null),
    };
    await expect(
      new BearerActorContextResolver(tokens, profiles).resolve(
        context({ authorization: 'Bearer token' }).context,
      ),
    ).rejects.toMatchObject({ status: 401 });
  });
});
