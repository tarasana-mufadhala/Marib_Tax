import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:marib_tax_mobile/app/theme.dart';
import 'package:marib_tax_mobile/core/storage/token_store.dart';
import 'package:marib_tax_mobile/features/balaghs/data/balagh_repository.dart';
import 'package:marib_tax_mobile/features/balaghs/domain/balagh_forms.dart';
import 'package:marib_tax_mobile/features/balaghs/presentation/balagh_form_page.dart';
import 'package:provider/provider.dart';

import 'support/fake_api.dart';

Widget wrap(
  Widget child, {
  Map<String, http.Response Function(http.Request request)> overrides = const {},
  List<http.Request>? recorder,
}) {
  final store = InMemoryTokenStore();
  final repository = BalaghRepository(
    api: fakeApiClient(store, overrides: overrides, recorder: recorder),
  );

  return Provider<BalaghRepository>.value(
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

/// نموذج البلاغ أطول من الشاشة، فالنقر على عنصر خارجها لا يصيبه.
Future<void> tapVisible(WidgetTester tester, Finder finder) async {
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

Future<void> fill(WidgetTester tester, String label, String value) async {
  final field = find.widgetWithText(TextFormField, label);
  await tester.ensureVisible(field);
  await tester.pumpAndSettle();
  await tester.enterText(field, value);
  await tester.pumpAndSettle();
}

/// يفتح منتقي التاريخ ويؤكّد اليوم الحالي. زرّ التأكيد يتغيّر نصّه بتغيّر
/// لغة المنصّة، فنعتمد موضعه في الحوار لا نصّه.
Future<void> pickToday(WidgetTester tester, String label) async {
  await tapVisible(tester, find.widgetWithText(TextFormField, label));
  await tester.tap(find.descendant(
    of: find.byType(Dialog),
    matching: find.byType(TextButton),
  ).last);
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('يعرض أنشطة المكلف لاختيار ما يخص البلاغ', (tester) async {
    await tester.pumpWidget(wrap(BalaghFormPage(type: balaghTypeOf('FR-201')!)));
    await tester.pumpAndSettle();

    expect(find.text('تجارة تجزئة'), findsOneWidget);
    expect(find.text('مخبز آلي'), findsOneWidget);
  });

  testWidgets('لا يُرسل البلاغ بلا اختيار نشاط', (tester) async {
    final sent = <http.Request>[];
    await tester.pumpWidget(
      wrap(BalaghFormPage(type: balaghTypeOf('FR-201')!), recorder: sent),
    );
    await tester.pumpAndSettle();

    await tapVisible(tester, find.text('إرسال البلاغ'));

    expect(find.textContaining('اختر نشاطاً'), findsOneWidget);
    expect(sent.any((r) => r.url.path.endsWith('/balaghs')), isFalse);
  });

  testWidgets('لا يُرسل البلاغ بلا الإقرار بصحة البيانات', (tester) async {
    final sent = <http.Request>[];
    await tester.pumpWidget(
      wrap(BalaghFormPage(type: balaghTypeOf('FR-201')!), recorder: sent),
    );
    await tester.pumpAndSettle();

    await tapVisible(tester, find.text('تجارة تجزئة'));
    await fill(tester, 'سبب الإيقاف', 'إيقاف للصيانة');

    await tapVisible(tester, find.text('إرسال البلاغ'));

    expect(find.textContaining('الإقرار'), findsWidgets);
    expect(sent.any((r) => r.method == 'POST' && r.url.path.endsWith('/balaghs')),
        isFalse);
  });

  testWidgets('الإرسال الصحيح يبعث النوع والحمولة ثم يقدّم البلاغ',
      (tester) async {
    final sent = <http.Request>[];
    await tester.pumpWidget(
      wrap(BalaghFormPage(type: balaghTypeOf('FR-201')!), recorder: sent),
    );
    await tester.pumpAndSettle();

    await tapVisible(tester, find.text('تجارة تجزئة'));
    await fill(tester, 'سبب الإيقاف', 'إيقاف للصيانة');
    await tapVisible(tester, find.textContaining('أقرّ بصحة البيانات'));

    // تاريخ الإيقاف حقل إلزامي يُختار من التقويم.
    await pickToday(tester, 'تاريخ الإيقاف');

    await tapVisible(tester, find.text('إرسال البلاغ'));

    final created = sent.firstWhere(
      (r) => r.method == 'POST' && r.url.path.endsWith('/balaghs'),
    );
    final body = jsonDecode(created.body) as Map<String, dynamic>;
    expect(body['balaghType'], 'FR-201');
    expect(body['schemaVersion'], '1.0.0');

    final formData = body['formData'] as Map<String, dynamic>;
    expect(formData['activityIds'], hasLength(1));
    expect(formData['declarationConfirmed'], isTrue);
    expect(formData['reason'], 'إيقاف للصيانة');

    // التقديم يتبع الإنشاء مباشرة: لا معنى لمسودة بلاغ في التطبيق.
    expect(
      sent.any((r) => r.url.path.endsWith('/balaghs/balagh-1/submit')),
      isTrue,
    );
    expect(find.textContaining('BLG-TEST01'), findsOneWidget);
  });

  testWidgets('رفض الخادم يُعرض برسالته العربية لا برسالة عامة',
      (tester) async {
    await tester.pumpWidget(
      wrap(
        BalaghFormPage(type: balaghTypeOf('FR-201')!),
        overrides: {
          'POST /api/v1/balaghs': (_) => jsonResponse({
                'error': {
                  'code': 'UNPROCESSABLE_ENTITY',
                  'message': 'بيانات البلاغ لا تطابق نوع البلاغ المحدد',
                },
              }, 422),
        },
      ),
    );
    await tester.pumpAndSettle();

    await tapVisible(tester, find.text('تجارة تجزئة'));
    await fill(tester, 'سبب الإيقاف', 'سبب');
    await tapVisible(tester, find.textContaining('أقرّ بصحة البيانات'));

    await pickToday(tester, 'تاريخ الإيقاف');

    await tapVisible(tester, find.text('إرسال البلاغ'));

    expect(find.text('بيانات البلاغ لا تطابق نوع البلاغ المحدد'), findsOneWidget);
  });

  testWidgets('المكلف بلا أنشطة مسجَّلة يُوجَّه للمكتب بدل نموذج فارغ',
      (tester) async {
    await tester.pumpWidget(
      wrap(
        BalaghFormPage(type: balaghTypeOf('FR-206')!),
        overrides: {
          'GET /api/v1/activities/taxpayers/taxpayer-1': (_) => jsonResponse([]),
        },
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('لا توجد أنشطة تجارية مسجَّلة'), findsOneWidget);
  });

  testWidgets('FR-205 لا يطلب اختيار نشاط لأنه بلاغ عقار', (tester) async {
    await tester.pumpWidget(wrap(BalaghFormPage(type: balaghTypeOf('FR-205')!)));
    await tester.pumpAndSettle();

    expect(find.text('تجارة تجزئة'), findsNothing);
    expect(find.widgetWithText(TextFormField, 'اسم المالك الجديد'),
        findsOneWidget);
  });
}
