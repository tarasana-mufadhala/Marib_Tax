import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  maskTaxNumberValue,
  type OwnedTaxpayerBundle,
  type TaxpayerProfileResponse,
} from '@marib-tax/contracts';
import {
  TAXPAYER_REGISTRY_REPOSITORY,
  type TaxpayerRegistryRepository,
} from './taxpayer-registry.repository.js';

@Injectable()
export class TaxpayerRegistryService {
  constructor(
    @Inject(TAXPAYER_REGISTRY_REPOSITORY)
    private readonly repository: TaxpayerRegistryRepository,
  ) {}

  async readOwnedBundle(actorId: string): Promise<OwnedTaxpayerBundle> {
    const taxpayer = await this.repository.findOwnedByActor(actorId);
    if (taxpayer === null) throw new NotFoundException();
    return this.bundleFor(taxpayer);
  }

  async readOwnedTaxpayerById(
    actorId: string,
    taxpayerId: string,
  ): Promise<TaxpayerProfileResponse> {
    const taxpayer = await this.owned(actorId, taxpayerId);
    return toTaxpayerResponse(taxpayer);
  }

  private async owned(
    actorId: string,
    taxpayerId: string,
  ): Promise<
    NonNullable<
      Awaited<ReturnType<TaxpayerRegistryRepository['findTaxpayerById']>>
    >
  > {
    const taxpayer = await this.repository.findTaxpayerById(taxpayerId);
    if (taxpayer === null) throw new NotFoundException();
    if (taxpayer.ownerActorId !== actorId) throw new ForbiddenException();
    return taxpayer;
  }

  private async bundleFor(
    taxpayer: Awaited<
      ReturnType<TaxpayerRegistryRepository['findOwnedByActor']>
    >,
  ): Promise<OwnedTaxpayerBundle> {
    if (taxpayer === null) throw new NotFoundException();
    const [legalEntities, taxNumbers] = await Promise.all([
      this.repository.listLegalEntitiesForTaxpayer(taxpayer.id),
      this.repository.listTaxNumbersForTaxpayer(taxpayer.id),
    ]);
    return {
      taxpayer: toTaxpayerResponse(taxpayer),
      legalEntities: legalEntities.map((entity) => ({
        id: entity.id,
        publicRef: entity.publicRef,
        legalName: entity.legalName,
        classificationCode: entity.classificationCode,
        isActive: entity.isActive,
        associationTypeCode: entity.associationTypeCode,
      })),
      taxNumbers: taxNumbers.map((number) => ({
        id: number.id,
        taxNumberValueMasked:
          number.taxNumberValueMasked ||
          maskTaxNumberValue(number.taxNumberValue),
        statusCode: number.statusCode,
        legalEntityId: number.legalEntityId,
        issuedAt: number.issuedAt,
      })),
    };
  }
}

function toTaxpayerResponse(
  taxpayer: NonNullable<
    Awaited<ReturnType<TaxpayerRegistryRepository['findOwnedByActor']>>
  >,
): TaxpayerProfileResponse {
  return {
    id: taxpayer.id,
    publicRef: taxpayer.publicRef,
    displayName: taxpayer.displayName,
    statusCode: taxpayer.statusCode,
    hasTaxNumber: taxpayer.hasTaxNumber,
    activeLegalEntityCount: taxpayer.activeLegalEntityCount,
    openDuesFlag: taxpayer.openDuesFlag,
  };
}
