import { describe, expect, it } from 'vitest';
import {
  activityAddressSummarySchema,
  masterdataReportFieldKeys,
  ownedMasterdataBundleSchema,
} from '../src/masterdata.js';

describe('masterdata contracts', () => {
  it('rejects addresses that reference neither activity nor branch', () => {
    expect(() =>
      activityAddressSummarySchema.parse({
        id: '11111111-1111-4111-8111-111111111111',
        commercialActivityId: null,
        branchId: null,
        addressLine: 'شارع تجريبي',
        districtCode: 'D-1',
        effectiveFrom: '2026-01-01T00:00:00.000Z',
        effectiveTo: null,
      }),
    ).toThrow();
  });

  it('validates an owned masterdata bundle', () => {
    const activityId = '11111111-1111-4111-8111-111111111111';
    const taxpayerId = '22222222-2222-4222-8222-222222222222';
    const propertyId = '33333333-3333-4333-8333-333333333333';
    const parsed = ownedMasterdataBundleSchema.parse({
      activities: [
        {
          id: activityId,
          publicRef: 'A-1',
          taxpayerId,
          name: 'نشاط تجريبي',
          statusCode: 'active',
        },
      ],
      branches: [],
      addresses: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          commercialActivityId: activityId,
          branchId: null,
          addressLine: 'شارع تجريبي',
          districtCode: 'D-1',
          effectiveFrom: '2026-01-01T00:00:00.000Z',
          effectiveTo: null,
        },
      ],
      properties: [
        {
          id: propertyId,
          publicRef: 'P-1',
          statusCode: 'active',
          description: 'عقار تجريبي',
        },
      ],
      ownershipRecords: [
        {
          id: '55555555-5555-4555-8555-555555555555',
          propertyId,
          taxpayerId,
          partyRoleCode: 'owner',
          isCurrent: true,
          effectiveFrom: '2026-01-01T00:00:00.000Z',
          effectiveTo: null,
        },
      ],
    });
    expect(parsed.activities).toHaveLength(1);
    expect(parsed.ownershipRecords[0]?.isCurrent).toBe(true);
  });

  it('binds masterdata report field keys for reports 8 and 13–14', () => {
    expect(masterdataReportFieldKeys).toEqual(
      expect.arrayContaining([
        'activity_id',
        'taxpayer_id',
        'status_code',
        'tax_number_value',
      ]),
    );
  });
});
