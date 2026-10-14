import '../../home/domain/home_models.dart' show RequestStatus;

/// شرط إلزام المستند كما يعرّفه عقد الخدمات على الخادم.
enum DocumentRequirement {
  required$('required'),
  optional('optional'),
  companyOnly('company_only'),
  nationalIdOnly('national_id_only'),
  passportOnly('passport_only'),
  unknown('');

  const DocumentRequirement(this.code);

  final String code;

  static DocumentRequirement fromCode(String? code) {
    for (final value in DocumentRequirement.values) {
      if (value.code == code) return value;
    }
    return DocumentRequirement.unknown;
  }
}

/// مستند مطلوب ضمن خدمة.
class ServiceDocument {
  const ServiceDocument({
    required this.code,
    required this.label,
    required this.requirement,
    this.note,
  });

  final String code;
  final String label;
  final DocumentRequirement requirement;
  final String? note;

  factory ServiceDocument.fromJson(Map<String, dynamic> json) => ServiceDocument(
        code: (json['code'] ?? '').toString(),
        label: (json['label'] ?? '').toString(),
        requirement: DocumentRequirement.fromCode(json['requirement']?.toString()),
        note: json['note']?.toString(),
      );

  /// وصف عربي مختصر لشرط الإلزام يُعرض بجانب المستند.
  String get requirementLabel => switch (requirement) {
        DocumentRequirement.required$ => 'إلزامي',
        DocumentRequirement.optional => 'اختياري',
        DocumentRequirement.companyOnly => 'إلزامي للشركات',
        DocumentRequirement.nationalIdOnly => 'عند اختيار البطاقة الشخصية',
        DocumentRequirement.passportOnly => 'عند اختيار جواز السفر',
        DocumentRequirement.unknown => '—',
      };
}

/// تعريف خدمة من كتالوج الخادم (القسم 4.3).
class ServiceDefinition {
  const ServiceDefinition({
    required this.code,
    required this.title,
    required this.acceptanceNote,
    required this.documents,
  });

  final String code;
  final String title;
  final String acceptanceNote;
  final List<ServiceDocument> documents;

  factory ServiceDefinition.fromJson(Map<String, dynamic> json) =>
      ServiceDefinition(
        code: (json['code'] ?? '').toString(),
        title: (json['title'] ?? '').toString(),
        acceptanceNote: (json['acceptanceNote'] ?? '').toString(),
        documents: (json['documents'] as List? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(ServiceDocument.fromJson)
            .toList(growable: false),
      );

  /// هل تطلب هذه الخدمة اختيار وثيقة هوية (بطاقة أو جواز)؟
  bool get requiresIdentityChoice => documents.any(
        (document) =>
            document.requirement == DocumentRequirement.nationalIdOnly ||
            document.requirement == DocumentRequirement.passportOnly,
      );

  /// هل فيها مستندات تخص الشركات؟
  bool get hasCompanyDocuments => documents
      .any((document) => document.requirement == DocumentRequirement.companyOnly);
}

/// مستند ناقص كما يُبلّغ به الخادم.
class MissingDocument {
  const MissingDocument({required this.code, required this.label});

  final String code;
  final String label;

  factory MissingDocument.fromJson(Map<String, dynamic> json) => MissingDocument(
        code: (json['code'] ?? '').toString(),
        label: (json['label'] ?? '').toString(),
      );
}

/// مرفق مرفوع على طلب.
class ServiceAttachment {
  const ServiceAttachment({
    required this.id,
    required this.fileName,
    required this.documentCode,
    required this.sizeBytes,
  });

  final String id;
  final String fileName;
  final String documentCode;
  final int sizeBytes;

  factory ServiceAttachment.fromJson(Map<String, dynamic> json) =>
      ServiceAttachment(
        id: (json['id'] ?? '').toString(),
        fileName: (json['fileName'] ?? '').toString(),
        documentCode: (json['documentCode'] ?? '').toString(),
        sizeBytes: int.tryParse('${json['sizeBytes'] ?? 0}') ?? 0,
      );
}

/// طلب خدمة كما يعيده الخادم.
class ServiceRequest {
  const ServiceRequest({
    required this.id,
    required this.publicRef,
    required this.serviceCode,
    required this.status,
    required this.form,
  });

  final String id;
  final String? publicRef;
  final String serviceCode;
  final RequestStatus status;
  final Map<String, dynamic> form;

  factory ServiceRequest.fromJson(Map<String, dynamic> json) => ServiceRequest(
        id: (json['id'] ?? '').toString(),
        publicRef: json['publicRef']?.toString(),
        serviceCode: (json['serviceCode'] ?? '').toString(),
        status: RequestStatus.fromCode(json['status']?.toString()),
        form: (json['form'] as Map?)?.cast<String, dynamic>() ?? const {},
      );

  bool get isDraft => status == RequestStatus.draft;
}
