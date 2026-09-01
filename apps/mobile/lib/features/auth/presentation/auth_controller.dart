import 'package:flutter/foundation.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/security/biometric_service.dart';
import '../data/auth_repository.dart';
import '../domain/auth_models.dart';
import '../domain/yemeni_phone.dart';

/// [locked] جلسة قائمة يحرسها قفل البصمة: المكلف داخل حسابه، لكن لا يُعرض
/// له شيء قبل أن يُثبت أنه هو.
enum AuthStatus { unknown, signedOut, signedIn, locked }

/// حالة المصادقة على مستوى التطبيق، ومسار التسجيل متعدّد الخطوات.
///
/// التسجيل يحتفظ بحالته هنا لا في الشاشات، حتى لا تضيع خطوة إن رجع
/// المستخدم للخلف أو دخلت مكالمة على الجهاز.
class AuthController extends ChangeNotifier {
  AuthController({
    required AuthRepository repository,
    BiometricService? biometrics,
  })  : _repository = repository,
        _biometrics = biometrics;

  final AuthRepository _repository;
  final BiometricService? _biometrics;

  AuthStatus _status = AuthStatus.unknown;
  AuthStatus get status => _status;

  bool _busy = false;
  bool get busy => _busy;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  /// خبر لا خطأ: «انتهت صلاحية الجلسة» ليس ذنب المكلف، فلا يُعرض بلون
  /// الخطأ ولا بنبرته. يُعرض مرة واحدة على شاشة الدخول ثم يزول.
  String? _notice;
  String? get notice => _notice;

  // ---- حالة مسار التسجيل ----
  YemeniPhone? _pendingPhone;
  YemeniPhone? get pendingPhone => _pendingPhone;

  String? _verificationToken;
  bool get isPhoneVerified => _verificationToken != null;

  String? _existingTaxNumber;
  String? get existingTaxNumber => _existingTaxNumber;

  /// يُستدعى عند إقلاع التطبيق لتحديد الشاشة الأولى.
  Future<void> restoreSession() async {
    if (!await _repository.hasSession()) {
      _status = AuthStatus.signedOut;
      notifyListeners();
      return;
    }

    // جلسة قائمة: تُفتح مباشرة، إلا أن يكون المكلف قد أقفلها ببصمته.
    _status = await _biometricLockArmed()
        ? AuthStatus.locked
        : AuthStatus.signedIn;
    notifyListeners();
  }

  /// القفل مُسلَّح فقط إن فعّله المكلف وبقي الجهاز قادراً عليه. جهاز حُذفت
  /// منه البصمات لا يجوز أن يحبس صاحبه خارج حسابه.
  Future<bool> _biometricLockArmed() async {
    final biometrics = _biometrics;
    if (biometrics == null) return false;
    if (!await biometrics.isEnabled()) return false;
    if (await biometrics.isAvailable()) return true;

    // فقدت البصمة من الجهاز: يُطفأ التفضيل بدل أن يبقى قفلاً بلا مفتاح.
    await biometrics.setEnabled(false);
    return false;
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
    // الخروج الصريح يُطفئ قفل البصمة: لا جلسة تُقفل بعده.
    await _biometrics?.setEnabled(false);
    _clearRegistrationState();
    _notice = null;
    _errorMessage = null;
    _status = AuthStatus.signedOut;
    notifyListeners();
  }

  /// يجدّد الجلسة بصمت. يُوصَل بعميل الـ API فيُستدعى عند أول 401.
  Future<bool> renewSession() => _repository.refreshSession();

  /// يُستدعى من عميل الـ API بعد فشل التجديد — أي حين بطلت الجلسة فعلاً.
  ///
  /// الرسالة خبر لا خطأ: المكلف لم يُخطئ، ومدة الجلسة انتهت. تُعرض مرة
  /// واحدة على شاشة الدخول بنبرة هادئة، ولا تتكرر مع كل نداء فاشل.
  void onSessionExpired() {
    if (_status == AuthStatus.signedOut) return;
    _status = AuthStatus.signedOut;
    _errorMessage = null;
    _notice = 'انتهت مدة الجلسة. سجّل الدخول للمتابعة.';
    notifyListeners();
  }

  // ---- الدخول بالبصمة ----

  /// هل يصلح هذا الجهاز للدخول بالبصمة أصلاً؟
  Future<bool> biometricsAvailable() async =>
      await _biometrics?.isAvailable() ?? false;

  Future<bool> biometricsEnabled() async =>
      await _biometrics?.isEnabled() ?? false;

  /// اسم ما يدعمه الجهاز («بصمة الإصبع» أو «بصمة الوجه»).
  Future<String> biometricLabel() async =>
      await _biometrics?.methodLabel() ?? 'البصمة';

  /// تفعيل القفل بالبصمة. يُطلب التحقق فوراً حتى لا يُفعّله أحدٌ على جهاز
  /// بصمتُه لغيره، ويشترط جلسة قابلة للتجديد وإلا كان القفل بلا ما يفتحه.
  Future<bool> enableBiometrics() async {
    final biometrics = _biometrics;
    if (biometrics == null || !await biometrics.isAvailable()) {
      _fail('هذا الجهاز لا يدعم الدخول بالبصمة، أو لا توجد بصمة مسجَّلة عليه');
      return false;
    }
    if (!await _repository.canRenewSession()) {
      _fail('سجّل الدخول بكلمة المرور مرة واحدة قبل تفعيل الدخول بالبصمة');
      return false;
    }

    final result = await biometrics.authenticate(
      reason: 'أكّد بصمتك لتفعيل الدخول بها',
    );
    if (result != BiometricResult.success) {
      if (result != BiometricResult.cancelled) {
        _fail(_biometricFailure(result));
      }
      return false;
    }

    await biometrics.setEnabled(true);
    notifyListeners();
    return true;
  }

  Future<void> disableBiometrics() async {
    await _biometrics?.setEnabled(false);
    notifyListeners();
  }

  /// فتح القفل: البصمة تُثبت الشخص، ثم رمز التجديد يُصدر جلسة جديدة.
  ///
  /// البصمة وحدها لا تكفي: قد يكون رمز التجديد نفسه قد بطل، وعندها يعود
  /// المكلف إلى شاشة الدخول بدل أن يدخل على جلسة ميتة.
  Future<bool> unlockWithBiometrics() async {
    final biometrics = _biometrics;
    if (biometrics == null) return false;

    _errorMessage = null;
    final result = await biometrics.authenticate(
      reason: 'أكّد بصمتك للدخول إلى حسابك',
    );
    if (result != BiometricResult.success) {
      if (result != BiometricResult.cancelled) {
        _fail(_biometricFailure(result));
      }
      return false;
    }

    _busy = true;
    notifyListeners();
    try {
      // التجديد هنا لا يُؤجَّل إلى أول نداء: الدخول على شاشة تفشل نداءاتها
      // ثم تُخرج المكلف أسوأ من انتظار لحظة عند الفتح.
      final dead = await _repository.canRenewSession()
          // جلسة قابلة للتجديد فشل تجديدها = جلسة ميتة، مهما بقي في المخزن.
          ? !await _repository.refreshSession()
          : !await _repository.hasSession();
      if (dead) {
        await _repository.logout();
        await biometrics.setEnabled(false);
        _status = AuthStatus.signedOut;
        _notice = 'انتهت مدة الجلسة. سجّل الدخول للمتابعة.';
        return false;
      }
      _status = AuthStatus.signedIn;
      return true;
    } on ApiException catch (error) {
      // عطل شبكة لا بطلان جلسة: يبقى القفل مكانه ليعيد المحاولة.
      _errorMessage = error.message;
      return false;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  /// الخروج من شاشة القفل إلى الدخول بكلمة المرور.
  Future<void> cancelLock() => logout();

  String _biometricFailure(BiometricResult result) => switch (result) {
        BiometricResult.unavailable =>
          'البصمة غير متاحة الآن. استخدم كلمة المرور، أو تحقق من إعدادات جهازك',
        _ => 'تعذّر التحقق من البصمة، حاول مجدداً أو استخدم كلمة المرور',
      };

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

  /// يُخفي خبر انتهاء الجلسة. تستدعيه الشاشة حين يبدأ المكلف بالكتابة:
  /// خبرٌ قرأه وبدأ يتصرّف بناءً عليه لا معنى لبقائه معلّقاً أمامه.
  void clearNotice() {
    if (_notice == null) return;
    _notice = null;
    notifyListeners();
  }

  // ---- أدوات داخلية ----

  Future<bool> _run(Future<void> Function() action) async {
    _busy = true;
    _errorMessage = null;
    notifyListeners();
    try {
      await action();
      // نجاح العملية يُنهي مفعول خبر انتهاء الجلسة السابق.
      _notice = null;
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
