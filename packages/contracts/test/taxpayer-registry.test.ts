import { describe, expect, it } from 'vitest';
import {
  maskTaxNumberValue,
  ownedTaxpayerBundleSchema,
  registryReportFieldKeys,
  taxNumberValueSchema,
} from '../src/taxpayer-registry.js';

describe('taxpayer registry contracts', () => {
  it('accepts digits-only tax numbers and preserves leading zeros', () => {
    expect(taxNumberValueSchema.parse('0123')).toBe('0123');
  });

  it('masks tax numbers for report.view style responses', () => {
    expect(maskTaxNumberValue('0123456789')).toBe('******6789');
  });

  it('validates an owned taxpayer bundle', () => {
    const parsed = ownedTaxpayerBundleSchema.parse({
      taxpayer: {
        id: '11111111-1111-4111-8111-111111111111',
        publicRef: 'T-1',
        displayName: 'مكلف',
        statusCode: 'active',
        hasTaxNumber: true,
        activeLegalEntityCount: 1,
        openDuesFlag: false,
      },
      legalEntities: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          publicRef: null,
          legalName: 'كيان',
          classificationCode: 'company',
          isActive: true,
          associationTypeCode: 'primary',
        },
      ],
      taxNumbers: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          taxNumberValueMasked: '******6789',
          statusCode: 'issued',
          legalEntityId: '22222222-2222-4222-8222-222222222222',
          issuedAt: null,
        },
      ],
    });
    expect(parsed.taxpayer.hasTaxNumber).toBe(true);
  });

  it('binds registry report field keys for reports 12–15', () => {
    expect(registryReportFieldKeys.length).toBeGreaterThanOrEqual(10);
    expect(registryReportFieldKeys).toContain('tax_number_value');
  });
});
