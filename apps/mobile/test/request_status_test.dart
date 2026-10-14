import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/features/home/domain/home_models.dart';

void main() {
  group('RequestStatus — تطابق حالات القسم 4.6', () {
    test('كل رمز في المستند له تسمية عربية', () {
      const codes = [
        'draft',
        'submitted',
        'received',
        'under_review',
        'need_more_info',
        'field_visit_scheduled',
        'field_visit_done',
        'payment_required',
        'ready_for_pickup',
        'approved',
        'completed',
        'rejected',
        'archived',
        'cancelled',
      ];
      for (final code in codes) {
        final status = RequestStatus.fromCode(code);
        expect(status, isNot(RequestStatus.unknown), reason: 'الرمز $code غير معروف');
        expect(status.label, isNotEmpty);
      }
    });

    test('الرمز المجهول لا يُسقط الواجهة بل يُعرض كـ «غير معروف»', () {
      expect(RequestStatus.fromCode('something_else'), RequestStatus.unknown);
      expect(RequestStatus.fromCode(null), RequestStatus.unknown);
      expect(RequestStatus.fromCode(''), RequestStatus.unknown);
    });

    test('حالة الرمز الكبير/الصغير لا تؤثر', () {
      expect(RequestStatus.fromCode('UNDER_REVIEW'), RequestStatus.underReview);
      expect(RequestStatus.fromCode(' Payment_Required '), RequestStatus.paymentRequired);
    });

    test('الحالات المنتهية مصنّفة مغلقة', () {
      for (final status in [
        RequestStatus.completed,
        RequestStatus.approved,
        RequestStatus.rejected,
        RequestStatus.archived,
        RequestStatus.cancelled,
      ]) {
        expect(status.isClosed, isTrue, reason: '${status.code} يجب أن تكون مغلقة');
      }
      expect(RequestStatus.underReview.isClosed, isFalse);
    });

    test('الحالات التي تتطلب إجراءً من المكلف محدَّدة بدقة', () {
      expect(RequestStatus.needMoreInfo.needsTaxpayerAction, isTrue);
      expect(RequestStatus.paymentRequired.needsTaxpayerAction, isTrue);
      expect(RequestStatus.readyForPickup.needsTaxpayerAction, isTrue);
      expect(RequestStatus.underReview.needsTaxpayerAction, isFalse);
      expect(RequestStatus.completed.needsTaxpayerAction, isFalse);
    });
  });

  group('RequestSummary.fromJson', () {
    test('يقرأ صيغة camelCase وsnake_case معاً', () {
      final camel = RequestSummary.fromJson({
        'id': '1',
        'publicRef': 'REQ-1',
        'statusCode': 'under_review',
        'serviceTypeName': 'فتح ملف',
      });
      final snake = RequestSummary.fromJson({
        'id': '1',
        'public_ref': 'REQ-1',
        'status_code': 'under_review',
        'service_type_name': 'فتح ملف',
      });

      expect(camel.publicRef, 'REQ-1');
      expect(snake.publicRef, 'REQ-1');
      expect(camel.status, RequestStatus.underReview);
      expect(snake.status, RequestStatus.underReview);
    });

    test('الحقول الناقصة لا تُسقط التحويل', () {
      final summary = RequestSummary.fromJson({'id': '1'});
      expect(summary.publicRef, '—');
      expect(summary.status, RequestStatus.unknown);
      expect(summary.submittedAt, isNull);
    });
  });
}
