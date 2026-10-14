import '../../../core/api/api_client.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/storage/token_store.dart';
import '../domain/auth_models.dart';
import '../domain/yemeni_phone.dart';

/// كل نداءات المصادقة في مكان واحد. الواجهة لا تعرف شكل الـ API.
class AuthRepository {
  AuthRepository({required ApiClient api, required TokenStore tokenStore})
      : _api = api,
        _tokenStore = tokenStore;

  final ApiClient _api;
  final TokenStore _tokenStore;

  /// FR-001 خطوة 3: إرسال رمز تحقق لرقم جديد (تسجيل).
  Future<void> requestRegistrationOtp(YemeniPhone phone) async {
    await _api.post(
      '/auth/otp/request',
      body: {'phoneNumber': phone.e164},
      authenticated: false,
    );
  }

  /// FR-001 خطوة 4: التحقق من الرمز. يعيد رمز تحقق يُستخدم عند إنشاء الحساب.
  Future<String> verifyRegistrationOtp(YemeniPhone phone, String code) async {
    final json = await _api.post(
      '/auth/otp/verify',
      body: {'phoneNumber': phone.e164, 'code': code},
      authenticated: false,
    );
    return json['verificationToken'] as String;
  }

  /// FR-001 خطوة 9: إنشاء الحساب بعد اكتمال البيانات.
  Future<String> register({
    required YemeniPhone phone,
    required String verificationToken,
    required String password,
    required String displayName,
  }) async {
    final json = await _api.post(
      '/auth/register',
      body: {
        'phoneNumber': phone.e164,
        'verificationToken': verificationToken,
        'password': password,
        'displayName': displayName,
      },
      authenticated: false,
    );
    return json['userProfileId'] as String;
  }

  /// FR-002: الدخول برقم الهاتف وكلمة المرور. يحفظ الرمز عند النجاح.
  Future<AuthSession> login({
    required YemeniPhone phone,
    required String password,
  }) async {
    final json = await _api.post(
      '/auth/login',
      body: {'phoneNumber': phone.e164, 'password': password},
      authenticated: false,
    );
    return _persist(AuthSession.fromJson(json));
  }

  /// يحفظ رمزَي الجلسة معاً. كل مسار دخول يمر من هنا حتى لا يُنسى رمز
  /// التجديد في مسار فينتهي عمل المكلف فيه كل ساعة دون غيره.
  Future<AuthSession> _persist(AuthSession session) async {
    await _tokenStore.write(session.accessToken);
    if (session.refreshToken != null) {
      await _tokenStore.writeRefresh(session.refreshToken!);
    }
    return session;
  }

  /// يستبدل برمز التجديد رمز وصول جديداً. يعيد false إن بطل رمز التجديد
  /// نفسه — وعندها فقط يلزم دخول جديد.
  Future<bool> refreshSession() async {
    final refreshToken = await _tokenStore.readRefresh();
    if (refreshToken == null || refreshToken.isEmpty) return false;

    try {
      final json = await _api.post(
        '/auth/refresh',
        body: {'refreshToken': refreshToken},
        authenticated: false,
      );
      final session = AuthSession.fromJson(json);
      if (session.accessToken.isEmpty) return false;
      await _persist(session);
      return true;
    } on ApiException catch (error) {
      // انقطاع الشبكة ليس بطلان جلسة: لا نمسح رمز التجديد لعطل مؤقت،
      // وإلا أخرجنا المكلف من حسابه كلما ضعف الاتصال.
      if (error.statusCode == null) rethrow;
      return false;
    } on TypeError {
      // رد بشكل غير متوقّع (خادم أقدم لا يعرف التجديد): يُعامل كتعذّر
      // تجديد، فيعود المكلف للدخول بدل أن يعلق على جلسة لا تعمل.
      return false;
    }
  }

  /// رمز دخول يصل البريد — بديل لرقم الهاتف.
  ///
  /// الخادم يرد بنجاح سواء كان البريد مسجَّلاً أم لا، فلا نُظهر للمستخدم
  /// تمييزاً لا يملكه أصلاً.
  Future<void> requestEmailOtp(String email) async {
    await _api.post(
      '/auth/otp/email/request',
      body: {'email': email},
      authenticated: false,
    );
  }

  Future<AuthSession> verifyEmailOtp({
    required String email,
    required String code,
  }) async {
    final json = await _api.post(
      '/auth/otp/email/verify',
      body: {'email': email, 'code': code},
      authenticated: false,
    );
    return _persist(AuthSession.fromJson(json));
  }

  /// استعادة كلمة المرور بالبريد — لمن لا تصله الرسائل النصية.
  Future<void> requestEmailPasswordReset(String email) async {
    await _api.post(
      '/auth/password/reset/email/request',
      body: {'email': email},
      authenticated: false,
    );
  }

  Future<void> confirmEmailPasswordReset({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    await _api.post(
      '/auth/password/reset/email/confirm',
      body: {'email': email, 'code': code, 'newPassword': newPassword},
      authenticated: false,
    );
  }

  /// تأكيد ملكية بريد أُضيف إلى الحساب بالرمز الواصل إليه.
  Future<void> confirmAccountEmail({
    required String email,
    required String code,
  }) async {
    await _api.post('/account/email/confirm', body: {
      'email': email,
      'code': code,
    });
  }

  /// FR-002: نسيت كلمة المرور — إرسال رمز لرقم مسجَّل.
  Future<void> requestPasswordReset(YemeniPhone phone) async {
    await _api.post(
      '/auth/password/reset/request',
      body: {'phoneNumber': phone.e164},
      authenticated: false,
    );
  }

  /// FR-002: تأكيد استعادة كلمة المرور بالرمز.
  Future<void> confirmPasswordReset({
    required YemeniPhone phone,
    required String code,
    required String newPassword,
  }) async {
    await _api.post(
      '/auth/password/reset/confirm',
      body: {
        'phoneNumber': phone.e164,
        'code': code,
        'newPassword': newPassword,
      },
      authenticated: false,
    );
  }

  /// FR-001 خطوتا 6 و7: حفظ بيانات المكلف الكاملة بعد إنشاء الحساب.
  /// يتطلب جلسة، فيُستدعى بعد الدخول مباشرة.
  Future<TaxpayerProfileResult> completeTaxpayerProfile(
    RegistrationDetails details,
  ) async {
    final json = await _api.post('/taxpayers/me', body: details.toJson());
    return TaxpayerProfileResult(
      taxpayerId: (json['taxpayerId'] ?? '').toString(),
      linkedToExisting: json['linkedToExisting'] == true,
      statusCode: (json['statusCode'] ?? '').toString(),
    );
  }

  /// ملف المكلف الحالي، أو null إن لم تُكمل بياناته بعد.
  Future<TaxpayerProfile?> myTaxpayerProfile() async {
    final json = await _api.getObject('/taxpayers/me');
    if (json.isEmpty || json['taxpayerId'] == null) return null;
    return TaxpayerProfile.fromJson(json);
  }

  /// للمكلف الذي أُنشئ حسابه من استيراد بيانات المكتب ولم تصله كلمته بعد.
  Future<void> requestImportedCredentials(YemeniPhone phone) async {
    await _api.post(
      '/auth/credentials/request',
      body: {'phoneNumber': phone.e164},
      authenticated: false,
    );
  }

  /// FR-001 بند 8: الكيانات القانونية التي أنشأها الأدمن.
  Future<List<LegalEntityOption>> legalEntities() async {
    final rows = await _api.getList('/public/legal-entities');
    return rows
        .whereType<Map<String, dynamic>>()
        .map(LegalEntityOption.fromJson)
        .toList(growable: false);
  }

  Future<void> logout() => _tokenStore.clear();

  /// جلسة قائمة إن بقي رمز وصول أو رمز تجديد. رمز الوصول وحده قد يكون منتهياً،
  /// لكن أول نداء يُجدّده بصمت — أهون من شاشة دخول عند كل فتح للتطبيق.
  Future<bool> hasSession() async {
    final token = await _tokenStore.read();
    if (token != null && token.isNotEmpty) return true;
    final refresh = await _tokenStore.readRefresh();
    return refresh != null && refresh.isNotEmpty;
  }

  /// هل تملك الجلسة رمز تجديد؟ الدخول بالبصمة يقوم عليه: البصمة تُثبت
  /// الشخص، ورمز التجديد وحده هو ما يُصدر جلسة جديدة.
  Future<bool> canRenewSession() async {
    final refresh = await _tokenStore.readRefresh();
    return refresh != null && refresh.isNotEmpty;
  }
}
