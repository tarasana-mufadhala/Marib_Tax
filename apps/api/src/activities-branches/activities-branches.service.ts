import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ACTIVITIES_BRANCHES_REPOSITORY,
  type ActivitiesBranchesRepository,
  type StoredCommercialActivity,
  type StoredBranch,
  type StoredActivityAddress,
} from './activities-branches.repository.js';

@Injectable()
export class ActivitiesBranchesService {
  constructor(
    @Inject(ACTIVITIES_BRANCHES_REPOSITORY)
    private readonly repository: ActivitiesBranchesRepository,
  ) {}

  async getActivity(id: string): Promise<StoredCommercialActivity> {
    const activity = await this.repository.findActivityById(id);
    if (!activity) {
      throw new NotFoundException('Commercial activity record not found.');
    }
    return activity;
  }

  async getBranch(id: string): Promise<StoredBranch> {
    const branch = await this.repository.findBranchById(id);
    if (!branch) {
      throw new NotFoundException('Branch record not found.');
    }
    return branch;
  }

  async listActivitiesForTaxpayer(
    taxpayerId: string,
  ): Promise<StoredCommercialActivity[]> {
    return this.repository.findActivitiesByTaxpayerId(taxpayerId);
  }

  async listBranchesForActivity(activityId: string): Promise<StoredBranch[]> {
    return this.repository.findBranchesByActivityId(activityId);
  }

  async createActivity(
    input: {
      taxpayerId: string;
      name: string;
      statusCode: string;
    },
    actorProfileId: string,
  ): Promise<StoredCommercialActivity> {
    if (!input.name || input.name.trim() === '') {
      throw new BadRequestException('Activity name cannot be empty.');
    }

    const activity: StoredCommercialActivity = {
      id: randomUUID(),
      publicRef: `ACT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      taxpayerId: input.taxpayerId,
      name: input.name.trim(),
      statusCode: input.statusCode,
      createdAt: new Date(),
      createdByProfileId: actorProfileId,
    };

    return this.repository.createActivity(activity);
  }

  async createBranch(
    input: {
      commercialActivityId: string;
      name: string;
      statusCode: string;
    },
    actorProfileId: string,
  ): Promise<StoredBranch> {
    const activity = await this.repository.findActivityById(
      input.commercialActivityId,
    );
    if (!activity) {
      throw new NotFoundException('Parent commercial activity not found.');
    }

    const branch: StoredBranch = {
      id: randomUUID(),
      publicRef: `BRN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      commercialActivityId: input.commercialActivityId,
      name: input.name.trim(),
      statusCode: input.statusCode,
      createdAt: new Date(),
      createdByProfileId: actorProfileId,
    };

    return this.repository.createBranch(branch);
  }

  async createAddress(input: {
    commercialActivityId?: string | null;
    branchId?: string | null;
    addressLine: string;
    cityCode: string;
    districtCode: string;
    geoPayload?: string | null;
  }): Promise<StoredActivityAddress> {
    if (!input.addressLine || input.addressLine.trim() === '') {
      throw new BadRequestException('Address line cannot be empty.');
    }

    const address: StoredActivityAddress = {
      id: randomUUID(),
      commercialActivityId: input.commercialActivityId ?? null,
      branchId: input.branchId ?? null,
      addressLine: input.addressLine.trim(),
      cityCode: input.cityCode,
      districtCode: input.districtCode,
      geoPayload: input.geoPayload ?? null,
      effectiveFrom: new Date(),
      effectiveTo: null,
    };

    return this.repository.createAddress(address);
  }

  async getAddressForBranch(branchId: string): Promise<StoredActivityAddress> {
    const address = await this.repository.findAddressByBranchId(branchId);
    if (!address) {
      throw new NotFoundException('Address record for branch not found.');
    }
    return address;
  }
}
