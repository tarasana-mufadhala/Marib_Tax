import type {
  LegalEntitySummary,
  TaxNumberSummary,
  TaxpayerProfileResponse,
} from '@marib-tax/contracts';

export interface StoredTaxpayerRecord extends TaxpayerProfileResponse {
  ownerActorId: string;
  registeredAt: string;
}

export interface StoredLegalEntityLink extends LegalEntitySummary {
  taxpayerId: string;
}

export interface StoredTaxNumberRecord extends TaxNumberSummary {
  taxpayerId: string;
  taxNumberValue: string;
}

export interface TaxpayerRegistryRepository {
  findOwnedByActor(actorId: string): Promise<StoredTaxpayerRecord | null>;
  findTaxpayerById(id: string): Promise<StoredTaxpayerRecord | null>;
  listLegalEntitiesForTaxpayer(
    taxpayerId: string,
  ): Promise<StoredLegalEntityLink[]>;
  listTaxNumbersForTaxpayer(
    taxpayerId: string,
  ): Promise<StoredTaxNumberRecord[]>;
}

export const TAXPAYER_REGISTRY_REPOSITORY = Symbol(
  'TAXPAYER_REGISTRY_REPOSITORY',
);
