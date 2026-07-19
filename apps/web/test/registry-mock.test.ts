import { describe, expect, it } from 'vitest';
import { mockOwnedTaxpayerBundle } from '../src/lib/registry-mock';

describe('registry mock data', () => {
  it('exposes masked tax numbers and report field keys without secrets', () => {
    expect(mockOwnedTaxpayerBundle.taxNumbers[0]?.taxNumberValueMasked).toBe(
      '******6789',
    );
    expect(mockOwnedTaxpayerBundle.reportFieldKeys).toContain(
      'tax_number_value',
    );
    expect(JSON.stringify(mockOwnedTaxpayerBundle)).not.toMatch(/service_role/i);
  });
});
