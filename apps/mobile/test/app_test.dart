import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/main.dart';

void main() {
  testWidgets('renders the Arabic-first draft foundation in RTL', (
    tester,
  ) async {
    await tester.pumpWidget(const MaribTaxApp());
    expect(find.text('إخطار تغيير عنوان النشاط'), findsOneWidget);
    final direction = tester.widget<Directionality>(
      find.byType(Directionality).first,
    );
    expect(direction.textDirection, TextDirection.rtl);
  });
}
