import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/features/auth/domain/yemeni_phone.dart';

void main() {
  group('YemeniPhone — قبول الصيغ الصحيحة', () {
    test('الصيغة المحلية 7XXXXXXXX تُطبَّع إلى E.164', () {
      expect(YemeniPhone.tryParse('771234567')?.e164, '+967771234567');
    });

    test('الصيغة الدولية بعلامة + تُقبل كما هي', () {
      expect(YemeniPhone.tryParse('+967771234567')?.e164, '+967771234567');
    });

    test('الصيغة بلا علامة + تُقبل', () {
      expect(YemeniPhone.tryParse('967771234567')?.e164, '+967771234567');
    });

    test('البادئة 00 تُقبل', () {
      expect(YemeniPhone.tryParse('00967771234567')?.e164, '+967771234567');
    });

    test('المسافات والشرطات والأقواس تُتجاهل', () {
      expect(YemeniPhone.tryParse('77 123-4567')?.e164, '+967771234567');
      expect(YemeniPhone.tryParse('(771) 234 567')?.e164, '+967771234567');
    });

    test('الأرقام العربية الشرقية تُحوَّل', () {
      expect(YemeniPhone.tryParse('٧٧١٢٣٤٥٦٧')?.e164, '+967771234567');
    });

    test('يعيد الصيغة المحلية للعرض', () {
      expect(YemeniPhone.tryParse('771234567')?.local, '771234567');
    });
  });

  group('YemeniPhone — رفض الصيغ الخاطئة', () {
    test('رقم لا يبدأ بـ 7 يُرفض', () {
      expect(YemeniPhone.tryParse('112345678'), isNull);
      expect(YemeniPhone.tryParse('012345678'), isNull);
    });

    test('عدد خانات ناقص أو زائد يُرفض', () {
      expect(YemeniPhone.tryParse('77123456'), isNull);
      expect(YemeniPhone.tryParse('7712345678'), isNull);
    });

    test('مفتاح دولة آخر يُرفض', () {
      expect(YemeniPhone.tryParse('+966771234567'), isNull);
    });

    test('الفارغ و null يُرفضان', () {
      expect(YemeniPhone.tryParse(''), isNull);
      expect(YemeniPhone.tryParse(null), isNull);
    });

    test('الحروف تُرفض', () {
      expect(YemeniPhone.tryParse('77abcdefg'), isNull);
    });
  });

  group('YemeniPhone.validate — رسائل الحقل', () {
    test('الفارغ يعطي رسالة «مطلوب»', () {
      expect(YemeniPhone.validate(''), 'رقم الهاتف مطلوب');
      expect(YemeniPhone.validate('   '), 'رقم الهاتف مطلوب');
    });

    test('غير الصالح يعطي رسالة إرشادية', () {
      expect(YemeniPhone.validate('123'), contains('يبدأ بـ 7'));
    });

    test('الصالح لا يعطي رسالة', () {
      expect(YemeniPhone.validate('771234567'), isNull);
    });
  });
}
