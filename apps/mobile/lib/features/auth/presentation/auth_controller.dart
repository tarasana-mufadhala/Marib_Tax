import 'package:flutter/foundation.dart';

import '../../../core/api/api_exception.dart';
import '../data/auth_repository.dart';
import '../domain/auth_models.dart';
import '../domain/yemeni_phone.dart';

enum AuthStatus { unknown, signedOut, signedIn }

/// حالة المصادقة على مستوى التطبيق، ومسار التسجيل متعدّد الخطوات.
///
/// التسجيل يحتفظ بحالته هنا لا في الشاشات، حتى لا تضيع خطوة إن رجع
/// المستخدم للخلف أو دخلت مكالمة على الجهاز.
class AuthController extends ChangeNotifier {
  AuthController({required AuthRepository repository})
      : _repository = repository;

  final AuthRepository _repository;

  AuthStatus _status = AuthStatus.unknown;
  AuthStatus get status => _status;

  bool _busy = false;
  bool get busy => _busy;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  // ---- حالة مسار التسجيل ----
  YemeniPhone? _pendingPhone;
  YemeniPhone? get pendingPhone => _pendingPhone;

  String? _verificationToken;
  bool get isPhoneVerified => _verificationToken != null;

  String? _existingTaxNumber;
  String? get existingTaxNumber => _existingTaxNumber;

  /// يُستدعى عند إقلاع التطبيق لتحديد الشاشة الأولى.
  Future<void> restoreSession() async {
    _status = await _repository.hasSession()
        ? AuthStatus.signedIn
        : AuthStatus.signedOut;
    notifyListeners();
  }

  /// FR-001 خطوة 3.
  Future<bool> startRegistration(String rawPhone) async {
    final phone = YemeniPhone.tryParse(rawPhone);
    if (phone == null) {
      _fail('أدخل رقم هاتف يمني صحيح يبدأ بـ 7');
      return false;
    }
    return _run(() async {
      await _repository.requestRegistrationOtp(phone);
      _pendingPhone = phone;
      _verificationToken = null;
    });
  }

  /// FR-001 خطوة 4.
  Future<bool> verifyOtp(String code) async {
    final phone = _pendingPhone;
    if (phone == null) {
      _fail('ابدأ بإدخال رقم الهاتف أولاً');
      return false;
    }
    if (code.trim().length != 6) {
      _fail('رمز التحقق يتكون من 6 أرقام');
      return false;
    }
    return _run(() async {
      _verificationToken = await _repository.verifyRegistrationOtp(phone, code.trim());
    });
  }

  /// FR-001 خطوة 5 و6: جواب سؤال «هل لديك رقم ضريبي مسبق؟».
  void setExistingTaxNumber(String? taxNumber) {
    final value = taxNumber?.trim();
    _existingTaxNumber = (value == null || value.isEmpty) ? null : value;
    notifyListeners();
  }

  /// FR-001 خطوة 9: إنشاء الحساب ثم الدخول به مباشرة.
  Future<bool> completeRegistration({
    required RegistrationDetails details,
    required String password,
  }) async {
    final phone = _pendingPhone;
    final token = _verificationToken;
    if (phone == null || token == null) {
      _fail('لم يكتمل التحقق من رقم الهاتف');
      return false;
    }
    return _run(() async {
      await _repository.register(
        phone: phone,
        verificationToken: token,
        password: password,
        displayName: details.fullName,
      );
      // الدخول أولاً: حفظ بيانات المكلف يتطلب جلسة صالحة.
      await _repository.login(phone: phone, password: password);
      await _repository.completeTaxpayerProfile(details);
      _clearRegistrationState();
      _status = AuthStatus.signedIn;
    });
  }

  /// FR-002.
  Future<bool> login(String rawPhone, String password) async {
    final phone = YemeniPhone.tryParse(rawPhone);
    if (phone == null) {
      _fail('أدخل رقم هاتف يمني صحيح يبدأ بـ 7');
      return false;
    }
    return _run(() async {
      await _repository.login(phone: phone, password: password);
      _status = AuthStatus.signedIn;
    });
  }

  /// يطلب رمز دخول على البريد. يحفظ البريد ليعرضه في شاشة التحقق.
  Future<bool> requestEmailOtp(String rawEmail) async {
    final email = rawEmail.trim().toLowerCase();
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      _fail('أدخل بريداً إلكترونياً صحيحاً');
      return false;
    }
    return _run(() async {
      await _repository.requestEmailOtp(email);
      _pendingEmail = email;
    });
  }

  Future<bool> verifyEmailOtp(String code) async {
    final email = _pendingEmail;
    if (email == null) {
      _fail('اطلب الرمز أولاً');
      return false;
    }
    return _run(() async {
      await _repository.verifyEmailOtp(email: email, code: code);
      _pendingEmail = null;
      _status = AuthStatus.signedIn;
    });
  }

  String? _pendingEmail;

  /// البريد الذي أُرسل إليه الرمز، لعرضه في شاشة التحقق.
  String? get pendingEmail => _pendingEmail;

  /// يطلب رمز استعادة على البريد ويحفظه لخطوة التأكيد.
  Future<bool> requestEmailPasswordReset(String rawEmail) async {
    final email = rawEmail.trim().toLowerCase();
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      _fail('أدخل بريداً إلكترونياً صحيحاً');
      return false;
    }
    return _run(() async {
      await _repository.requestEmailPasswordReset(email);
      _pendingEmail = email;
    });
  }

  Future<bool> confirmEmailPasswordReset(
    String code,
    String newPassword,
  ) async {
    final email = _pendingEmail;
    if (email == null) {
      _fail('اطلب الرمز أولاً');
      return false;
    }
    return _run(() async {
      await _repository.confirmEmailPasswordReset(
        email: email,
        code: code,
        newPassword: newPassword,
      );
      _pendingEmail = null;
    });
  }

  Future<bool> requestPasswordReset(String rawPhone) async {
    final phone = YemeniPhone.tryParse(rawPhone);
    if (phone == null) {
      _fail('أدخل رقم هاتف يمني صحيح يبدأ بـ 7');
      return false;
    }
    return _run(() async {
      await _repository.requestPasswordReset(phone);
      _pendingPhone = phone;
    });
  }

  Future<bool> confirmPasswordReset(String code, String newPassword) async {
    final phone = _pendingPhone;
    if (phone == null) {
      _fail('ابدأ بإدخال رقم الهاتف أولاً');
      return false;
    }
    return _run(() async {
      await _repository.confirmPasswordReset(
        phone: phone,
        code: code.trim(),
        newPassword: newPassword,
      );
    });
  }

  /// طلب بيانات الدخول لحساب أنشأه المكتب من الاستيراد.
  Future<bool> requestImportedCredentials(String rawPhone) async {
    final phone = YemeniPhone.tryParse(rawPhone);
    if (phone == null) {
      _fail('أدخل رقم هاتف يمني صحيح يبدأ بـ 7');
      return false;
    }
    return _run(() => _repository.requestImportedCredentials(phone));
  }

  Future<List<LegalEntityOption>> legalEntities() => _repository.legalEntities();

  Future<void> logout() async {
    await _repository.logout();
    _clearRegistrationState();
    _status = AuthStatus.signedOut;
    notifyListeners();
  }

  /// يُستدعى من عميل الـ API عند 401 حتى تعود الواجهة لشاشة الدخول.
  void onSessionExpired() {
    if (_status == AuthStatus.signedOut) return;
    _status = AuthStatus.signedOut;
    _errorMessage = 'انتهت جلستك، يرجى تسجيل الدخول من جديد';
    notifyListeners();
  }

  /// خطأ تحقّق محلي (قبل بلوغ الشبكة) يُعرض في نفس مكان أخطاء الخادم.
  void showError(String message) {
    if (_errorMessage == message) return;
    _errorMessage = message;
    notifyListeners();
  }

  void clearError() {
    if (_errorMessage == null) return;
    _errorMessage = null;
    notifyListeners();
  }

  // ---- أدوات داخلية ----

  Future<bool> _run(Future<void> Function() action) async {
    _busy = true;
    _errorMessage = null;
    notifyListeners();
    try {
      await action();
      return true;
    } on ApiException catch (error) {
      _errorMessage = error.message;
      return false;
    } catch (_) {
      _errorMessage = 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً';
      return false;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  void _fail(String message) {
    _errorMessage = message;
    notifyListeners();
  }

  void _clearRegistrationState() {
    _pendingPhone = null;
    _verificationToken = null;
    _existingTaxNumber = null;
  }
}
