/// Local mock display models for owned masterdata read data.
/// No network, database, or credential access.
class CommercialActivityMock {
  CommercialActivityMock({
    required this.id,
    required this.taxpayerId,
    required this.name,
    required this.statusCode,
    this.publicRef,
  }) {
    if (id.trim().isEmpty) throw ArgumentError.value(id, 'id');
    if (name.trim().isEmpty) throw ArgumentError.value(name, 'name');
  }

  final String id;
  final String? publicRef;
  final String taxpayerId;
  final String name;
  final String statusCode;

  Map<String, Object?> toJson() => {
    'id': id,
    'publicRef': publicRef,
    'taxpayerId': taxpayerId,
    'name': name,
    'statusCode': statusCode,
  };
}

class PropertyMock {
  PropertyMock({
    required this.id,
    required this.statusCode,
    this.publicRef,
    this.description,
  }) {
    if (id.trim().isEmpty) throw ArgumentError.value(id, 'id');
  }

  final String id;
  final String? publicRef;
  final String statusCode;
  final String? description;

  Map<String, Object?> toJson() => {
    'id': id,
    'publicRef': publicRef,
    'statusCode': statusCode,
    'description': description,
  };
}

class PropertyOwnershipMock {
  PropertyOwnershipMock({
    required this.id,
    required this.propertyId,
    required this.taxpayerId,
    required this.partyRoleCode,
    required this.isCurrent,
  }) {
    if (id.trim().isEmpty) throw ArgumentError.value(id, 'id');
    if (partyRoleCode.trim().isEmpty) {
      throw ArgumentError.value(partyRoleCode, 'partyRoleCode');
    }
  }

  final String id;
  final String propertyId;
  final String taxpayerId;
  final String partyRoleCode;
  final bool isCurrent;

  /// Report matrix field key `activity_id` companion ownership marker.
  static const reportFieldTaxpayerId = 'taxpayer_id';

  Map<String, Object?> toJson() => {
    'id': id,
    'propertyId': propertyId,
    'taxpayerId': taxpayerId,
    'partyRoleCode': partyRoleCode,
    'isCurrent': isCurrent,
  };
}

class OwnedMasterdataBundleMock {
  OwnedMasterdataBundleMock({
    required List<CommercialActivityMock> activities,
    required List<PropertyMock> properties,
    required List<PropertyOwnershipMock> ownershipRecords,
  }) : activities = List.unmodifiable(activities),
       properties = List.unmodifiable(properties),
       ownershipRecords = List.unmodifiable(ownershipRecords);

  final List<CommercialActivityMock> activities;
  final List<PropertyMock> properties;
  final List<PropertyOwnershipMock> ownershipRecords;

  static OwnedMasterdataBundleMock demo() => OwnedMasterdataBundleMock(
    activities: [
      CommercialActivityMock(
        id: '11111111-1111-4111-8111-111111111111',
        publicRef: 'MOCK-A-1',
        taxpayerId: '22222222-2222-4222-8222-222222222222',
        name: 'نشاط تجريبي',
        statusCode: 'active',
      ),
    ],
    properties: [
      PropertyMock(
        id: '33333333-3333-4333-8333-333333333333',
        publicRef: 'MOCK-P-1',
        statusCode: 'active',
        description: 'عقار تجريبي',
      ),
    ],
    ownershipRecords: [
      PropertyOwnershipMock(
        id: '55555555-5555-4555-8555-555555555555',
        propertyId: '33333333-3333-4333-8333-333333333333',
        taxpayerId: '22222222-2222-4222-8222-222222222222',
        partyRoleCode: 'owner',
        isCurrent: true,
      ),
    ],
  );
}
