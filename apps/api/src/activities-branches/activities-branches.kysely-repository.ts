import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  ActivitiesBranchesRepository,
  StoredCommercialActivity,
  StoredBranch,
  StoredActivityAddress,
} from './activities-branches.repository.js';

@Injectable()
export class ActivitiesBranchesKyselyRepository implements ActivitiesBranchesRepository {
  private readonly memoryActivities = new Map<
    string,
    StoredCommercialActivity
  >();
  private readonly memoryBranches = new Map<string, StoredBranch>();
  private readonly memoryAddresses = new Map<string, StoredActivityAddress>();

  constructor(private readonly dbService: DatabaseService) {}

  async findActivityById(id: string): Promise<StoredCommercialActivity | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('masterdata.commercial_activities')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        publicRef: row.public_ref,
        taxpayerId: row.taxpayer_id,
        name: row.name,
        statusCode: row.status_code,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
      };
    }
    return this.memoryActivities.get(id) ?? null;
  }

  async findBranchById(id: string): Promise<StoredBranch | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('masterdata.branches')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        publicRef: row.public_ref,
        commercialActivityId: row.commercial_activity_id,
        name: row.name,
        statusCode: row.status_code,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
      };
    }
    return this.memoryBranches.get(id) ?? null;
  }

  async findActivitiesByTaxpayerId(
    taxpayerId: string,
  ): Promise<StoredCommercialActivity[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('masterdata.commercial_activities')
        .selectAll()
        .where('taxpayer_id', '=', taxpayerId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        publicRef: row.public_ref,
        taxpayerId: row.taxpayer_id,
        name: row.name,
        statusCode: row.status_code,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
      }));
    }
    return [...this.memoryActivities.values()].filter(
      (a) => a.taxpayerId === taxpayerId,
    );
  }

  async findBranchesByActivityId(activityId: string): Promise<StoredBranch[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('masterdata.branches')
        .selectAll()
        .where('commercial_activity_id', '=', activityId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        publicRef: row.public_ref,
        commercialActivityId: row.commercial_activity_id,
        name: row.name,
        statusCode: row.status_code,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
      }));
    }
    return [...this.memoryBranches.values()].filter(
      (b) => b.commercialActivityId === activityId,
    );
  }

  async createActivity(
    activity: StoredCommercialActivity,
  ): Promise<StoredCommercialActivity> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('masterdata.commercial_activities')
        .values({
          id: activity.id,
          public_ref: activity.publicRef,
          taxpayer_id: activity.taxpayerId,
          name: activity.name,
          status_code: activity.statusCode,
          created_by_profile_id: activity.createdByProfileId,
        })
        .execute();
      return activity;
    }
    this.memoryActivities.set(activity.id, activity);
    return activity;
  }

  async createBranch(branch: StoredBranch): Promise<StoredBranch> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('masterdata.branches')
        .values({
          id: branch.id,
          public_ref: branch.publicRef,
          commercial_activity_id: branch.commercialActivityId,
          name: branch.name,
          status_code: branch.statusCode,
          created_by_profile_id: branch.createdByProfileId,
        })
        .execute();
      return branch;
    }
    this.memoryBranches.set(branch.id, branch);
    return branch;
  }

  async createAddress(
    address: StoredActivityAddress,
  ): Promise<StoredActivityAddress> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('masterdata.activity_addresses')
        .values({
          id: address.id,
          commercial_activity_id: address.commercialActivityId,
          branch_id: address.branchId,
          address_line: address.addressLine,
          city_code: address.cityCode,
          district_code: address.districtCode,
          geo_payload: address.geoPayload,
          effective_from: address.effectiveFrom,
          effective_to: address.effectiveTo,
        })
        .execute();
      return address;
    }
    this.memoryAddresses.set(address.id, address);
    return address;
  }

  async findAddressByBranchId(
    branchId: string,
  ): Promise<StoredActivityAddress | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('masterdata.activity_addresses')
        .selectAll()
        .where('branch_id', '=', branchId)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        commercialActivityId: row.commercial_activity_id,
        branchId: row.branch_id,
        addressLine: row.address_line,
        cityCode: row.city_code,
        districtCode: row.district_code,
        geoPayload: row.geo_payload,
        effectiveFrom: row.effective_from,
        effectiveTo: row.effective_to,
      };
    }
    return (
      [...this.memoryAddresses.values()].find((a) => a.branchId === branchId) ??
      null
    );
  }
}
