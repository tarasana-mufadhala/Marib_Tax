enum AttachmentCategory {
  identityDocument('identity_document', 'إثبات الهوية'),
  taxDocument('tax_document', 'وثيقة ضريبية'),
  financialEvidence('financial_evidence', 'إثبات مالي'),
  correspondence('correspondence', 'مراسلات'),
  license('license', 'ترخيص'),
  supportingDocument('supporting_document', 'مستند مؤيد');

  const AttachmentCategory(this.code, this.label);
  final String code;
  final String label;
}

enum AttachmentClassification {
  internal('internal', 'داخلي'),
  confidential('confidential', 'سري'),
  highlySensitive('highly_sensitive', 'شديد الحساسية');

  const AttachmentClassification(this.code, this.label);
  final String code;
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
