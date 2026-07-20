import { describe, expect, it } from 'vitest';
import {
  filterMockAttachments,
  mockAttachments,
} from '../src/lib/attachments-mock';

describe('attachment admin mock', () => {
  it('filters by owner, category, classification and date', () => {
    expect(
      filterMockAttachments({
        ownerType: 'طلب',
        category: 'ترخيص',
        classification: 'داخلي',
        from: '2026-07-18',
      }),
    ).toHaveLength(1);
    expect(
      filterMockAttachments({ to: '2026-07-10' }).map((item) => item.id),
    ).toEqual(['ATT-MOCK-1029']);
  });

  it('represents denied, missing and version lineage states without storage details', () => {
    expect(mockAttachments.map((item) => item.availability)).toEqual(
      expect.arrayContaining(['غير مصرح', 'ملف مفقود']),
    );
    expect(
      mockAttachments[0]?.versions.map((version) => version.version),
    ).toEqual([2, 1]);
    expect(JSON.stringify(mockAttachments)).not.toMatch(
      /https?:|storage[_ -]?path|service_role/i,
    );
  });
});
