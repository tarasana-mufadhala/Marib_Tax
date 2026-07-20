import '../domain/attachment_models.dart';

abstract interface class AttachmentRepository {
  Future<List<AttachmentSummary>> listAttachments();
  Future<void> retrySync();
}

class MockAttachmentRepository implements AttachmentRepository {
  const MockAttachmentRepository();

  @override
  Future<List<AttachmentSummary>> listAttachments() async => const [
    AttachmentSummary(
      id: 'mock-attachment-1',
      name: 'السجل التجاري.pdf',
      category: AttachmentCategory.taxDocument,
      classification: AttachmentClassification.private,
      availability: AttachmentAvailability.available,
      versions: [
        AttachmentVersion(number: 2, createdLabel: 'اليوم', note: 'نسخة مصححة'),
        AttachmentVersion(
          number: 1,
          createdLabel: '12 يوليو',
          note: 'النسخة الأولى',
        ),
      ],
    ),
    AttachmentSummary(
      id: 'mock-attachment-2',
      name: 'مرفق غير متاح',
      category: AttachmentCategory.supportingDocument,
      classification: AttachmentClassification.sensitive,
      availability: AttachmentAvailability.denied,
      versions: [],
    ),
  ];

  @override
  Future<void> retrySync() async {}
}
