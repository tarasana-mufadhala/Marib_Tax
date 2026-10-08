import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/features/account/data/account_repository.dart';

AccountActivity activity(String? statusCode) =>
    AccountActivity(id: 'a-1', name: 'TEST-Shop', statusCode: statusCode);

void main() {
  test('النشاط المسجَّل حديثاً (pending) يظهر «قيد المراجعة» لا الرمز الخام', () {
    expect(activity('pending').statusLabel, 'قيد المراجعة');
  });

  test('بقية الحالات المعروفة بالعربية', () {
    expect(activity('active').statusLabel, 'نشط');
    expect(activity('suspended').statusLabel, 'موقوف');
    expect(activity('under_review').statusLabel, 'قيد المراجعة');
  });

  test('الحالة الغائبة تظهر شرطة', () {
    expect(activity(null).statusLabel, '—');
  });
}
