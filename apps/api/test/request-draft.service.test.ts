import { describe, expect, it } from 'vitest';
import {
  createActivityAddressChangeDraftSchema,
  editActivityAddressChangeDraftSchema,
} from '@marib-tax/contracts';
import { RequestDraftService } from '../src/requests/request-draft.service.js';
import type {
  RequestDraftRepository,
  StoredRequestDraft,
} from '../src/requests/request-draft.repository.js';

class MemoryRepository implements RequestDraftRepository {
  readonly values = new Map<string, StoredRequestDraft>();
  create(value: StoredRequestDraft): Promise<void> {
    this.values.set(value.id, structuredClone(value));
    return Promise.resolve();
  }
  findById(id: string): Promise<StoredRequestDraft | null> {
    return Promise.resolve(structuredClone(this.values.get(id) ?? null));
  }
  save(value: StoredRequestDraft): Promise<void> {
    this.values.set(value.id, structuredClone(value));
    return Promise.resolve();
  }
}

const input = createActivityAddressChangeDraftSchema.parse({
  serviceType: 'activity_address_change',
  schemaVersion: '1.0.0',
  targets: [
    {
      activityId: '00000000-0000-4000-8000-000000000001',
      newAddress: { district: 'Marib', street: '40' },
    },
  ],
});

describe('request draft application service', () => {
  it('creates, reads, and fully replaces targets for the owner', async () => {
    const repository = new MemoryRepository();
    const service = new RequestDraftService(repository);
    const created = await service.create('owner-1', input);
    const edit = editActivityAddressChangeDraftSchema.parse({
      targets: [
        {
          ...input.targets[0],
          newAddress: { ...input.targets[0]!.newAddress, street: '50' },
        },
      ],
    });
    expect(
      (await service.edit('owner-1', created.id, edit)).form.data.targets[0]
        ?.newAddress.street,
    ).toBe('50');
    await expect(service.read('owner-2', created.id)).rejects.toThrow();
  });

  it('submits with an immutable server-authored snapshot and blocks later edits', async () => {
    const repository = new MemoryRepository();
    const service = new RequestDraftService(repository);
    const created = await service.create('owner-1', input);
    const submitted = await service.submit('owner-1', created.id);
    expect(submitted.status).toBe('submitted');
    expect(submitted.submittedAt).toBeDefined();
    const stored = repository.values.get(created.id)!;
    expect(stored.submittedSnapshot?.submittedBy).toBe('owner-1');
    await expect(
      service.edit('owner-1', created.id, { targets: input.targets }),
    ).rejects.toThrow();
  });
});
