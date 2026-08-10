export interface StoredTaxpayer {
  id: string;
  publicRef: string | null;
  displayName: string;
  statusCode: string;
  createdAt: Date;
  createdByProfileId: string | null;
}

export interface StoredTaxpayerContact {
  id: string;
  taxpayerId: string;
  contactTypeCode: string;
  contactValue: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface StoredTaxpayerAccountLink {
  id: string;
  publicRef: string | null;
  userProfileId: string;
  taxpayerId: string;
  relationshipTypeCode: string;
  activeStateCode: string;
  verificationStatusCode: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

export const TAXPAYER_REPOSITORY = Symbol('TAXPAYER_REPOSITORY');

export interface TaxpayerRepository {
  findById(id: string): Promise<StoredTaxpayer | null>;
  search(query: string): Promise<StoredTaxpayer[]>;
  list(limit: number): Promise<StoredTaxpayer[]>;
  findActiveLinkByProfileId(
    userProfileId: string,
  ): Promise<StoredTaxpayerAccountLink | null>;
  createLink(
    link: StoredTaxpayerAccountLink,
    actorProfileId: string,
  ): Promise<StoredTaxpayerAccountLink>;
  createTaxpayer(taxpayer: StoredTaxpayer): Promise<StoredTaxpayer>;
}
