import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/core/design/otp_field.dart';

void main() {
  late String value;
  late List<String> completed;

  Future<void> pump(WidgetTester tester) async {
    value = '';
    completed = [];
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: OtpField(
          onChanged: (v) => value = v,
          onCompleted: completed.add,
        ),
      ),
    ));
    await tester.pump();
  }

  Finder box(int i) => find.byType(TextField).at(i);
  String textOf(WidgetTester tester, int i) =>
      tester.widget<TextField>(box(i)).controller!.text;
  bool focused(WidgetTester tester, int i) =>
      tester.widget<TextField>(box(i)).focusNode!.hasFocus;

  testWidgets('الخانة الأولى مركَّزة عند الفتح', (tester) async {
    await pump(tester);
    expect(focused(tester, 0), isTrue);
  });

  testWidgets('لصق الرمز كاملاً في خانة واحدة يوزّعه على الخانات ويُكمل', (tester) async {
    await pump(tester);
    await tester.enterText(box(0), '123456');
    await tester.pump();

    expect([for (var i = 0; i < 6; i++) textOf(tester, i)], ['1', '2', '3', '4', '5', '6']);
    expect(value, '123456');
    expect(completed, ['123456']);
  });

  testWidgets('الكتابة رقماً رقماً تنقل التركيز للخانة التالية', (tester) async {
    await pump(tester);
    await tester.enterText(box(0), '7');
    await tester.pump();

    expect(textOf(tester, 0), '7');
    expect(focused(tester, 1), isTrue);
    expect(value, '7');
  });

  testWidgets('الكتابة فوق رقم موجود تستبدله', (tester) async {
    await pump(tester);
    await tester.enterText(box(0), '7');
    await tester.pump();
    await tester.enterText(box(0), '78');
    await tester.pump();

    expect(textOf(tester, 0), '8');
    expect(textOf(tester, 1), '');
  });

  testWidgets('الحذف من خانة فارغة يرجع للسابقة ويمسحها', (tester) async {
    await pump(tester);
    await tester.enterText(box(0), '1');
    await tester.pump();
    await tester.enterText(box(1), '2');
    await tester.pump();
    expect(focused(tester, 2), isTrue);

    await tester.sendKeyEvent(LogicalKeyboardKey.backspace);
    await tester.pump();

    expect(focused(tester, 1), isTrue);
    expect(textOf(tester, 1), '');
    expect(value, '1');
  });
}
