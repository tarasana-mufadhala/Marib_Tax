import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/app/app.dart';
import 'package:marib_tax_mobile/core/storage/token_store.dart';

import 'support/fake_api.dart';

void main() {
  testWidgets('يبدأ بالشاشة الافتتاحية بالعربية وباتجاه RTL حين لا توجد جلسة',
      (tester) async {
    final store = InMemoryTokenStore();
    await tester.pumpWidget(
      MaribTaxApp(tokenStore: store, apiClient: fakeApiClient(store)),
    );
    await tester.pumpAndSettle();

    expect(find.text('تسجيل الدخول'), findsOneWidget);
    expect(find.text('إنشاء حساب جديد'), findsOneWidget);

    final direction =
        tester.widget<Directionality>(find.byType(Directionality).first);
    expect(direction.textDirection, TextDirection.rtl);
  });

  testWidgets('يفتح على الصفحة الرئيسية مباشرة حين توجد جلسة محفوظة',
      (tester) async {
    final store = InMemoryTokenStore();
    await store.write('stored-token');

    await tester.pumpWidget(
      MaribTaxApp(tokenStore: store, apiClient: fakeApiClient(store)),
    );
    await tester.pumpAndSettle();

    expect(find.text('الخدمات المقدَّمة'), findsOneWidget);

    // «الاستعلامات» أسفل القائمة الكسولة. نحدد القائمة الخارجية صراحةً
    // لأن الصفحة تحوي شبكات قابلة للتمرير أيضاً.
    await tester.scrollUntilVisible(
      find.text('الاستعلامات'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('الاستعلامات'), findsOneWidget);
  });
}
