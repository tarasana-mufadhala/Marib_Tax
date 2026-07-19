import type {
  ActivityAddressSummary,
  BranchSummary,
  CommercialActivitySummary,
  PropertyOwnershipSummary,
  PropertySummary,
} from '@marib-tax/contracts';

export interface StoredCommercialActivity extends CommercialActivitySummary {
  ownerActorId: string;
}

export interface StoredBranch extends BranchSummary {
  ownerActorId: string;
}

export interface StoredActivityAddress extends ActivityAddressSummary {
  ownerActorId: string;
}

export interface StoredProperty extends PropertySummary {
  ownerActorId: string;
}

export interface StoredPropertyOwnership extends PropertyOwnershipSummary {
  ownerActorId: string;
}

export interface MasterdataRepository {
  listOwnedActivities(actorId: string): Promise<StoredCommercialActivity[]>;
  listOwnedBranches(actorId: string): Promise<StoredBranch[]>;
  listOwnedAddresses(actorId: string): Promise<StoredActivityAddress[]>;
  listOwnedProperties(actorId: string): Promise<StoredProperty[]>;
  listOwnedOwnershipRecords(
    actorId: string,
  ): Promise<StoredPropertyOwnership[]>;
  findActivityById(id: string): Promise<StoredCommercialActivity | null>;
}

export const MASTERDATA_REPOSITORY = Symbol('MASTERDATA_REPOSITORY');
