import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  SERVICES_VERSIONS_REPOSITORY,
  type ServicesVersionsRepository,
  type StoredServiceType,
} from './services-versions.repository.js';

@Injectable()
export class ServicesVersionsService {
  constructor(
    @Inject(SERVICES_VERSIONS_REPOSITORY)
    private readonly repository: ServicesVersionsRepository,
  ) {}

  async getServiceType(id: string): Promise<StoredServiceType> {
    const serviceType = await this.repository.findById(id);
    if (!serviceType) {
      throw new NotFoundException('Service type record not found.');
    }
    return serviceType;
  }

  async getServiceTypeByCode(code: string): Promise<StoredServiceType> {
    const serviceType = await this.repository.findByCode(code);
    if (!serviceType) {
      throw new NotFoundException(
        `Service type with code '${code}' not found.`,
      );
    }
    return serviceType;
  }

  async listActiveServices(): Promise<StoredServiceType[]> {
    return this.repository.listActive();
  }

  async registerServiceType(
    input: {
      code: string;
      name: string;
      description?: string | null;
      versionLabel?: string | null;
    },
    actorProfileId: string,
  ): Promise<StoredServiceType> {
    if (!input.code || input.code.trim() === '') {
      throw new BadRequestException('Service type code cannot be empty.');
    }
    if (!input.name || input.name.trim() === '') {
      throw new BadRequestException('Service type name cannot be empty.');
    }

    const existing = await this.repository.findByCode(input.code.trim());
    if (existing) {
      throw new ConflictException(
        `Service type with code '${input.code}' already exists.`,
      );
    }

    const serviceType: StoredServiceType = {
      id: randomUUID(),
      code: input.code.trim(),
      name: input.name.trim(),
      description: input.description ?? null,
      isActive: true,
      versionLabel: input.versionLabel ?? null,
    };

    return this.repository.createServiceType(serviceType, actorProfileId);
  }
}
