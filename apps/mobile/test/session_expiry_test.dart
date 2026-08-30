import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/core/design/widgets.dart';
import 'package:marib_tax_mobile/core/storage/token_store.dart';
import 'package:marib_tax_mobile/features/auth/data/auth_repository.dart';
import 'package:marib_tax_mobile/features/auth/presentation/auth_controller.dart';
import 'package:marib_tax_mobile/features/auth/presentation/login_page.dart';
import 'package:provider/provider.dart';

import 'support/fake_api.dart';

/// انتهاء الجلسة أمر معتاد لا عطل. هذه الاختبارات تحرس نبرته: خبر محايد
/// يُعرض مرة ويمكن إخفاؤه، لا شريط خطأ أحمر يلاحق المكلف.
void main() {
  Future<AuthController> pumpLogin(WidgetTester tester) async {
    final store = InMemoryTokenStore();
    final controller = AuthController(
      repository: AuthRepository(api: fakeApiClient(store), tokenStore: store),
    );
    await controller.login('771234567', 'Marib@2026');

    await tester.pumpWidget(
      ChangeNotifierProvider<AuthController>.value(
        value: controller,
        child: const MaterialApp(
          home: Directionality(
            textDirection: TextDirection.rtl,
            child: LoginPage(),
          ),
        ),
      ),
    );
    return controller;
  }

  testWidgets('انتهاء الجلسة يُعرض كخبر لا كخطأ', (tester) async {
    final controller = await pumpLogin(tester);

    controller.onSessionExpired();
    await tester.pumpAndSettle();

    expect(find.byType(InfoBanner), findsOneWidget);
    expect(find.byType(ErrorBanner), findsNothing);
    expect(find.textContaining('انتهت مدة الجلسة'), findsOneWidget);
  });

  testWidgets('يمكن إخفاء الخبر بلا مغادرة الشاشة', (tester) async {
    final controller = await pumpLogin(tester);
    controller.onSessionExpired();
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.close));
    await tester.pumpAndSettle();

    expect(find.byType(InfoBanner), findsNothing);
  });

  testWidgets('خطأ الدخول يبقى بشريط الخطأ الأحمر', (tester) async {
    final store = InMemoryTokenStore();
    final controller = AuthController(
      repository: AuthRepository(
        api: fakeApiClient(store, overrides: {
          'POST /api/v1/auth/login': (_) => apiError(
                401,
                'AUTHENTICATION_REQUIRED',
                'Invalid phone number or password.',
              ),
        }),
        tokenStore: store,
      ),
    );

    await tester.pumpWidget(
      ChangeNotifierProvider<AuthController>.value(
        value: controller,
        child: const MaterialApp(
          home: Directionality(
            textDirection: TextDirection.rtl,
            child: LoginPage(),
          ),
        ),
      ),
    );
    await controller.login('771234567', 'wrong');
    await tester.pumpAndSettle();

    expect(find.byType(ErrorBanner), findsOneWidget);
    expect(find.byType(InfoBanner), findsNothing);
  });
}
