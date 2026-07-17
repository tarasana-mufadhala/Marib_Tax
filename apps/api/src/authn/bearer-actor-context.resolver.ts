import {
  Inject,
  Injectable,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import type {
  ActorAuthorizationContext,
  ActorContextResolver,
} from '../authz/authorization.contracts.js';
import {
  ACCESS_TOKEN_VERIFIER,
  ACTOR_PROFILE_REPOSITORY,
  type AccessTokenVerifier,
  type ActorProfileRepository,
} from './authentication.contracts.js';

export const VERIFIED_ACTOR = Symbol('marib-tax:verified-actor');
const FORBIDDEN_IDENTITY_HEADERS = [
  'x-actor-id',
  'x-taxpayer-id',
  'x-staff-profile-id',
] as const;
export type AuthenticatedRequest = Request & {
  [VERIFIED_ACTOR]?: ActorAuthorizationContext;
};

@Injectable()
export class BearerActorContextResolver implements ActorContextResolver {
  constructor(
    @Inject(ACCESS_TOKEN_VERIFIER) private readonly tokens: AccessTokenVerifier,
    @Inject(ACTOR_PROFILE_REPOSITORY)
    private readonly profiles: ActorProfileRepository,
  ) {}
  async resolve(context: ExecutionContext): Promise<ActorAuthorizationContext> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (
      FORBIDDEN_IDENTITY_HEADERS.some(
        (name) => request.headers[name] !== undefined,
      )
    )
      throw new UnauthorizedException();
    const authorization = request.headers.authorization;
    const match =
      typeof authorization === 'string'
        ? /^Bearer ([^\s]+)$/.exec(authorization)
        : null;
    if (match === null) throw new UnauthorizedException();
    const identity = await this.tokens.verify(match[1]!);
    const actor = await this.profiles.findActiveByAuthUserId(
      identity.authUserId,
    );
    if (actor === null) throw new UnauthorizedException();
    const immutableActor = Object.freeze({
      ...actor,
      permissions: Object.freeze([...actor.permissions]),
    });
    request[VERIFIED_ACTOR] = immutableActor;
    return immutableActor;
  }
}
