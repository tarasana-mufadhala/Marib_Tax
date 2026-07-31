import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  ServicesVersionsRepository,
  StoredServiceType,
} from './services-versions.repository.js';

@Injectable()
export class ServicesVersionsKyselyRepository implements ServicesVersionsRepository {
  private readonly memoryServiceTypes = new Map<string, StoredServiceType>();

  constructor(private readonly dbService: DatabaseService) {}

  async findById(id: string): Promise<StoredServiceType | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('requests.service_types')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        isActive: row.is_active,
        versionLabel: row.version_label,
      };
    }
    return this.memoryServiceTypes.get(id) ?? null;
  }

  async findByCode(code: string): Promise<StoredServiceType | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('requests.service_types')
        .selectAll()
        .where('code', '=', code)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        isActive: row.is_active,
        versionLabel: row.version_label,
      };
    }
    return (
      [...this.memoryServiceTypes.values()].find((st) => st.code === code) ??
      null
    );
  }

  async listActive(): Promise<StoredServiceType[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('requests.service_types')
        .selectAll()
        .where('is_active', '=', true)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        isActive: row.is_active,
        versionLabel: row.version_label,
      }));
    }
    return [...this.memoryServiceTypes.values()].filter((st) => st.isActive);
  }

  async createServiceType(
    serviceType: StoredServiceType,
    actorProfileId: string,
  ): Promise<StoredServiceType> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('requests.service_types')
        .values({
          id: serviceType.id,
          code: serviceType.code,
          name: serviceType.name,
          description: serviceType.description,
          is_active: serviceType.isActive,
          version_label: serviceType.versionLabel,
          created_by_profile_id: actorProfileId,
        })
        .execute();
      return serviceType;
    }
    this.memoryServiceTypes.set(serviceType.id, serviceType);
    return serviceType;
  }
}
