import { Inject, Injectable, type ExecutionContext } from '@nestjs/common';
import { z } from 'zod';
import type {
  AuthorizationPolicyEvaluator,
  ActorAuthorizationContext,
} from './authorization.contracts.js';
import type { AuthorizationPredicate } from '@marib-tax/contracts';
import {
  REQUEST_DRAFT_REPOSITORY,
  type RequestDraftRepository,
} from '../requests/request-draft.repository.js';
import {
  MASTERDATA_REPOSITORY,
  type MasterdataRepository,
} from '../masterdata/masterdata.repository.js';
import {
  TAXPAYER_REGISTRY_REPOSITORY,
  type TaxpayerRegistryRepository,
} from '../registry/taxpayer-registry.repository.js';

interface PolicyRequest {
  method?: string;
  originalUrl?: string;
  params?: { id?: string };
}

@Injectable()
export class MainAuthorizationPolicyEvaluator implements AuthorizationPolicyEvaluator {
  constructor(
    @Inject(REQUEST_DRAFT_REPOSITORY)
    private readonly requestsRepo: RequestDraftRepository,
    @Inject(MASTERDATA_REPOSITORY)
    private readonly masterdataRepo: MasterdataRepository,
    @Inject(TAXPAYER_REGISTRY_REPOSITORY)
    private readonly registryRepo: TaxpayerRegistryRepository,
  ) {}

  async evaluate(
    predicate: AuthorizationPredicate,
    actor: ActorAuthorizationContext,
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PolicyRequest>();
    const id = request.params?.id;
    const url = request.originalUrl?.split('?', 1)[0] ?? '';

    // Handle OWNERSHIP
    if (predicate === 'OWNERSHIP') {
      if (id === undefined) {
        // me endpoints or collection creation
        if (
          url.includes('/me') ||
          (request.method === 'POST' && url === '/api/v1/requests')
        ) {
          return true;
        }
        return false;
      }

      if (!z.uuid().safeParse(id).success) return false;

      // Determine which resource we are checking ownership for based on path
      if (url.includes('/requests/')) {
        const draft = await this.requestsRepo.findById(id);
        return draft !== null && draft.ownerActorId === actor.actorId;
      }

      if (url.includes('/masterdata/activities/')) {
        const activity = await this.masterdataRepo.findActivityById(id);
        return activity !== null && activity.ownerActorId === actor.actorId;
      }

      if (url.includes('/taxpayers/')) {
        const taxpayer = await this.registryRepo.findTaxpayerById(id);
        return taxpayer !== null && taxpayer.ownerActorId === actor.actorId;
      }

      return false;
    }

    // Handle RESOURCE_STATE (e.g. request must be in draft status)
    if (predicate === 'RESOURCE_STATE') {
      if (id === undefined || !z.uuid().safeParse(id).success) return false;
      if (url.includes('/requests/')) {
        const draft = await this.requestsRepo.findById(id);
        return draft !== null && draft.status === 'draft';
      }
      return false;
    }

    // Default reject for other predicates
    return false;
  }
}
