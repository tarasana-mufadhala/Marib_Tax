import '../../../core/api/api_client.dart';
import '../domain/home_models.dart';

/// مصادر الصفحة الرئيسية. الإعلانات عامة، وبقية العناصر تتطلب جلسة.
class HomeRepository {
  HomeRepository({required ApiClient api}) : _api = api;

  final ApiClient _api;

  /// 4.2 بند 1: بانر الإعلانات المُدار من لوحة التحكم.
  Future<List<Announcement>> announcements() async {
    final rows = await _api.getList('/public/announcements');
    return rows
        .whereType<Map<String, dynamic>>()
        .map(Announcement.fromJson)
        .toList(growable: false);
  }

  /// 4.5: حالة الطلبات والبلاغات وسجلها.
  Future<List<RequestSummary>> myRequests() async {
    final rows = await _api.getList('/requests');
    return rows
        .whereType<Map<String, dynamic>>()
        .map(RequestSummary.fromJson)
        .toList(growable: false);
  }

  /// 4.2 بند 4: الإشعارات داخل التطبيق.
  Future<List<AppNotification>> notifications() async {
    final rows = await _api.getList('/notifications');
    return rows
        .whereType<Map<String, dynamic>>()
        .map(AppNotification.fromJson)
        .toList(growable: false);
  }

  Future<void> markNotificationRead(String id) =>
      _api.post('/notifications/$id/read');
}
