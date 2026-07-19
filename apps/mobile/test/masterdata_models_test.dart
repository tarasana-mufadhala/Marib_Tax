import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/features/masterdata/domain/masterdata_models.dart';

void main() {
  test('rejects empty activity names', () {
    expect(
      () => CommercialActivityMock(
        id: '1',
        taxpayerId: '2',
        name: '   ',
        statusCode: 'active',
      ),
      throwsArgumentError,
    );
  });

  test('demo bundle exposes current ownership for owned property', () {
    final demo = OwnedMasterdataBundleMock.demo();
    expect(demo.activities.single.name, 'نشاط تجريبي');
    expect(demo.ownershipRecords.single.isCurrent, isTrue);
    expect(PropertyOwnershipMock.reportFieldTaxpayerId, 'taxpayer_id');
  });
}
