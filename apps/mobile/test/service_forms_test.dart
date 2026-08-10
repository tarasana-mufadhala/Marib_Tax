import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/features/services/domain/service_forms.dart';

void main() {
  group('serviceFormFields — تغطية الخدمات الخمس', () {
    test('لكل خدمة حقول معرَّفة', () {
      for (final code in ['FR-101', 'FR-102', 'FR-103', 'FR-104', 'FR-105']) {
        expect(serviceFormFields[code], isNotNull, reason: '$code بلا حقول');
        expect(serviceFormFields[code]!, isNotEmpty);
      }
    });

    test('FR-101 يطلب اختيار وثيقة الهوية', () {
      final names = serviceFormFields['FR-101']!.map((f) => f.name);
      expect(names, contains('identityDocumentType'));
    });

    test('FR-102 يطلب تحديد طبيعة النشاط لأن مستندات الشركات تعتمد عليه', () {
      final names = serviceFormFields['FR-102']!.map((f) => f.name);
      expect(names, contains('isCompany'));
    });
  });

  group('buildFormPayload — تحويل القيم لأنواع الخادم', () {
    test('يحوّل الاختيار المنطقي إلى bool لا نص', () {
      final payload = buildFormPayload('FR-102', {
        'tradeNameRegistrationNumber': 'TN-1',
        'practiceLicenseNumber': 'PL-1',
        'isCompany': 'true',
      });

      expect(payload['isCompany'], isTrue);
      expect(payload['isCompany'], isA<bool>());
    });

    test('يحوّل العدد إلى int لا نص', () {
      final payload = buildFormPayload('FR-102', {
        'tradeNameRegistrationNumber': 'TN-1',
        'practiceLicenseNumber': 'PL-1',
        'isCompany': 'false',
        'partnerCount': '3',
      });

      expect(payload['partnerCount'], 3);
      expect(payload['partnerCount'], isA<int>());
    });

    test('يحوّل التاريخ إلى ISO 8601 بالتوقيت العالمي', () {
      final payload = buildFormPayload('FR-101', {
        'identityDocumentType': 'national_id',
        'activityName': 'بقالة',
        'commercialRegisterNumber': 'CR-1',
        'district': 'الوادي',
        'street': 'الشارع',
        'premisesOwnership': 'rented',
        'startedAt': '2026-01-15',
      });

      final startedAt = payload['startedAt'] as String;
      expect(startedAt, endsWith('Z'));
      expect(DateTime.tryParse(startedAt), isNotNull);
    });

    test('الحقل الاختياري الفارغ يُرسل null لا سلسلة فارغة', () {
      // مخطط الخادم يرفض السلسلة الفارغة ويقبل null.
      final payload = buildFormPayload('FR-101', {
        'identityDocumentType': 'national_id',
        'activityName': 'بقالة',
        'activityDescription': '',
        'commercialRegisterNumber': 'CR-1',
        'district': 'الوادي',
        'street': 'الشارع',
        'nearbyLandmark': '   ',
        'premisesOwnership': 'rented',
        'startedAt': '2026-01-15',
      });

      expect(payload.containsKey('activityDescription'), isTrue);
      expect(payload['activityDescription'], isNull);
      expect(payload['nearbyLandmark'], isNull);
    });

    test('الحقل الإلزامي الفارغ لا يُرسل إطلاقاً فيرفضه الخادم بوضوح', () {
      final payload = buildFormPayload('FR-101', {
        'identityDocumentType': 'national_id',
        'activityName': '',
      });

      expect(payload.containsKey('activityName'), isFalse);
    });

    test('يتجاهل الحقول التي ليست من نموذج الخدمة', () {
      final payload = buildFormPayload('FR-103', {
        'lossReason': 'فقدان',
        'isCompany': 'false',
        'someUnrelatedField': 'x',
      });

      expect(payload.containsKey('someUnrelatedField'), isFalse);
      expect(payload['lossReason'], 'فقدان');
    });

    test('يشذّب المسافات الزائدة', () {
      final payload = buildFormPayload('FR-103', {
        'lossReason': '  فقدان البطاقة  ',
        'isCompany': 'false',
      });

      expect(payload['lossReason'], 'فقدان البطاقة');
    });
  });
}
