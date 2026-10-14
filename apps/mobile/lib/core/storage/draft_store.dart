import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// حفظ مسودات النماذج الطويلة محلياً.
///
/// المسودة تحوي بيانات المكلف (أنشطته، عناوينه، أسباب الإيقاف)، فتُخزَّن
/// مشفّرة كما يُخزَّن رمز الجلسة لا في تخزين عادي. وتُمحى بمجرد الإرسال
/// الناجح: إبقاء نسخة بعد وصولها للمكتب احتفاظٌ ببيانات بلا سبب.
abstract class DraftStore {
  Future<Map<String, dynamic>?> read(String key);
  Future<void> write(String key, Map<String, dynamic> value);
  Future<void> clear(String key);
}

class SecureDraftStore implements DraftStore {
  SecureDraftStore({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock_this_device,
              ),
            );

  final FlutterSecureStorage _storage;

  String _storageKey(String key) => 'marib_tax_draft_$key';

  @override
  Future<Map<String, dynamic>?> read(String key) async {
    final raw = await _storage.read(key: _storageKey(key));
    if (raw == null || raw.isEmpty) return null;
    try {
      final decoded = jsonDecode(raw);
      return decoded is Map<String, dynamic> ? decoded : null;
    } catch (_) {
      // مسودة تالفة لا تُعطّل النموذج: تُتجاهَل ويبدأ المكلف من جديد.
      return null;
    }
  }

  @override
  Future<void> write(String key, Map<String, dynamic> value) =>
      _storage.write(key: _storageKey(key), value: jsonEncode(value));

  @override
  Future<void> clear(String key) => _storage.delete(key: _storageKey(key));
}

/// بديل في الذاكرة للاختبارات — بلا قنوات منصّة.
class InMemoryDraftStore implements DraftStore {
  final Map<String, Map<String, dynamic>> _drafts = {};

  @override
  Future<Map<String, dynamic>?> read(String key) async => _drafts[key];

  @override
  Future<void> write(String key, Map<String, dynamic> value) async {
    _drafts[key] = value;
  }

  @override
  Future<void> clear(String key) async {
    _drafts.remove(key);
  }
}
