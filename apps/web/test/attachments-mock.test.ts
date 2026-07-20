import { describe, expect, it } from 'vitest';
import {
  attachmentFilterOptions,
  attachmentArchiveStateLabels,
  filterMockAttachments,
  mockAttachments,
} from '../src/lib/attachments-mock';

describe('attachment admin mock', () => {
  it('covers the complete canonical retention vocabulary', () => {
    expect(Object.keys(attachmentArchiveStateLabels)).toEqual([
      'active',
      'archived',
      'legal_hold',
      'permanent_operational_archive',
    ]);
  });

  it('filters by owner, category, classification and date', () => {
    expect(
      filterMockAttachments({
        ownerType: 'طلب',
        documentCategoryCode: 'license',
        classification: 'internal',
        from: '2026-07-18',
      }),
    ).toHaveLength(1);
    expect(
      filterMockAttachments({ to: '2026-07-10' }).map((item) => item.id),
    ).toEqual(['ATT-MOCK-1029']);
  });

  it('uses only canonical classification and document category codes', () => {
    expect(mockAttachments.map((item) => item.classification)).toEqual(
      expect.arrayContaining(['internal', 'confidential', 'highly_sensitive']),
    );
    expect(mockAttachments.map((item) => item.classification)).not.toContain(
      'public',
    );
    expect(mockAttachments.every((item) => item.documentCategoryCode)).toBe(
      true,
    );
    expect(attachmentFilterOptions.documentCategories).toEqual([
      'all',
      'identity_document',
      'tax_document',
      'financial_evidence',
      'correspondence',
      'license',
      'supporting_document',
    ]);
    expect(JSON.stringify(mockAttachments)).not.toMatch(
      /storageAccountingCategoryCode/,
    );
  });

  it('represents denied, missing and version lineage states without storage details', () => {
    expect(mockAttachments.map((item) => item.availability)).toEqual(
      expect.arrayContaining(['غير مصرح', 'ملف مفقود']),
    );
    expect(
      mockAttachments[0]?.versions.map((version) => version.version),
    ).toEqual([2, 1]);
    expect(mockAttachments.map((item) => item.archiveState)).toEqual(
      expect.arrayContaining(['active', 'archived', 'legal_hold']),
    );
    expect(attachmentArchiveStateLabels.legal_hold).toBe('قيد الحفظ القانوني');
    expect(JSON.stringify(mockAttachments)).not.toMatch(
      /https?:|storage[_ -]?path|service_role/i,
    );
  });
});
