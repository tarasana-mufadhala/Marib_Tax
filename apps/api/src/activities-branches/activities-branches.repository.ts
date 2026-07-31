export interface StoredCommercialActivity {
  id: string;
  publicRef: string | null;
  taxpayerId: string;
  name: string;
  statusCode: string;
  createdAt: Date;
  createdByProfileId: string | null;
}

export interface StoredBranch {
  id: string;
  publicRef: string | null;
  commercialActivityId: string;
  name: string;
  statusCode: string;
  createdAt: Date;
  createdByProfileId: string | null;
}

export interface StoredActivityAddress {
  id: string;
  commercialActivityId: string | null;
  branchId: string | null;
  addressLine: string | null;
  cityCode: string | null;
  districtCode: string | null;
  geoPayload: string | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

export const ACTIVITIES_BRANCHES_REPOSITORY = Symbol(
  'ACTIVITIES_BRANCHES_REPOSITORY',
);

export interface ActivitiesBranchesRepository {
  findActivityById(id: string): Promise<StoredCommercialActivity | null>;
  findBranchById(id: string): Promise<StoredBranch | null>;
  findActivitiesByTaxpayerId(
    taxpayerId: string,
  ): Promise<StoredCommercialActivity[]>;
  findBranchesByActivityId(activityId: string): Promise<StoredBranch[]>;
  createActivity(
    activity: StoredCommercialActivity,
  ): Promise<StoredCommercialActivity>;
  createBranch(branch: StoredBranch): Promise<StoredBranch>;
  createAddress(address: StoredActivityAddress): Promise<StoredActivityAddress>;
  findAddressByBranchId(
    branchId: string,
  ): Promise<StoredActivityAddress | null>;
}
