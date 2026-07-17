import {
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from './bearer-actor-context.resolver.js';

@Injectable({ scope: Scope.REQUEST })
export class CurrentActorService implements CurrentActorPort {
  constructor(
    @Inject(REQUEST) private readonly request: AuthenticatedRequest,
  ) {}
  requireActorId(): string {
    const actor = this.request[VERIFIED_ACTOR];
    if (actor === undefined) throw new UnauthorizedException();
    return actor.actorId;
  }
}
