import type {
  ActivityAddressChangeRequestResponse,
  ActivityAddressChangeTarget,
} from '@marib-tax/contracts';

export interface StoredRequestDraft extends ActivityAddressChangeRequestResponse {
  ownerActorId: string;
  submittedSnapshot?: Readonly<{
    serviceType: 'activity_address_change';
    schemaVersion: '1.0.0';
    targets: ActivityAddressChangeTarget[];
    submittedAt: string;
    submittedBy: string;
  }>;
}

export interface RequestDraftRepository {
  create(draft: StoredRequestDraft): Promise<void>;
  findById(id: string): Promise<StoredRequestDraft | null>;
  save(draft: StoredRequestDraft): Promise<void>;
}

export const REQUEST_DRAFT_REPOSITORY = Symbol('REQUEST_DRAFT_REPOSITORY');
