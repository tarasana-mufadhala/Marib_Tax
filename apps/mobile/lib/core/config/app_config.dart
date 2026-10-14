/// إعدادات التطبيق. عنوان الـ API يُمرَّر وقت البناء:
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
///
/// لا يوجد هنا أي مفتاح أو سر: التطبيق لا يحمل مفاتيح Supabase إطلاقاً،
/// وكل وصول للبيانات يمر عبر الـ API الذي يفرض الصلاحيات على الخادم.
class AppConfig {
  const AppConfig._();

  /// 10.0.2.2 هو مضيف المطوّر كما يراه محاكي أندرويد.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );

  /// مهلة أي نداء شبكي قبل اعتباره فاشلاً.
  static const Duration requestTimeout = Duration(seconds: 30);
}
