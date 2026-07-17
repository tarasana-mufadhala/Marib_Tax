import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ActivityAddressChangeRequestResponse,
  CreateActivityAddressChangeDraft,
  EditActivityAddressChangeDraft,
} from '@marib-tax/contracts';
import type {
  RequestDraftRepository,
  StoredRequestDraft,
} from './request-draft.repository.js';

@Injectable()
export class RequestDraftService {
  constructor(private readonly repository: RequestDraftRepository) {}

  async create(
    ownerActorId: string,
    input: CreateActivityAddressChangeDraft,
  ): Promise<ActivityAddressChangeRequestResponse> {
    const now = new Date().toISOString();
    const draft: StoredRequestDraft = {
      id: randomUUID(),
      ownerActorId,
      status: 'draft',
      form: {
        serviceType: input.serviceType,
        schemaVersion: input.schemaVersion,
        data: { targets: structuredClone(input.targets) },
      },
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.create(draft);
    return toResponse(draft);
  }

  async read(
    ownerActorId: string,
    id: string,
  ): Promise<ActivityAddressChangeRequestResponse> {
    return toResponse(await this.owned(ownerActorId, id));
  }

  async edit(
    ownerActorId: string,
    id: string,
    input: EditActivityAddressChangeDraft,
  ): Promise<ActivityAddressChangeRequestResponse> {
    const draft = await this.owned(ownerActorId, id);
    if (draft.status !== 'draft') throw new ConflictException();
    draft.form.data.targets = structuredClone(input.targets);
    draft.updatedAt = new Date().toISOString();
    await this.repository.save(draft);
    return toResponse(draft);
  }

  async submit(
    ownerActorId: string,
    id: string,
  ): Promise<ActivityAddressChangeRequestResponse> {
    const draft = await this.owned(ownerActorId, id);
    if (draft.status !== 'draft') throw new ConflictException();
    const submittedAt = new Date().toISOString();
    draft.status = 'submitted';
    draft.submittedAt = submittedAt;
    draft.updatedAt = submittedAt;
    draft.submittedSnapshot = Object.freeze({
      serviceType: draft.form.serviceType,
      schemaVersion: draft.form.schemaVersion,
      targets: structuredClone(draft.form.data.targets),
      submittedAt,
      submittedBy: ownerActorId,
    });
    await this.repository.save(draft);
    return toResponse(draft);
  }

  private async owned(
    actorId: string,
    id: string,
  ): Promise<StoredRequestDraft> {
    const draft = await this.repository.findById(id);
    if (draft === null) throw new NotFoundException();
    if (draft.ownerActorId !== actorId) throw new ForbiddenException();
    return draft;
  }
}

function toResponse(
  draft: StoredRequestDraft,
): ActivityAddressChangeRequestResponse {
  const response: ActivityAddressChangeRequestResponse = {
    id: draft.id,
    status: draft.status,
    form: structuredClone(draft.form),
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    ...(draft.submittedAt === undefined
      ? {}
      : { submittedAt: draft.submittedAt }),
  };
  return response;
}
