export interface StoredServiceType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  versionLabel: string | null;
}

export const SERVICES_VERSIONS_REPOSITORY = Symbol(
  'SERVICES_VERSIONS_REPOSITORY',
);

export interface ServicesVersionsRepository {
  findById(id: string): Promise<StoredServiceType | null>;
  findByCode(code: string): Promise<StoredServiceType | null>;
  listActive(): Promise<StoredServiceType[]>;
  createServiceType(
    serviceType: StoredServiceType,
    actorProfileId: string,
  ): Promise<StoredServiceType>;
}
