import '../../../core/api/api_client.dart';

/// نشاط تجاري مسجَّل للمكلف — يختار منه في بلاغات الإيقاف والتفعيل.
class TaxpayerActivity {
  const TaxpayerActivity({required this.id, required this.name, this.status});

  final String id;
  final String name;
  final String? status;

  factory TaxpayerActivity.fromJson(Map<String, dynamic> json) => TaxpayerActivity(
        id: (json['id'] ?? '').toString(),
        name: (json['name'] ?? json['activityName'] ?? '—').toString(),
        status: (json['statusCode'] ?? json['status_code'])?.toString(),
      );
}

/// بلاغ مُقدَّم.
class BalaghSummary {
  const BalaghSummary({
    required this.id,
    required this.publicRef,
    required this.balaghType,
    required this.status,
  });

  final String id;
  final String? publicRef;
  final String balaghType;
  final String status;

  factory BalaghSummary.fromJson(Map<String, dynamic> json) => BalaghSummary(
        id: (json['id'] ?? '').toString(),
        publicRef: json['publicRef']?.toString(),
        balaghType: (json['balaghType'] ?? '').toString(),
        status: (json['status'] ?? 'draft').toString(),
      );
}

class BalaghRepository {
  BalaghRepository({required ApiClient api}) : _api = api;

  final ApiClient _api;

  Future<List<BalaghSummary>> mine() async {
    final rows = await _api.getList('/balaghs');
    return rows
        .whereType<Map<String, dynamic>>()
        .map(BalaghSummary.fromJson)
        .toList(growable: false);
  }

  /// معرّف المكلف المرتبط بحساب المستخدم، أو `null` إن لم يُكمل بياناته بعد.
  Future<String?> myTaxpayerId() async {
    final profile = await _api.getObject('/taxpayers/me');
    final id = profile['taxpayerId']?.toString() ?? '';
    return id.isEmpty ? null : id;
  }

  /// أنشطة المكلف المسجَّلة — مصدر اختيار الأنشطة في البلاغات.
  /// الخادم يرفض قراءة أنشطة مكلف آخر، فلا يصلح هنا إلا معرّف صاحب الحساب.
  Future<List<TaxpayerActivity>> activities(String taxpayerId) async {
    final rows = await _api.getList('/activities/taxpayers/$taxpayerId');
    return rows
        .whereType<Map<String, dynamic>>()
        .map(TaxpayerActivity.fromJson)
        .toList(growable: false);
  }

  /// ينشئ البلاغ ثم يُقدّمه في خطوة واحدة: المكلف يملأ النموذج ويرسل،
  /// ولا معنى لمسودة بلاغ في التطبيق.
  Future<BalaghSummary> submit({
    required String balaghType,
    required Map<String, dynamic> formData,
  }) async {
    final created = await _api.post('/balaghs', body: {
      'balaghType': balaghType,
      'schemaVersion': '1.0.0',
      'formData': formData,
    });
    final id = (created['id'] ?? '').toString();
    final submitted = await _api.post('/balaghs/$id/submit');
    return BalaghSummary.fromJson(submitted);
  }
}
