/// خطأ قادم من الـ API أو من الشبكة، برسالة عربية صالحة للعرض للمستخدم.
class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode, this.code, this.details});

  /// رسالة عربية جاهزة للعرض.
  final String message;

  /// رمز HTTP إن وُجد.
  final int? statusCode;

  /// رمز الخطأ من الـ API (مثل AUTHENTICATION_REQUIRED).
  final String? code;

  /// تفاصيل إضافية من الخادم — مثل قائمة المستندات الناقصة عند رفض التقديم.
  final Map<String, dynamic>? details;

  /// المستندات الإلزامية الناقصة حين يرفض الخادم تقديم الطلب.
  List<({String code, String label})> get missingDocuments {
    final raw = details?['missingDocuments'];
    if (raw is! List) return const [];
    return raw
        .whereType<Map<String, dynamic>>()
        .map((item) => (
              code: (item['code'] ?? '').toString(),
              label: (item['label'] ?? '').toString(),
            ))
        .toList(growable: false);
  }

  /// انتهت الجلسة أو لم يُصادَق عليها ⇒ على الواجهة إعادة المستخدم للدخول.
  bool get isUnauthenticated => statusCode == 401;

  /// مصادَق عليه لكن بلا صلاحية.
  bool get isForbidden => statusCode == 403;

  @override
  String toString() => 'ApiException($statusCode, $code): $message';
}
