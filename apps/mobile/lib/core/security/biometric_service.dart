import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

/// نتيجة محاولة تحقّق بالبصمة، بما يكفي لتُقال للمكلف رسالة صحيحة.
enum BiometricResult {
  /// تحقّق ناجح.
  success,

  /// ألغى المكلف الطلب أو فشلت البصمة — لا خطأ يُعرض، الشاشة تبقى كما هي.
  cancelled,

  /// الجهاز لا يدعم البصمة أو لم يُسجَّل عليه أي إصبع/وجه.
  unavailable,

  /// عطل غير متوقّع في قناة المنصّة.
  failed,
}

/// بوابة الدخول بالبصمة.
///
/// عقد مجرّد حتى تُختبر شاشات القفل بلا قناة منصّة: `local_auth` لا يعمل في
/// اختبارات الودجت.
abstract class BiometricService {
  /// هل يملك الجهاز بصمة/وجهاً مُسجَّلاً فعلاً؟
  Future<bool> isAvailable();

  /// اسم ما يدعمه الجهاز، ليُقال «بصمة الإصبع» أو «بصمة الوجه» لا كلاهما.
  Future<String> methodLabel();

  Future<BiometricResult> authenticate({required String reason});

  /// هل فعّل المكلف الدخول بالبصمة على هذا الجهاز؟
  Future<bool> isEnabled();

  Future<void> setEnabled(bool enabled);
}

/// التنفيذ الفعلي فوق `local_auth`، والتفضيل محفوظ في التخزين الآمن.
class LocalAuthBiometricService implements BiometricService {
  LocalAuthBiometricService({
    LocalAuthentication? localAuth,
    FlutterSecureStorage? storage,
  })  : _localAuth = localAuth ?? LocalAuthentication(),
        _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock_this_device,
              ),
            );

  static const String _key = 'marib_tax_biometric_enabled';

  final LocalAuthentication _localAuth;
  final FlutterSecureStorage _storage;

  @override
  Future<bool> isAvailable() async {
    try {
      // الجهاز قد يدعم العتاد بلا إصبع مُسجَّل: عرض الخيار عندها يعِد بما
      // لا يتحقق، فيُشترط وجود بصمة مُسجَّلة فعلاً.
      if (!await _localAuth.isDeviceSupported()) return false;
      final enrolled = await _localAuth.getAvailableBiometrics();
      return enrolled.isNotEmpty;
    } on PlatformException {
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  @override
  Future<String> methodLabel() async {
    try {
      final available = await _localAuth.getAvailableBiometrics();
      if (available.contains(BiometricType.face)) return 'بصمة الوجه';
      if (available.contains(BiometricType.iris)) return 'بصمة العين';
      return 'بصمة الإصبع';
    } on PlatformException {
      return 'البصمة';
    } on MissingPluginException {
      return 'البصمة';
    }
  }

  @override
  Future<BiometricResult> authenticate({required String reason}) async {
    try {
      final ok = await _localAuth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          // البصمة وحدها: رمز قفل الجهاز ليس إثباتاً لهوية صاحب الحساب
          // على جهاز مشترك.
          biometricOnly: true,
          stickyAuth: true,
          useErrorDialogs: true,
        ),
      );
      return ok ? BiometricResult.success : BiometricResult.cancelled;
    } on PlatformException catch (error) {
      return switch (error.code) {
        'NotAvailable' ||
        'NotEnrolled' ||
        'PasscodeNotSet' =>
          BiometricResult.unavailable,
        'LockedOut' || 'PermanentlyLockedOut' => BiometricResult.unavailable,
        _ => BiometricResult.failed,
      };
    } on MissingPluginException {
      return BiometricResult.unavailable;
    }
  }

  @override
  Future<bool> isEnabled() async {
    try {
      return await _storage.read(key: _key) == 'true';
    } on PlatformException {
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  @override
  Future<void> setEnabled(bool enabled) async {
    try {
      if (enabled) {
        await _storage.write(key: _key, value: 'true');
      } else {
        await _storage.delete(key: _key);
      }
    } on PlatformException {
      // تعذّر الحفظ يترك التفضيل معطّلاً، وهو الوضع الآمن.
    } on MissingPluginException {
      // كما أعلاه.
    }
  }
}

/// بديل للاختبارات: لا قناة منصّة، وسلوك يُضبط من الاختبار.
class FakeBiometricService implements BiometricService {
  FakeBiometricService({
    this.available = true,
    this.result = BiometricResult.success,
    bool enabled = false,
  }) : _enabled = enabled;

  bool available;
  BiometricResult result;
  bool _enabled;

  /// عدد مرات طلب البصمة — تتحقق منه الاختبارات.
  int prompts = 0;

  @override
  Future<bool> isAvailable() async => available;

  @override
  Future<String> methodLabel() async => 'بصمة الإصبع';

  @override
  Future<BiometricResult> authenticate({required String reason}) async {
    prompts++;
    return result;
  }

  @override
  Future<bool> isEnabled() async => _enabled;

  @override
  Future<void> setEnabled(bool enabled) async => _enabled = enabled;
}
