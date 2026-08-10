import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:marib_tax_mobile/app/theme.dart';
import 'package:marib_tax_mobile/core/storage/token_store.dart';
import 'package:marib_tax_mobile/features/services/data/service_repository.dart';
import 'package:marib_tax_mobile/features/services/presentation/services_page.dart';
import 'package:provider/provider.dart';

import 'support/fake_api.dart';

/// يغلّف الشاشة بما يلزمها: RTL، العربية، والمستودع.
Widget wrap(
  Widget child, {
  Map<String, http.Response Function(http.Request request)> overrides = const {},
}) {
  final store = InMemoryTokenStore();
  final repository =
      ServiceRepository(api: fakeApiClient(store, overrides: overrides));

  return Provider<ServiceRepository>.value(
    value: repository,
    child: MaterialApp(
      theme: AppTheme.build(),
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      builder: (context, child) => Directionality(
        textDirection: TextDirection.rtl,
        child: child ?? const SizedBox.shrink(),
      ),
      home: child,
    ),
  );
}

void main() {
  testWidgets('يعرض خدمات الكتالوج بعناوينها وملاحظات قبولها', (tester) async {
    await tester.pumpWidget(wrap(const ServicesPage()));
    await tester.pumpAndSettle();

    expect(find.text('فتح ملف ضريبي'), findsOneWidget);
    expect(find.text('استخراج أو طلب رقم ضريبي'), findsOneWidget);
    expect(find.textContaining('لا يُقبل الطلب'), findsOneWidget);
  });

  testWidgets('يعرض عدد المستندات المطلوبة لكل خدمة', (tester) async {
    await tester.pumpWidget(wrap(const ServicesPage()));
    await tester.pumpAndSettle();

    // FR-101: خمسة مستندات، منها عقد الإيجار اختياري ⇒ أربعة مطلوبة.
    expect(find.text('4 مستند مطلوب'), findsOneWidget);
    // FR-102: مستندان كلاهما غير اختياري.
    expect(find.text('2 مستند مطلوب'), findsOneWidget);
  });

  testWidgets('لا يعرض إلا ما يسمح به الخادم — الإخفاء يتبع الكتالوج',
      (tester) async {
    // كتالوج مكلف يملك رقماً ضريبياً: بلا FR-102.
    await tester.pumpWidget(wrap(
      const ServicesPage(),
      overrides: {
        'GET /api/v1/service-requests/catalog': (_) =>
            jsonResponse([fakeServiceCatalog.first]),
      },
    ));
    await tester.pumpAndSettle();

    expect(find.text('فتح ملف ضريبي'), findsOneWidget);
    expect(find.text('استخراج أو طلب رقم ضريبي'), findsNothing);
  });

  testWidgets('يعرض رسالة عربية وزر إعادة محاولة عند فشل التحميل',
      (tester) async {
    await tester.pumpWidget(wrap(
      const ServicesPage(),
      overrides: {
        'GET /api/v1/service-requests/catalog': (_) =>
            apiError(500, 'INTERNAL', 'boom'),
      },
    ));
    await tester.pumpAndSettle();

    expect(find.text('إعادة المحاولة'), findsOneWidget);
    expect(find.byIcon(Icons.cloud_off), findsOneWidget);
  });

  testWidgets('يعرض حالة فارغة حين لا خدمات متاحة', (tester) async {
    await tester.pumpWidget(wrap(
      const ServicesPage(),
      overrides: {
        'GET /api/v1/service-requests/catalog': (_) => jsonResponse([]),
      },
    ));
    await tester.pumpAndSettle();

    expect(find.text('لا توجد خدمات متاحة حالياً'), findsOneWidget);
  });
}
