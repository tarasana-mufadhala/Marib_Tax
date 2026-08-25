import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:marib_tax_mobile/core/storage/token_store.dart';
import 'package:marib_tax_mobile/features/auth/data/auth_repository.dart';
import 'package:marib_tax_mobile/features/auth/domain/auth_models.dart';
import 'package:marib_tax_mobile/features/auth/presentation/auth_controller.dart';

import 'support/fake_api.dart';

AuthController buildController(
  InMemoryTokenStore store, {
  Map<String, dynamic> overrides = const {},
}) {
  final api = fakeApiClient(store, overrides: overrides.cast());
  return AuthController(
    repository: AuthRepository(api: api, tokenStore: store),
  );
}

const _details = RegistrationDetails(
  firstName: 'محمد',
  secondName: 'علي',
  thirdName: 'صالح',
  lastName: 'المرادي',
  tradeName: 'مؤسسة النور التجارية',
  legalEntityId: 'le-1',
  activityType: 'تجارة تجزئة',
  address: 'مأرب - الشارع العام',
);

void main() {
  group('استعادة الجلسة عند الإقلاع', () {
    test('بلا رمز محفوظ ⇒ خارج الحساب', () async {
      final controller = buildController(InMemoryTokenStore());
      await controller.restoreSession();
      expect(controller.status, AuthStatus.signedOut);
    });

    test('برمز محفوظ ⇒ داخل الحساب', () async {
      final store = InMemoryTokenStore();
      await store.write('stored');
      final controller = buildController(store);
      await controller.restoreSession();
      expect(controller.status, AuthStatus.signedIn);
    });
  });

  group('FR-001 التسجيل', () {
    test('رقم هاتف غير صالح يُرفض قبل أي نداء شبكي', () async {
      final requests = <dynamic>[];
      final store = InMemoryTokenStore();
      final api = fakeApiClient(store, recorder: requests.cast());
      final controller =
          AuthController(repository: AuthRepository(api: api, tokenStore: store));

      final ok = await controller.startRegistration('123');

      expect(ok, isFalse);
      expect(controller.errorMessage, contains('يبدأ بـ 7'));
      expect(requests, isEmpty, reason: 'لا يُستهلك نداء ولا رسالة SMS');
    });

    test('رمز تحقق بغير 6 أرقام يُرفض محلياً', () async {
      final controller = buildController(InMemoryTokenStore());
      await controller.startRegistration('771234567');

      expect(await controller.verifyOtp('123'), isFalse);
      expect(controller.errorMessage, contains('6 أرقام'));
      expect(controller.isPhoneVerified, isFalse);
    });

    test('لا يمكن التحقق قبل إدخال رقم الهاتف', () async {
      final controller = buildController(InMemoryTokenStore());
      expect(await controller.verifyOtp('123456'), isFalse);
      expect(controller.errorMessage, contains('رقم الهاتف'));
    });

    test('لا يكتمل التسجيل قبل التحقق من الهاتف', () async {
      final controller = buildController(InMemoryTokenStore());
      await controller.startRegistration('771234567');

      final ok = await controller.completeRegistration(
        details: _details,
        password: 'Marib@2026',
      );

      expect(ok, isFalse);
      expect(controller.errorMessage, contains('لم يكتمل التحقق'));
      expect(controller.status, isNot(AuthStatus.signedIn));
    });

    test('المسار الكامل ينتهي بجلسة محفوظة', () async {
      final store = InMemoryTokenStore();
      final controller = buildController(store);

      expect(await controller.startRegistration('771234567'), isTrue);
      expect(await controller.verifyOtp('123456'), isTrue);
      expect(controller.isPhoneVerified, isTrue);

      controller.setExistingTaxNumber('TIN-99');
      expect(controller.existingTaxNumber, 'TIN-99');

      final ok = await controller.completeRegistration(
        details: _details,
        password: 'Marib@2026',
      );

      expect(ok, isTrue);
      expect(controller.status, AuthStatus.signedIn);
      expect(await store.read(), 'issued-token');
      // حالة التسجيل تُمسح بعد النجاح حتى لا تتسرّب لمحاولة لاحقة.
      expect(controller.pendingPhone, isNull);
      expect(controller.existingTaxNumber, isNull);
    });

    test('التسجيل يحفظ بيانات المكلف الكاملة على الخادم بعد الدخول', () async {
      final store = InMemoryTokenStore();
      final requests = <http.Request>[];
      final api = fakeApiClient(store, recorder: requests);
      final controller =
          AuthController(repository: AuthRepository(api: api, tokenStore: store));

      await controller.startRegistration('771234567');
      await controller.verifyOtp('123456');
      final ok = await controller.completeRegistration(
        details: _details,
        password: 'Marib@2026',
      );

      expect(ok, isTrue);

      final paths = requests.map((r) => '${r.method} ${r.url.path}').toList();
      // الترتيب مقصود: الحفظ يتطلب جلسة، فالدخول يسبقه.
      expect(
        paths.indexOf('POST /api/v1/auth/login'),
        lessThan(paths.indexOf('POST /api/v1/taxpayers/me')),
      );

      final profileCall = requests
          .firstWhere((r) => r.url.path == '/api/v1/taxpayers/me');
      final sent = jsonDecode(profileCall.body) as Map<String, dynamic>;
      expect(sent['tradeName'], 'مؤسسة النور التجارية');
      expect(sent['legalEntityId'], 'le-1');
      expect(sent['activityType'], 'تجارة تجزئة');
      expect(sent['address'], 'مأرب - الشارع العام');
      expect(sent['displayName'], 'محمد علي صالح المرادي');
    });

    test('فشل حفظ البيانات لا يترك المستخدم في حالة «داخل الحساب» زائفة',
        () async {
      final store = InMemoryTokenStore();
      final controller = buildController(store, overrides: {
        'POST /api/v1/taxpayers/me': (_) =>
            apiError(400, 'BAD_REQUEST', 'الحقل «العنوان» مطلوب'),
      });

      await controller.startRegistration('771234567');
      await controller.verifyOtp('123456');
      final ok = await controller.completeRegistration(
        details: _details,
        password: 'Marib@2026',
      );

      expect(ok, isFalse);
      expect(controller.status, isNot(AuthStatus.signedIn));
      expect(controller.errorMessage, contains('العنوان'));
    });

    test('الرقم الضريبي الفارغ يُعامل كـ «لا يملك رقماً»', () {
      final controller = buildController(InMemoryTokenStore());
      controller.setExistingTaxNumber('   ');
      expect(controller.existingTaxNumber, isNull);
    });
  });

  group('FR-002 الدخول', () {
    test('بيانات صحيحة تحفظ الرمز وتغيّر الحالة', () async {
      final store = InMemoryTokenStore();
      final controller = buildController(store);

      expect(await controller.login('771234567', 'Marib@2026'), isTrue);
      expect(controller.status, AuthStatus.signedIn);
      expect(await store.read(), 'issued-token');
    });

    test('بيانات خاطئة ⇒ رسالة عربية ولا تُحفظ جلسة', () async {
      final store = InMemoryTokenStore();
      final controller = buildController(store, overrides: {
        'POST /api/v1/auth/login': (_) => apiError(
              401,
              'AUTHENTICATION_REQUIRED',
              'Invalid phone number or password.',
            ),
      });

      expect(await controller.login('771234567', 'wrong'), isFalse);
      expect(controller.errorMessage, 'رقم الهاتف أو كلمة المرور غير صحيحة');
      expect(controller.status, isNot(AuthStatus.signedIn));
      expect(await store.read(), isNull);
    });

    test('رقم غير صالح يُرفض قبل النداء', () async {
      final controller = buildController(InMemoryTokenStore());
      expect(await controller.login('12', 'Marib@2026'), isFalse);
      expect(controller.errorMessage, contains('يبدأ بـ 7'));
    });

    test('الخروج يمسح الرمز ويعيد الحالة', () async {
      final store = InMemoryTokenStore();
      final controller = buildController(store);
      await controller.login('771234567', 'Marib@2026');

      await controller.logout();

      expect(controller.status, AuthStatus.signedOut);
      expect(await store.read(), isNull);
    });

    test('انتهاء الجلسة يُخرج المستخدم برسالة واضحة', () async {
      final store = InMemoryTokenStore();
      final controller = buildController(store);
      await controller.login('771234567', 'Marib@2026');

      controller.onSessionExpired();

      expect(controller.status, AuthStatus.signedOut);
      expect(controller.errorMessage, contains('انتهت جلستك'));
    });
  });

  group('استعادة كلمة المرور', () {
    test('لا يمكن التأكيد قبل طلب الرمز', () async {
      final controller = buildController(InMemoryTokenStore());
      expect(await controller.confirmPasswordReset('123456', 'Marib@2026'), isFalse);
      expect(controller.errorMessage, contains('رقم الهاتف'));
    });

    test('رقم غير مسجَّل يعطي رسالة الخادم', () async {
      final controller = buildController(InMemoryTokenStore(), overrides: {
        'POST /api/v1/auth/password/reset/request': (_) =>
            apiError(404, 'NOT_FOUND', 'Phone number not found.'),
      });

      expect(await controller.requestPasswordReset('771234567'), isFalse);
      expect(controller.errorMessage, 'العنصر المطلوب غير موجود');
    });

    test('المسار الكامل ينجح', () async {
      final controller = buildController(InMemoryTokenStore());
      expect(await controller.requestPasswordReset('771234567'), isTrue);
      expect(await controller.confirmPasswordReset('123456', 'Marib@2026'), isTrue);
    });
  });

  group('طلب بيانات الدخول لحساب أنشأه المكتب', () {
    test('رقم صالح يُرسل الطلب', () async {
      final controller = buildController(InMemoryTokenStore());
      expect(await controller.requestImportedCredentials('771234567'), isTrue);
      expect(controller.errorMessage, isNull);
    });

    test('رقم غير صالح يُرفض قبل أي نداء شبكي', () async {
      final requests = <dynamic>[];
      final store = InMemoryTokenStore();
      final api = fakeApiClient(store, recorder: requests.cast());
      final controller =
          AuthController(repository: AuthRepository(api: api, tokenStore: store));

      expect(await controller.requestImportedCredentials('12'), isFalse);
      expect(controller.errorMessage, contains('يبدأ بـ 7'));
      expect(requests, isEmpty, reason: 'لا يُستهلك نداء ولا رسالة');
    });

    test('خدمة الرسائل المعطّلة تصل كرسالة عربية واضحة', () async {
      final controller = buildController(InMemoryTokenStore(), overrides: {
        'POST /api/v1/auth/credentials/request': (_) => apiError(
              503,
              'MESSAGING_NOT_CONFIGURED',
              'خدمة الرسائل غير مُفعّلة بعد. يرجى مراجعة المكتب لاستلام بيانات الدخول',
            ),
      });

      expect(await controller.requestImportedCredentials('771234567'), isFalse);
      expect(controller.errorMessage, contains('خدمة الرسائل غير مُفعّلة'));
    });

    test('رقم بلا حساب مستورَد يعطي رسالة الخادم بلا كشف', () async {
      final controller = buildController(InMemoryTokenStore(), overrides: {
        'POST /api/v1/auth/credentials/request': (_) => apiError(
              404,
              'NO_PENDING_CREDENTIALS',
              'لا توجد بيانات دخول قابلة للإرسال لهذا الرقم',
            ),
      });

      expect(await controller.requestImportedCredentials('779998877'), isFalse);
      expect(controller.errorMessage, contains('لا توجد بيانات دخول'));
    });
  });

  group('الكيانات القانونية', () {
    test('تُقرأ من الـ API لا من قائمة ثابتة', () async {
      final controller = buildController(InMemoryTokenStore());
      final options = await controller.legalEntities();
      expect(options.map((e) => e.name),
          containsAll(['مؤسسة فردية', 'شركة ذات مسؤولية محدودة']));
    });
  });
}
