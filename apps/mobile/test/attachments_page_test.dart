import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/features/attachments/domain/attachment_models.dart';
import 'package:marib_tax_mobile/features/attachments/presentation/attachments_page.dart';

void main() {
  Widget subject() => const MaterialApp(home: AttachmentsPage());

  test('uses canonical attachment classification codes and Arabic labels', () {
    expect(AttachmentClassification.values.map((value) => value.code), [
      'internal',
      'confidential',
      'highly_sensitive',
    ]);
    expect(AttachmentClassification.values.map((value) => value.label), [
      'داخلي',
      'سري',
      'شديد الحساسية',
    ]);
    expect(
      AttachmentClassification.values.map((value) => value.code),
      isNot(containsAll(['public', 'private', 'sensitive'])),
    );
  });

  test('uses canonical business document category codes', () {
    expect(AttachmentCategory.values.map((value) => value.code), [
      'identity_document',
      'tax_document',
      'financial_evidence',
      'correspondence',
      'license',
      'supporting_document',
    ]);
  });

  testWidgets('picker preview requires a category and never exposes a path', (
    tester,
  ) async {
    await tester.pumpWidget(subject());
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('mock-picker')));
    await tester.pump();
    expect(find.text('إقرار-ضريبي-تجريبي.pdf'), findsOneWidget);
    expect(find.text('اختر نوع المرفق للمتابعة.'), findsOneWidget);
    expect(find.textContaining('/storage/'), findsNothing);
    expect(
      tester
          .widget<FilledButton>(find.byKey(const Key('mock-upload')))
          .onPressed,
      isNull,
    );
  });

  testWidgets('shows denied and offline retry-safe states', (tester) async {
    await tester.pumpWidget(subject());
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('مرفق غير متاح'));
    await tester.tap(find.text('مرفق غير متاح'));
    await tester.pumpAndSettle();
    expect(find.textContaining('ليست لديك صلاحية'), findsOneWidget);
    await tester.tap(find.byKey(const Key('offline-toggle')));
    await tester.pump();
    expect(find.text('لا يوجد اتصال'), findsOneWidget);
    expect(find.text('إعادة المحاولة'), findsOneWidget);
  });

  testWidgets('exposes version history and correction flow', (tester) async {
    await tester.pumpWidget(subject());
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('السجل التجاري.pdf'));
    await tester.tap(find.text('السجل التجاري.pdf'));
    await tester.pumpAndSettle();
    expect(find.text('الإصدار 2 — نسخة مصححة'), findsOneWidget);
    await tester.drag(find.byType(ListView), const Offset(0, -400));
    await tester.pumpAndSettle();
    await tester.tap(find.text('إضافة نسخة مصححة'));
    await tester.pump();
    expect(find.textContaining('نسخة مصححة تجريبية'), findsOneWidget);
  });
}
