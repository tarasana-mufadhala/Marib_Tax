import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../http/domain-exception.js';
import type {
  BalaghResponse,
  BalaghType,
  CreateBalaghDraft,
  EditBalaghDraft,
} from '@marib-tax/contracts';
import {
  BALAGH_REPOSITORY,
  type BalaghListItem,
  type BalaghRepository,
  type StoredBalagh,
} from './balagh.repository.js';

/**
 * أنواع البلاغات التي يتبعها نزول ميداني (القسم 4.4).
 * FR-206 «تفعيل نشاط موقوف» وحده يُعالَج داخلياً بلا نزول.
 */
const FIELD_VISIT_TYPES = new Set<BalaghType>([
  'FR-201',
  'FR-202',
  'FR-203',
  'FR-204',
  'FR-205',
]);

export function requiresFieldVisit(type: BalaghType): boolean {
  return FIELD_VISIT_TYPES.has(type);
}

@Injectable()
export class BalaghService {
  constructor(
    @Inject(BALAGH_REPOSITORY)
    private readonly repository: BalaghRepository,
  ) {}

  async create(
    ownerActorId: string,
    input: CreateBalaghDraft,
  ): Promise<BalaghResponse> {
    const now = new Date().toISOString();
    const balagh: StoredBalagh = {
      id: randomUUID(),
      publicRef: null,
      status: 'draft',
      balaghType: input.balaghType,
      schemaVersion: input.schemaVersion,
      formData: structuredClone(input.formData),
      ownerActorId,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
    };
    await this.repository.create(balagh);
    // نعيد القراءة لالتقاط المرجع العلني الذي يولّده المستودع.
    return toResponse((await this.repository.findById(balagh.id)) ?? balagh);
  }

  async read(ownerActorId: string, id: string): Promise<BalaghResponse> {
    return toResponse(await this.owned(ownerActorId, id));
  }

  list(ownerActorId: string | undefined, limit = 50): Promise<BalaghListItem[]> {
    return this.repository.list(ownerActorId, Math.min(Math.max(limit, 1), 200));
  }

  async edit(
    ownerActorId: string,
    id: string,
    input: EditBalaghDraft,
  ): Promise<BalaghResponse> {
    const balagh = await this.owned(ownerActorId, id);
    if (balagh.status !== 'draft') {
      throw DomainException.conflict('لا يمكن تعديل بلاغ بعد تقديمه');
    }
    balagh.formData = structuredClone(input.formData);
    balagh.updatedAt = new Date().toISOString();
    await this.repository.save(balagh);
    return toResponse(balagh);
  }

  async submit(ownerActorId: string, id: string): Promise<BalaghResponse> {
    const balagh = await this.owned(ownerActorId, id);
    if (balagh.status !== 'draft') {
      throw DomainException.conflict('هذا البلاغ مُقدَّم مسبقاً');
    }
    const submittedAt = new Date().toISOString();
    balagh.status = 'submitted';
    balagh.submittedAt = submittedAt;
    balagh.updatedAt = submittedAt;
    await this.repository.save(balagh);
    return toResponse(balagh);
  }

  private async owned(actorId: string, id: string): Promise<StoredBalagh> {
    const balagh = await this.repository.findById(id);
    if (balagh === null) throw DomainException.notFound('البلاغ غير موجود');
    if (balagh.ownerActorId !== actorId) {
      throw DomainException.forbidden('لا تملك صلاحية الوصول لهذا البلاغ');
    }
    return balagh;
  }
}

function toResponse(balagh: StoredBalagh): BalaghResponse {
  return {
    id: balagh.id,
    publicRef: balagh.publicRef,
    status: balagh.status,
    balaghType: balagh.balaghType,
    schemaVersion: balagh.schemaVersion,
    formData: structuredClone(balagh.formData),
    ownerActorId: balagh.ownerActorId,
    createdAt: balagh.createdAt,
    updatedAt: balagh.updatedAt,
    submittedAt: balagh.submittedAt ?? null,
  };
}
