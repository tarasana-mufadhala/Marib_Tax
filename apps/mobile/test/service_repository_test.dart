import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/core/api/api_exception.dart';
import 'package:marib_tax_mobile/core/storage/token_store.dart';
import 'package:marib_tax_mobile/features/services/data/service_repository.dart';
import 'package:marib_tax_mobile/features/services/domain/service_models.dart';

import 'support/fake_api.dart';

ServiceRepository build(
  InMemoryTokenStore store, {
  Map<String, dynamic> overrides = const {},
}) =>
    ServiceRepository(api: fakeApiClient(store, overrides: overrides.cast()));

void main() {
  group('الكتالوج', () {
    test('يُقرأ من الخادم بمستنداته وشروط إلزامها', () async {
      final catalog = await build(InMemoryTokenStore()).catalog();

      expect(catalog, hasLength(2));
      final fr101 = catalog.firstWhere((s) => s.code == 'FR-101');
      expect(fr101.title, 'فتح ملف ضريبي');
      expect(fr101.acceptanceNote, contains('لا يُقبل الطلب'));
      expect(fr101.documents, hasLength(5));

      final register = fr101.documents.firstWhere((d) => d.code == 'commercial_register');
      expect(register.requirement, DocumentRequirement.required$);
      expect(register.requirementLabel, 'إلزامي');
    });

    test('يتعرّف على المستندات المشروطة', () async {
      final catalog = await build(InMemoryTokenStore()).catalog();
      final fr101 = catalog.firstWhere((s) => s.code == 'FR-101');
      final fr102 = catalog.firstWhere((s) => s.code == 'FR-102');

      expect(fr101.requiresIdentityChoice, isTrue);
      expect(fr101.hasCompanyDocuments, isFalse);
      expect(fr102.hasCompanyDocuments, isTrue);

      final lease = fr101.documents.firstWhere((d) => d.code == 'lease_contract');
      expect(lease.requirement, DocumentRequirement.optional);
      expect(lease.requirementLabel, 'اختياري');

      final articles = fr102.documents.firstWhere((d) => d.code == 'articles_of_association');
      expect(articles.requirementLabel, 'إلزامي للشركات');
    });

    test('انتهاء الجلسة يعطي رسالة عربية واضحة', () async {
      final store = InMemoryTokenStore();
      await store.write('expired');
      final repository = build(store, overrides: {
        'GET /api/v1/service-requests/catalog': (_) =>
            apiError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.'),
      });

      await expectLater(
        repository.catalog(),
        throwsA(isA<ApiException>().having((e) => e.isUnauthenticated, 'انتهت الجلسة', isTrue)),
      );
      // الرمز يُمسح حتى لا يُعاد إرسال جلسة ميتة.
      expect(await store.read(), isNull);
    });
  });

  group('دورة حياة الطلب', () {
    test('إنشاء مسودة يعيد مرجعاً علنياً وحالة draft', () async {
      final draft = await build(InMemoryTokenStore()).createDraft(
        serviceCode: 'FR-101',
        form: {'activityName': 'بقالة'},
      );

      expect(draft.id, 'req-1');
      expect(draft.publicRef, 'REQ-TEST01');
      expect(draft.isDraft, isTrue);
    });

    test('المستندات الناقصة تُقرأ بأسمائها العربية', () async {
      final missing = await build(InMemoryTokenStore()).missingDocuments('req-1');

      expect(missing, hasLength(1));
      expect(missing.first.code, 'commercial_register');
      expect(missing.first.label, 'صورة السجل التجاري');
    });

    test('رفع مستند يعيد المرفق برمزه', () async {
      final attachment = await build(InMemoryTokenStore()).uploadDocument(
        requestId: 'req-1',
        documentCode: 'commercial_register',
        bytes: [1, 2, 3],
        filename: 'register.pdf',
        contentType: 'application/pdf',
      );

      expect(attachment.id, 'att-1');
      expect(attachment.documentCode, 'commercial_register');
      expect(attachment.sizeBytes, 3);
    });

    test('التقديم الناجح يغيّر الحالة إلى submitted', () async {
      final submitted = await build(InMemoryTokenStore()).submit('req-1');

      expect(submitted.status.code, 'submitted');
      expect(submitted.isDraft, isFalse);
    });
  });

  group('رفض التقديم لنقص المستندات', () {
    test('الخطأ يحمل قائمة الناقص لا رسالة عامة', () async {
      final repository = build(InMemoryTokenStore(), overrides: {
        'POST /api/v1/service-requests/req-1/submit': (_) => missingDocumentsError([
              ('national_id_front', 'الهوية الشخصية — الوجه الأمامي'),
              ('commercial_register', 'صورة السجل التجاري'),
            ]),
      });

      try {
        await repository.submit('req-1');
        fail('كان يجب أن يُرفض التقديم');
      } on ApiException catch (error) {
        expect(error.statusCode, 422);
        final missing = error.missingDocuments;
        expect(missing, hasLength(2));
        expect(missing.map((d) => d.code),
            containsAll(['national_id_front', 'commercial_register']));
        expect(missing.first.label, isNotEmpty);
      }
    });

    test('خطأ بلا تفاصيل يعطي قائمة فارغة لا انهياراً', () async {
      final repository = build(InMemoryTokenStore(), overrides: {
        'POST /api/v1/service-requests/req-1/submit': (_) =>
            apiError(409, 'CONFLICT', 'هذا الطلب مُقدَّم مسبقاً'),
      });

      try {
        await repository.submit('req-1');
        fail('كان يجب أن يُرفض');
      } on ApiException catch (error) {
        expect(error.missingDocuments, isEmpty);
        expect(error.message, 'هذا الطلب مُقدَّم مسبقاً');
      }
    });

    test('رفع مستند على طلب غير مملوك يُرفض برسالة صلاحيات', () async {
      final repository = build(InMemoryTokenStore(), overrides: {
        'POST /api/v1/service-requests/req-1/attachments': (_) =>
            apiError(403, 'ACCESS_DENIED', 'Forbidden'),
      });

      await expectLater(
        repository.uploadDocument(
          requestId: 'req-1',
          documentCode: 'commercial_register',
          bytes: [1],
          filename: 'x.pdf',
          contentType: 'application/pdf',
        ),
        throwsA(isA<ApiException>().having((e) => e.isForbidden, 'ممنوع', isTrue)),
      );
    });
  });
}
