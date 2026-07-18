import { Inject, Injectable, type ExecutionContext } from '@nestjs/common';
import { z } from 'zod';
import type {
  AuthorizationPolicyEvaluator,
  ActorAuthorizationContext,
} from '../authz/authorization.contracts.js';
import type { AuthorizationPredicate } from '@marib-tax/contracts';
import {
  REQUEST_DRAFT_REPOSITORY,
  type RequestDraftRepository,
} from './request-draft.repository.js';

interface PolicyRequest {
  method?: string;
  originalUrl?: string;
  params?: { id?: string };
}

@Injectable()
export class RequestDraftPolicyEvaluator implements AuthorizationPolicyEvaluator {
  constructor(
    @Inject(REQUEST_DRAFT_REPOSITORY)
    private readonly repository: RequestDraftRepository,
  ) {}

  async evaluate(
    predicate: AuthorizationPredicate,
    actor: ActorAuthorizationContext,
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PolicyRequest>();
    const id = request.params?.id;

    if (predicate === 'OWNERSHIP' && id === undefined) {
      return this.isOwnedCollectionCreate(request);
    }
    if (predicate !== 'OWNERSHIP' && predicate !== 'RESOURCE_STATE') {
      return false;
    }
    if (!z.uuid().safeParse(id).success) return false;

    const draft = await this.repository.findById(id as string);
    if (draft === null) return false;
    return predicate === 'OWNERSHIP'
      ? draft.ownerActorId === actor.actorId
      : draft.status === 'draft';
  }

  private isOwnedCollectionCreate(request: PolicyRequest): boolean {
    const path = request.originalUrl?.split('?', 1)[0];
    return request.method === 'POST' && path === '/api/v1/requests';
  }
}
