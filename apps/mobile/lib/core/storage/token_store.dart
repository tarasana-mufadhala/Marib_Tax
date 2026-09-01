import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// مخزن الجلسة. عقد مجرّد حتى يمكن استبداله في الاختبارات
/// بلا حاجة إلى قنوات المنصّة.
///
/// الجلسة رمزان لا رمز واحد: رمز وصول قصير العمر (ساعة) يُرسل مع كل نداء،
/// ورمز تجديد طويل العمر يُستبدل به رمز وصول جديد بلا مطالبة المكلف بكلمة
/// مروره. بلا الثاني ينتهي عمل المكلف كل ساعة في منتصف طلبه.
abstract class TokenStore {
  Future<String?> read();
  Future<void> write(String token);

  /// رمز التجديد المحفوظ، أو null إن لم تُحفظ جلسة قابلة للتجديد.
  Future<String?> readRefresh();
  Future<void> writeRefresh(String token);

  /// يمسح رمزَي الجلسة معاً. الخروج يعني ألّا يبقى ما يُجدَّد به.
  Future<void> clear();
}

/// التخزين الفعلي: Keystore على أندرويد و Keychain على iOS.
/// رمزا الجلسة سرّان — لا يُخزَّنان في SharedPreferences ولا يُسجَّلان في أي سجل.
class SecureTokenStore implements TokenStore {
  SecureTokenStore({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock_this_device,
              ),
            );

  static const String _key = 'marib_tax_access_token';
  static const String _refreshKey = 'marib_tax_refresh_token';

  final FlutterSecureStorage _storage;

  @override
  Future<String?> read() => _storage.read(key: _key);

  @override
  Future<void> write(String token) => _storage.write(key: _key, value: token);

  @override
  Future<String?> readRefresh() => _storage.read(key: _refreshKey);

  @override
  Future<void> writeRefresh(String token) =>
      _storage.write(key: _refreshKey, value: token);

  @override
  Future<void> clear() async {
    await _storage.delete(key: _key);
    await _storage.delete(key: _refreshKey);
  }
}

/// مخزن في الذاكرة للاختبارات.
class InMemoryTokenStore implements TokenStore {
  String? _token;
  String? _refreshToken;

  @override
  Future<String?> read() async => _token;

  @override
  Future<void> write(String token) async => _token = token;

  @override
  Future<String?> readRefresh() async => _refreshToken;

  @override
  Future<void> writeRefresh(String token) async => _refreshToken = token;

  @override
  Future<void> clear() async {
    _token = null;
    _refreshToken = null;
  }
}
