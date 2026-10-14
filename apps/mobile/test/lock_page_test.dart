import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/app/app.dart';
import 'package:marib_tax_mobile/core/security/biometric_service.dart';
import 'package:marib_tax_mobile/core/storage/token_store.dart';

import 'support/fake_api.dart';

void main() {
  Future<void> pumpApp(
    WidgetTester tester,
    InMemoryTokenStore store,
    BiometricService biometrics,
  ) async {
    await tester.pumpWidget(
      MaribTaxApp(
        tokenStore: store,
        apiClient: fakeApiClient(store),
        biometrics: biometrics,
      ),
    );
    // دورتان: الأولى لاستعادة الجلسة، والثانية لطلب البصمة الذي تُطلقه
    // شاشة القفل بعد أول إطار.
    await tester.pumpAndSettle();
    await tester.pumpAndSettle();
  }

  testWidgets('الجلسة المقفلة لا تكشف شيئاً قبل البصمة', (tester) async {
    final store = InMemoryTokenStore();
    await store.write('stored-token');
    await store.writeRefresh('stored-refresh');

    await pumpApp(
      tester,
      store,
      FakeBiometricService(enabled: true, result: BiometricResult.cancelled),
    );

    expect(find.text('التطبيق مقفل'), findsOneWidget);
    expect(find.text('الدخول بكلمة المرور'), findsOneWidget);
    // بيانات الحساب محجوبة خلف القفل، لا معروضة تحته.
    expect(find.text('طلباتي'), findsNothing);
  });

  testWidgets('البصمة الناجحة تفتح التطبيق بلا كلمة مرور', (tester) async {
    final store = InMemoryTokenStore();
    await store.write('stored-token');
    await store.writeRefresh('stored-refresh');

    await pumpApp(tester, store, FakeBiometricService(enabled: true));

    expect(find.text('التطبيق مقفل'), findsNothing);
    expect(find.text('طلباتي'), findsOneWidget);
  });

  testWidgets('«الدخول بكلمة المرور» يُنهي الجلسة المقفلة', (tester) async {
    final store = InMemoryTokenStore();
    await store.write('stored-token');
    await store.writeRefresh('stored-refresh');
    final biometrics =
        FakeBiometricService(enabled: true, result: BiometricResult.cancelled);

    await pumpApp(tester, store, biometrics);
    await tester.tap(find.text('الدخول بكلمة المرور'));
    await tester.pumpAndSettle();

    expect(find.text('إنشاء حساب جديد'), findsOneWidget);
    // لا تبقى جلسة محفوظة يدخل عليها شخص آخر بكلمة مروره.
    expect(await store.readRefresh(), isNull);
    expect(await biometrics.isEnabled(), isFalse);
  });

  testWidgets('بلا تفعيل من المكلف لا يظهر قفل أصلاً', (tester) async {
    final store = InMemoryTokenStore();
    await store.write('stored-token');

    await pumpApp(tester, store, FakeBiometricService());

    expect(find.text('التطبيق مقفل'), findsNothing);
    expect(find.text('طلباتي'), findsOneWidget);
  });
}
