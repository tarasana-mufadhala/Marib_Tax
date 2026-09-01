import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:marib_tax_mobile/app/theme.dart';
import 'package:marib_tax_mobile/core/storage/token_store.dart';
import 'package:marib_tax_mobile/features/home/domain/home_models.dart';
import 'package:marib_tax_mobile/features/services/data/service_repository.dart';
import 'package:marib_tax_mobile/features/services/domain/service_models.dart';
import 'package:marib_tax_mobile/features/services/presentation/service_documents_page.dart';
import 'package:provider/provider.dart';

import 'support/fake_api.dart';

final _fr101 = ServiceDefinition.fromJson(
  Map<String, dynamic>.from(fakeServiceCatalog.first),
);
final _fr102 = ServiceDefinition.fromJson(
  Map<String, dynamic>.from(fakeServiceCatalog[1]),
);

const _draft = ServiceRequest(
  id: 'req-1',
  publicRef: 'REQ-TEST01',
  serviceCode: 'FR-101',
  status: RequestStatus.draft,
  form: {},
);

Widget wrap(
  Widget child, {
  Map<String, http.Response Function(http.Request request)> overrides = const {},
}) {
  final store = InMemoryTokenStore();
  return Provider<ServiceRepository>.value(
    value: ServiceRepository(api: fakeApiClient(store, overrides: overrides)),
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
  testWidgets('يُخفي البديل غير المختار: بالبطاقة لا يظهر الجواز', (tester) async {
    await tester.pumpWidget(wrap(ServiceDocumentsPage(
      service: _fr101,
      request: _draft,
      identityDocumentType: 'national_id',
    )));
    await tester.pumpAndSettle();

    expect(find.text('الهوية الشخصية — الوجه الأمامي'), findsOneWidget);
    expect(find.text('الهوية الشخصية — الوجه الخلفي'), findsOneWidget);
    expect(find.text('جواز السفر'), findsNothing);
  });

  testWidgets('بالجواز لا تظهر وجوه البطاقة', (tester) async {
    await tester.pumpWidget(wrap(ServiceDocumentsPage(
      service: _fr101,
      request: _draft,
      identityDocumentType: 'passport',
    )));
    await tester.pumpAndSettle();

    expect(find.text('جواز السفر'), findsOneWidget);
    expect(find.text('الهوية الشخصية — الوجه الأمامي'), findsNothing);
  });

  testWidgets('زر الإرسال معطّل ما دام هناك نقص', (tester) async {
    await tester.pumpWidget(wrap(ServiceDocumentsPage(
      service: _fr101,
      request: _draft,
      identityDocumentType: 'national_id',
    )));
    await tester.pumpAndSettle();

    expect(find.textContaining('ينقص الطلب 1'), findsOneWidget);

    // التنبيه والزر أسفل قائمة كسولة، فنمرّر حتى يظهر التنبيه.
    final hint = find.textContaining('لا يمكن إرسال الطلب قبل إرفاق');
    await tester.scrollUntilVisible(hint, 150);
    await tester.pumpAndSettle();

    expect(hint, findsOneWidget);
    expect(
      tester
          .widget<FilledButton>(find.widgetWithText(FilledButton, 'إرسال الطلب'))
          .onPressed,
      isNull,
      reason: 'الزر يجب أن يكون معطّلاً',
    );
  });

  testWidgets('الطلب المستوفي يُفعّل الإرسال ويعرض حالة الجاهزية',
      (tester) async {
    await tester.pumpWidget(wrap(
      ServiceDocumentsPage(
        service: _fr101,
        request: _draft,
        identityDocumentType: 'national_id',
      ),
      overrides: {
        'GET /api/v1/service-requests/req-1/missing-documents': (_) =>
            jsonResponse([]),
      },
    ));
    await tester.pumpAndSettle();

    expect(find.text('الطلب مستوفٍ وجاهز للإرسال'), findsOneWidget);
    final submitButton = find.widgetWithText(FilledButton, 'إرسال الطلب');
    await tester.scrollUntilVisible(submitButton, 150);
    await tester.pumpAndSettle();
    expect(tester.widget<FilledButton>(submitButton).onPressed, isNotNull);
  });

  testWidgets('مستندات الشركات تظهر كإلزامية للشركة وكاختيارية للفرد',
      (tester) async {
    const draft102 = ServiceRequest(
      id: 'req-1',
      publicRef: 'REQ-TEST02',
      serviceCode: 'FR-102',
      status: RequestStatus.draft,
      form: {},
    );

    await tester.pumpWidget(wrap(
      ServiceDocumentsPage(service: _fr102, request: draft102, isCompany: true),
      overrides: {
        'GET /api/v1/service-requests/req-1/missing-documents': (_) =>
            jsonResponse([]),
      },
    ));
    await tester.pumpAndSettle();
    expect(find.text('إلزامي للشركات'), findsOneWidget);

    await tester.pumpWidget(wrap(
      ServiceDocumentsPage(service: _fr102, request: draft102),
      overrides: {
        'GET /api/v1/service-requests/req-1/missing-documents': (_) =>
            jsonResponse([]),
      },
    ));
    await tester.pumpAndSettle();
    // للفرد: المستند معروض لكن غير إلزامي.
    expect(find.text('النظام الأساسي'), findsOneWidget);
    expect(find.text('اختياري'), findsWidgets);
  });

  testWidgets('رفض الخادم للتقديم يعرض المستندات الناقصة بالاسم',
      (tester) async {
    await tester.pumpWidget(wrap(
      ServiceDocumentsPage(
        service: _fr101,
        request: _draft,
        identityDocumentType: 'national_id',
      ),
      overrides: {
        // الواجهة تظنه مستوفياً، والخادم يبقى الحكم.
        'GET /api/v1/service-requests/req-1/missing-documents': (_) =>
            jsonResponse([]),
        'POST /api/v1/service-requests/req-1/submit': (_) =>
            missingDocumentsError([
              ('commercial_register', 'صورة السجل التجاري'),
            ]),
      },
    ));
    await tester.pumpAndSettle();

    final submitButton = find.widgetWithText(FilledButton, 'إرسال الطلب');
    await tester.scrollUntilVisible(submitButton, 150);
    await tester.pumpAndSettle();
    await tester.tap(submitButton);
    await tester.pumpAndSettle();

    expect(find.textContaining('صورة السجل التجاري'), findsWidgets);
  });

  testWidgets('يعرض المرفقات المرفوعة مسبقاً بعلامة إتمام', (tester) async {
    await tester.pumpWidget(wrap(
      ServiceDocumentsPage(
        service: _fr101,
        request: _draft,
        identityDocumentType: 'national_id',
      ),
      overrides: {
        'GET /api/v1/service-requests/req-1/attachments': (_) => jsonResponse([
              {
                'id': 'att-1',
                'fileName': 'register.pdf',
                'documentCode': 'commercial_register',
                'sizeBytes': 1024,
              },
            ]),
        'GET /api/v1/service-requests/req-1/missing-documents': (_) =>
            jsonResponse([]),
      },
    ));
    await tester.pumpAndSettle();

    expect(find.text('register.pdf'), findsOneWidget);
    expect(find.text('استبدال'), findsOneWidget);
  });
}
