import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/features/balaghs/domain/balagh_forms.dart';

/// البلاغات الستة (4.4). المخطط على الخادم `strict()`: أي حقل زائد أو ناقص
/// أو من نوع خاطئ يُرفض الطلب كله، فالتحويل هنا هو ما يقرّر نجاح الإرسال.
void main() {
  const activityId = '11111111-1111-4111-8111-111111111111';

  group('balaghTypes — تغطية الأنواع الستة', () {
    test('كل نوع من FR-201..206 له وصف حقول', () {
      for (final code in [
        'FR-201',
        'FR-202',
        'FR-203',
        'FR-204',
        'FR-205',
        'FR-206',
      ]) {
        final type = balaghTypeOf(code);
        expect(type, isNotNull, reason: '$code بلا وصف');
        expect(type!.fields, isNotEmpty);
      }
    });

    test('FR-206 وحده يُعالَج بلا نزول ميداني', () {
      expect(balaghTypeOf('FR-206')!.fieldVisit, isFalse);
      for (final code in ['FR-201', 'FR-202', 'FR-203', 'FR-204', 'FR-205']) {
        expect(balaghTypeOf(code)!.fieldVisit, isTrue, reason: code);
      }
    });

    test('نوع غير معروف يُرد null لا استثناء', () {
      expect(balaghTypeOf('FR-999'), isNull);
    });
  });

  group('buildBalaghPayload — مطابقة أنواع الخادم', () {
    test('FR-201 يرسل الأنشطة قائمةً والإقرار قيمةً منطقية', () {
      final payload = buildBalaghPayload(
        balaghTypeOf('FR-201')!,
        {
          'stopType': 'temporary',
          'stoppedAt': '2026-01-05',
          'reason': 'إيقاف للصيانة',
          'declarationConfirmed': 'true',
        },
        [activityId],
      );

      expect(payload['activityIds'], [activityId]);
      expect(payload['declarationConfirmed'], isTrue);
      expect(payload['declarationConfirmed'], isA<bool>());
      expect(payload['stoppedAt'], endsWith('Z'));
    });

    test('الإقرار غير المؤشَّر يُرسل false لا نصاً', () {
      final payload = buildBalaghPayload(
        balaghTypeOf('FR-201')!,
        {'stopType': 'temporary', 'reason': 'سبب'},
        [activityId],
      );

      expect(payload['declarationConfirmed'], isFalse);
    });

    test('FR-203 يرسل نشاطاً مفرداً لا قائمة', () {
      final payload = buildBalaghPayload(
        balaghTypeOf('FR-203')!,
        {'workerCount': '3'},
        [activityId],
      );

      expect(payload['activityId'], activityId);
      expect(payload.containsKey('activityIds'), isFalse);
      expect(payload['workerCount'], 3);
      expect(payload['workerCount'], isA<int>());
    });

    test('FR-204 يجمع حقول العنوان في كائن newAddress', () {
      final payload = buildBalaghPayload(
        balaghTypeOf('FR-204')!,
        {
          'district': 'مأرب',
          'street': 'شارع الوحدة',
          'neighborhood': 'الحي الشرقي',
          'occupancyType': 'rented',
          'startedAt': '2026-02-01',
        },
        [activityId],
      );

      final address = payload['newAddress'] as Map<String, dynamic>;
      expect(address['district'], 'مأرب');
      expect(address['street'], 'شارع الوحدة');
      expect(address['neighborhood'], 'الحي الشرقي');
      // occupancyType خارج العنوان في مخطط الخادم.
      expect(payload['occupancyType'], 'rented');
      expect(address.containsKey('occupancyType'), isFalse);
    });

    test('الحقل الاختياري الفارغ يُرسل null لا سلسلة فارغة', () {
      final payload = buildBalaghPayload(
        balaghTypeOf('FR-201')!,
        {'stopType': 'permanent', 'reason': 'سبب', 'notes': '   '},
        [activityId],
      );

      expect(payload.containsKey('notes'), isTrue);
      expect(payload['notes'], isNull);
    });

    test('الحقل الإلزامي الفارغ لا يُرسل مفتاحاً فارغاً', () {
      final payload = buildBalaghPayload(
        balaghTypeOf('FR-203')!,
        {'workerCount': ''},
        [activityId],
      );

      expect(payload.containsKey('workerCount'), isFalse);
    });

    test('التاريخ يُرسل بصيغة ISO بتوقيت UTC كما يشترط المخطط', () {
      final payload = buildBalaghPayload(
        balaghTypeOf('FR-206')!,
        {'startedAt': '2026-03-15', 'infoConfirmed': 'true'},
        [activityId],
      );

      final startedAt = payload['startedAt'] as String;
      expect(startedAt, endsWith('Z'));
      expect(DateTime.tryParse(startedAt), isNotNull);
    });

    test('FR-205 لا يُدرج مفتاح activityId لأنه بلاغ عقار لا نشاط', () {
      final payload = buildBalaghPayload(
        balaghTypeOf('FR-205')!,
        {
          'propertyType': 'شقة',
          'district': 'مأرب',
          'rentalStatus': 'شاغر',
          'priorOwnerName': 'المالك السابق',
          'newOwnerName': 'المالك الجديد',
          'newOwnerPhone': '+967770000000',
          'newOwnerAddress': 'مأرب',
          'transferType': 'بيع',
          'relationshipCode': 'seller',
          'transferDate': '2026-04-01',
        },
        const [],
      );

      expect(payload.containsKey('activityId'), isFalse);
      expect(payload.containsKey('activityIds'), isFalse);
      expect(payload['unitCount'], isNull);
    });

    test('عدد غير رقمي لا يُرسل نصاً مكان الرقم', () {
      final payload = buildBalaghPayload(
        balaghTypeOf('FR-202')!,
        {
          'propertyType': 'محل',
          'district': 'مأرب',
          'street': 'شارع',
          'tenantCount': 'اثنان',
          'ownershipDeclarationConfirmed': 'true',
        },
        const [],
      );

      expect(payload['tenantCount'], isNull);
    });
  });
}
