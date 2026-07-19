export interface MockCommercialActivity {
  id: string;
  publicRef: string | null;
  taxpayerId: string;
  name: string;
  statusCode: string;
}

export interface MockProperty {
  id: string;
  publicRef: string | null;
  statusCode: string;
  description: string | null;
}

export interface MockOwnership {
  id: string;
  propertyId: string;
  taxpayerId: string;
  partyRoleCode: string;
  isCurrent: boolean;
}

/** Static mock only — never fetched from production. */
export const mockOwnedMasterdataBundle = {
  activities: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      publicRef: 'MOCK-A-1',
      taxpayerId: '22222222-2222-4222-8222-222222222222',
      name: 'نشاط تجريبي',
      statusCode: 'active',
    },
  ] satisfies MockCommercialActivity[],
  properties: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      publicRef: 'MOCK-P-1',
      statusCode: 'active',
      description: 'عقار تجريبي',
    },
  ] satisfies MockProperty[],
  ownershipRecords: [
    {
      id: '55555555-5555-4555-8555-555555555555',
      propertyId: '33333333-3333-4333-8333-333333333333',
      taxpayerId: '22222222-2222-4222-8222-222222222222',
      partyRoleCode: 'owner',
      isCurrent: true,
    },
  ] satisfies MockOwnership[],
  /** DM-16 matrix keys this mock can illustrate for reports 8, 13–14. */
  reportFieldKeys: [
    'activity_id',
    'status_code',
    'taxpayer_id',
    'area_code',
    'address_changed_flag',
  ] as const,
};
