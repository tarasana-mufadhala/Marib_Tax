export interface MockTaxpayerProfile {
  id: string;
  publicRef: string | null;
  displayName: string;
  statusCode: string;
  hasTaxNumber: boolean;
  activeLegalEntityCount: number;
  openDuesFlag: boolean;
}

export interface MockTaxNumber {
  id: string;
  taxNumberValueMasked: string;
  statusCode: 'issued' | 'invalid' | 'replaced';
  legalEntityId: string;
}

/** Static mock only — never fetched from production. */
export const mockOwnedTaxpayerBundle = {
  taxpayer: {
    id: '11111111-1111-4111-8111-111111111111',
    publicRef: 'MOCK-T-1',
    displayName: 'مكلف تجريبي',
    statusCode: 'active',
    hasTaxNumber: true,
    activeLegalEntityCount: 1,
    openDuesFlag: false,
  } satisfies MockTaxpayerProfile,
  taxNumbers: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      taxNumberValueMasked: '******6789',
      statusCode: 'issued',
      legalEntityId: '22222222-2222-4222-8222-222222222222',
    },
  ] satisfies MockTaxNumber[],
  /** DM-16 matrix keys this mock can illustrate for reports 12–15. */
  reportFieldKeys: [
    'taxpayer_id',
    'has_tax_number',
    'tax_number_value',
    'legal_entity_id',
    'open_dues_flag',
    'status_code',
  ] as const,
};
