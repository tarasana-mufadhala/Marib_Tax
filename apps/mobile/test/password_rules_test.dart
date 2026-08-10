import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/features/auth/domain/password_rules.dart';

/// القاعدة هنا يجب أن تطابق SecurityService.validatePasswordStrength في الـ API؛
/// أي تراخٍ فيها يعني قبول كلمة مرور يرفضها الخادم برسالة عامة.
void main() {
  group('PasswordRules.validate — الرفض', () {
    test('الفارغة تُرفض', () {
      expect(PasswordRules.validate(''), 'كلمة المرور مطلوبة');
      expect(PasswordRules.validate(null), 'كلمة المرور مطلوبة');
    });

    test('الأقصر من 8 خانات تُرفض', () {
      expect(PasswordRules.validate('Ab1@567'), contains('8'));
    });

    test('بلا حرف كبير تُرفض', () {
      expect(PasswordRules.validate('passw0rd@'), contains('كبير'));
    });

    test('بلا حرف صغير تُرفض', () {
      expect(PasswordRules.validate('PASSW0RD@'), contains('صغير'));
    });

    test('بلا رقم تُرفض', () {
      expect(PasswordRules.validate('Password@'), contains('رقم'));
    });

    test('بلا رمز خاص تُرفض — وهي الحالة التي كان الخادم يرفضها', () {
      expect(PasswordRules.validate('Passw0rd1'), contains('رمز خاص'));
    });
  });

  group('PasswordRules.validate — القبول', () {
    test('المستوفية لكل الشروط تُقبل', () {
      expect(PasswordRules.validate('Marib@2026'), isNull);
      expect(PasswordRules.validate('Passw0rd!'), isNull);
    });
  });

  group('PasswordRules.validateConfirmation', () {
    test('التأكيد الفارغ يُرفض', () {
      expect(PasswordRules.validateConfirmation('Marib@2026', ''),
          'تأكيد كلمة المرور مطلوب');
    });

    test('عدم التطابق يُرفض', () {
      expect(PasswordRules.validateConfirmation('Marib@2026', 'Marib@2027'),
          'كلمتا المرور غير متطابقتين');
    });

    test('التطابق يُقبل', () {
      expect(PasswordRules.validateConfirmation('Marib@2026', 'Marib@2026'),
          isNull);
    });
  });
}
