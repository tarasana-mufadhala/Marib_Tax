import { describe, expect, it } from 'vitest';
import {
  createActivityAddressChangeDraftSchema,
  editActivityAddressChangeDraftSchema,
} from '../src/request-draft.js';

const valid = {
  serviceType: 'activity_address_change',
  schemaVersion: '1.0.0',
  targets: [
    {
      activityId: '00000000-0000-4000-8000-000000000001',
      branchId: null,
      newAddress: { district: ' مأرب ', street: ' الأربعين ' },
    },
  ],
};

describe('activity address change draft contract', () => {
  it('normalizes a valid draft and absent optionals to null', () => {
    const value = createActivityAddressChangeDraftSchema.parse(valid);
    expect(value.targets[0]?.newAddress).toMatchObject({
      district: 'مأرب',
      street: 'الأربعين',
      neighborhood: null,
      buildingNumber: null,
      nearbyLandmark: null,
    });
  });

  it.each([
    ['empty targets', { ...valid, targets: [] }],
    [
      'empty district',
      {
        ...valid,
        targets: [
          { ...valid.targets[0], newAddress: { district: ' ', street: 'x' } },
        ],
      },
    ],
    [
      'invalid uuid',
      { ...valid, targets: [{ ...valid.targets[0], activityId: 'bad' }] },
    ],
    ['unknown version', { ...valid, schemaVersion: '2.0.0' }],
    ['move date', { ...valid, moveDate: '2026-01-01' }],
    ['trade name', { ...valid, tradeName: 'x' }],
    ['activity type', { ...valid, activityType: 'x' }],
  ])('rejects %s', (_name, input) =>
    expect(() => createActivityAddressChangeDraftSchema.parse(input)).toThrow(),
  );

  it('rejects duplicate activity and branch targets', () => {
    expect(() =>
      createActivityAddressChangeDraftSchema.parse({
        ...valid,
        targets: [valid.targets[0], valid.targets[0]],
      }),
    ).toThrow();
  });

  it('does not permit service type or schema version edits', () => {
    expect(() =>
      editActivityAddressChangeDraftSchema.parse({
        targets: valid.targets,
        schemaVersion: '1.0.0',
      }),
    ).toThrow();
  });
});
