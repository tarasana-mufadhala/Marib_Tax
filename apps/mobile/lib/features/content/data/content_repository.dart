import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../domain/content_models.dart';

/// محتوى الموقع العام كما يعرضه الموقع تماماً — نفس النقاط ونفس المصادر،
/// فما ينشره المكتب يظهر في الاثنين معاً بلا ازدواج.
class ContentRepository {
  ContentRepository({required ApiClient api}) : _api = api;

  final ApiClient _api;

  /// مستندات المكتبة بتصنيفها (form | law | decision | guide)
  /// أو بنوع الضريبة (income_tax | sales_tax).
  Future<List<LibraryDocument>> documents({String? category, String? topic}) async {
    final params = <String>[
      if (category != null) 'category=${Uri.encodeComponent(category)}',
      if (topic != null) 'topic=${Uri.encodeComponent(topic)}',
    ];
    final query = params.isEmpty ? '' : '?${params.join('&')}';
    final rows = await _api.getList('/public/library-documents$query');
    return rows
        .whereType<Map<String, dynamic>>()
        .map(LibraryDocument.fromJson)
        .toList(growable: false);
  }

  /// صفحة محتوى بمفتاحها. تعيد null إن لم تكن منشورة.
  Future<ContentPage?> page(String key) async {
    final json = await _api.getObject('/public/content-pages/$key');
    if (json.isEmpty || json['key'] == null) return null;
    return ContentPage.fromJson(json);
  }

  /// رابط تنزيل المستند — يفتحه المتصفح خارج التطبيق.
  String fileUrlOf(String documentId) =>
      '${AppConfig.apiBaseUrl}/public/library-documents/$documentId/file';
}
