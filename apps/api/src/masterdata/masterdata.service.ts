import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CommercialActivitySummary,
  OwnedMasterdataBundle,
} from '@marib-tax/contracts';
import {
  MASTERDATA_REPOSITORY,
  type MasterdataRepository,
  type StoredCommercialActivity,
} from './masterdata.repository.js';

@Injectable()
export class MasterdataService {
  constructor(
    @Inject(MASTERDATA_REPOSITORY)
    private readonly repository: MasterdataRepository,
  ) {}

  async readOwnedBundle(actorId: string): Promise<OwnedMasterdataBundle> {
    const [activities, branches, addresses, properties, ownershipRecords] =
      await Promise.all([
        this.repository.listOwnedActivities(actorId),
        this.repository.listOwnedBranches(actorId),
        this.repository.listOwnedAddresses(actorId),
        this.repository.listOwnedProperties(actorId),
        this.repository.listOwnedOwnershipRecords(actorId),
      ]);

    return {
      activities: activities.map(toActivity),
      branches: branches.map((row) => ({
        id: row.id,
        publicRef: row.publicRef,
        commercialActivityId: row.commercialActivityId,
        name: row.name,
        statusCode: row.statusCode,
      })),
      addresses: addresses.map((row) => ({
        id: row.id,
        commercialActivityId: row.commercialActivityId,
        branchId: row.branchId,
        addressLine: row.addressLine,
        districtCode: row.districtCode,
        effectiveFrom: row.effectiveFrom,
        effectiveTo: row.effectiveTo,
      })),
      properties: properties.map((row) => ({
        id: row.id,
        publicRef: row.publicRef,
        statusCode: row.statusCode,
        description: row.description,
      })),
      ownershipRecords: ownershipRecords.map((row) => ({
        id: row.id,
        propertyId: row.propertyId,
        taxpayerId: row.taxpayerId,
        partyRoleCode: row.partyRoleCode,
        isCurrent: row.isCurrent,
        effectiveFrom: row.effectiveFrom,
        effectiveTo: row.effectiveTo,
      })),
    };
  }

  async readOwnedActivityById(
    actorId: string,
    activityId: string,
  ): Promise<CommercialActivitySummary> {
    const activity = await this.repository.findActivityById(activityId);
    if (activity === null) throw new NotFoundException();
    if (activity.ownerActorId !== actorId) throw new ForbiddenException();
    return toActivity(activity);
  }
}

function toActivity(
  activity: StoredCommercialActivity,
): CommercialActivitySummary {
  return {
    id: activity.id,
    publicRef: activity.publicRef,
    taxpayerId: activity.taxpayerId,
    name: activity.name,
    statusCode: activity.statusCode,
  };
}
