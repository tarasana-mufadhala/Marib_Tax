import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// مخزن رمز الجلسة. عقد مجرّد حتى يمكن استبداله في الاختبارات
/// بلا حاجة إلى قنوات المنصّة.
abstract class TokenStore {
  Future<String?> read();
  Future<void> write(String token);
  Future<void> clear();
}

/// التخزين الفعلي: Keystore على أندرويد و Keychain على iOS.
/// رمز الجلسة سر — لا يُخزَّن في SharedPreferences ولا يُسجَّل في أي سجل.
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

  final FlutterSecureStorage _storage;

  @override
  Future<String?> read() => _storage.read(key: _key);

  @override
  Future<void> write(String token) => _storage.write(key: _key, value: token);

  @override
  Future<void> clear() => _storage.delete(key: _key);
}

/// مخزن في الذاكرة للاختبارات.
class InMemoryTokenStore implements TokenStore {
  String? _token;

  @override
  Future<String?> read() async => _token;

  @override
  Future<void> write(String token) async => _token = token;

  @override
  Future<void> clear() async => _token = null;
}
