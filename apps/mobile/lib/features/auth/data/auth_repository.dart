import '../../../core/api/api_client.dart';
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
    final session = AuthSession.fromJson(json);
    await _tokenStore.write(session.accessToken);
    return session;
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

  Future<bool> hasSession() async {
    final token = await _tokenStore.read();
    return token != null && token.isNotEmpty;
  }
}
