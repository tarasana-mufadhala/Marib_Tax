import { describe, expect, it } from 'vitest';
import { mockOwnedMasterdataBundle } from '../src/lib/masterdata-mock';

describe('masterdata mock data', () => {
  it('exposes owned activity/property fields without secrets', () => {
    expect(mockOwnedMasterdataBundle.activities[0]?.name).toBe('نشاط تجريبي');
    expect(mockOwnedMasterdataBundle.ownershipRecords[0]?.isCurrent).toBe(true);
    expect(mockOwnedMasterdataBundle.reportFieldKeys).toContain('activity_id');
    expect(JSON.stringify(mockOwnedMasterdataBundle)).not.toMatch(
      /service_role/i,
    );
  });
});
