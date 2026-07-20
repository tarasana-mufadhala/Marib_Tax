enum AttachmentCategory {
  identity('إثبات الهوية'),
  taxDocument('وثيقة ضريبية'),
  supportingDocument('مستند مؤيد');

  const AttachmentCategory(this.label);
  final String label;
}

enum AttachmentClassification {
  private('خاص'),
  sensitive('حساس');

  const AttachmentClassification(this.label);
  final String label;
}

enum AttachmentAvailability { available, unavailable, denied }

class LocalAttachmentSelection {
  const LocalAttachmentSelection({
    required this.displayName,
    required this.mimeLabel,
    required this.sizeLabel,
  });

  final String displayName;
  final String mimeLabel;
  final String sizeLabel;
}

class AttachmentVersion {
  const AttachmentVersion({
    required this.number,
    required this.createdLabel,
    required this.note,
  });

  final int number;
  final String createdLabel;
  final String note;
}

class AttachmentSummary {
  const AttachmentSummary({
    required this.id,
    required this.name,
    required this.category,
    required this.classification,
    required this.availability,
    required this.versions,
  });

  final String id;
  final String name;
  final AttachmentCategory category;
  final AttachmentClassification classification;
  final AttachmentAvailability availability;
  final List<AttachmentVersion> versions;
}
