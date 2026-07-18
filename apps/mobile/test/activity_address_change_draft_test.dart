import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/features/activity_address_change/domain/activity_address_change_draft.dart';

void main() {
  test('serializes exactly the API-03 create contract', () {
    final draft = ActivityAddressChangeDraft(
      targets: [
        ActivityAddressTarget(
          activityId: '00000000-0000-4000-8000-000000000001',
          newAddress: ActivityAddress(district: ' مأرب ', street: ' الأربعين '),
        ),
      ],
    );
    expect(draft.toJson(), {
      'serviceType': 'activity_address_change',
      'schemaVersion': '1.0.0',
      'targets': [
        {
          'activityId': '00000000-0000-4000-8000-000000000001',
          'branchId': null,
          'newAddress': {
            'district': 'مأرب',
            'street': 'الأربعين',
            'neighborhood': null,
            'buildingNumber': null,
            'nearbyLandmark': null,
          },
        },
      ],
    });
  });

  test('rejects empty required text and duplicate targets', () {
    expect(
      () => ActivityAddress(district: ' ', street: 'x'),
      throwsArgumentError,
    );
    final target = ActivityAddressTarget(
      activityId: 'a',
      newAddress: ActivityAddress(district: 'd', street: 's'),
    );
    expect(
      () => ActivityAddressChangeDraft(targets: [target, target]),
      throwsArgumentError,
    );
  });
}
