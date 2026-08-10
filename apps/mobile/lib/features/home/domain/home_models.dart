/// إعلان يُدار من لوحة التحكم (4.2 بند 1).
class Announcement {
  const Announcement({required this.id, required this.title, this.body});

  final String id;
  final String title;
  final String? body;

  factory Announcement.fromJson(Map<String, dynamic> json) => Announcement(
        id: (json['id'] ?? '').toString(),
        title: (json['title'] ?? '—').toString(),
        body: json['body']?.toString() ?? json['content']?.toString(),
      );
}

/// حالات الطلبات والبلاغات كما في القسم 4.6، مع تسمية عربية للعرض.
enum RequestStatus {
  draft('draft', 'مسودة'),
  submitted('submitted', 'تم الاستلام'),
  received('received', 'تم الاستلام'),
  underReview('under_review', 'قيد المراجعة'),
  needMoreInfo('need_more_info', 'مطلوب استكمال'),
  fieldVisitScheduled('field_visit_scheduled', 'موعد نزول ميداني'),
  fieldVisitDone('field_visit_done', 'تم النزول الميداني'),
  paymentRequired('payment_required', 'مطلوب سداد'),
  readyForPickup('ready_for_pickup', 'جاهز للاستلام'),
  approved('approved', 'تمت الموافقة'),
  completed('completed', 'مكتمل'),
  rejected('rejected', 'مرفوض'),
  archived('archived', 'مؤرشف'),
  cancelled('cancelled', 'ملغى'),
  unknown('', 'غير معروف');

  const RequestStatus(this.code, this.label);

  final String code;
  final String label;

  static RequestStatus fromCode(String? code) {
    final normalized = (code ?? '').trim().toLowerCase();
    for (final status in RequestStatus.values) {
      if (status.code == normalized) return status;
    }
    return RequestStatus.unknown;
  }

  /// الحالات التي انتهت عندها المعاملة ولا إجراء متبقياً على المكلف.
  bool get isClosed =>
      this == completed ||
      this == approved ||
      this == rejected ||
      this == archived ||
      this == cancelled;

  /// الحالات التي تتطلب إجراءً من المكلف — تُبرَز بصرياً.
  bool get needsTaxpayerAction =>
      this == needMoreInfo || this == paymentRequired || this == readyForPickup;
}

/// ملخّص طلب أو بلاغ في قوائم الاستعلام (4.5).
class RequestSummary {
  const RequestSummary({
    required this.id,
    required this.publicRef,
    required this.status,
    this.serviceName,
    this.submittedAt,
  });

  final String id;
  final String publicRef;
  final RequestStatus status;
  final String? serviceName;
  final DateTime? submittedAt;

  factory RequestSummary.fromJson(Map<String, dynamic> json) => RequestSummary(
        id: (json['id'] ?? '').toString(),
        publicRef: (json['publicRef'] ?? json['public_ref'] ?? '—').toString(),
        status: RequestStatus.fromCode(
          (json['statusCode'] ?? json['status_code'])?.toString(),
        ),
        serviceName:
            (json['serviceTypeName'] ?? json['service_type_name'])?.toString(),
        submittedAt: DateTime.tryParse(
          (json['submittedAt'] ?? json['submitted_at'] ?? '').toString(),
        ),
      );
}

/// إشعار داخل التطبيق (4.6).
class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.isRead,
    this.createdAt,
  });

  final String id;
  final String title;
  final String body;
  final bool isRead;
  final DateTime? createdAt;

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: (json['id'] ?? '').toString(),
        title: (json['title'] ?? json['subject'] ?? 'إشعار').toString(),
        body: (json['body'] ?? json['message'] ?? '').toString(),
        isRead: json['isRead'] == true ||
            json['read_at'] != null ||
            json['readAt'] != null,
        createdAt: DateTime.tryParse(
          (json['createdAt'] ?? json['created_at'] ?? '').toString(),
        ),
      );
}
