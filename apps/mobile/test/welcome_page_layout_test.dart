import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/app/theme.dart';
import 'package:marib_tax_mobile/features/auth/presentation/welcome_page.dart';

Widget wrap() => MaterialApp(
      theme: AppTheme.build(),
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      builder: (context, child) => Directionality(
        textDirection: TextDirection.rtl,
        child: child ?? const SizedBox.shrink(),
      ),
      home: const WelcomePage(),
    );

/// الشاشة الافتتاحية كانت تتجاوز حدودها في الوضع الأفقي (ظهر على جهاز حقيقي
/// بـ «BOTTOM OVERFLOWED BY 121 PIXELS»). هذه الاختبارات تحرس ضد عودته.
void main() {
  Future<void> pumpAt(WidgetTester tester, Size size) async {
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(wrap());
    await tester.pumpAndSettle();
  }

  testWidgets('تعرض عناصرها في الوضع الرأسي بلا تجاوز', (tester) async {
    await pumpAt(tester, const Size(400, 800));

    expect(find.text('تسجيل الدخول'), findsOneWidget);
    expect(find.text('إنشاء حساب جديد'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('لا تتجاوز حدودها في الوضع الأفقي', (tester) async {
    await pumpAt(tester, const Size(880, 400));

    expect(tester.takeException(), isNull, reason: 'لا يجوز تجاوز الحدود');
  });

  testWidgets('لا تتجاوز حدودها على شاشة قصيرة جداً', (tester) async {
    await pumpAt(tester, const Size(320, 280));

    expect(tester.takeException(), isNull);
  });

  testWidgets('يمكن الوصول لزرّي الدخول والتسجيل بالتمرير حين يقصر الارتفاع',
      (tester) async {
    await pumpAt(tester, const Size(360, 320));

    final register = find.text('إنشاء حساب جديد');
    await tester.scrollUntilVisible(register, 100);
    await tester.pumpAndSettle();

    expect(register, findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
