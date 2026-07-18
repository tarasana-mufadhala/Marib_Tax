class ActivityAddressChangeDraft {
  ActivityAddressChangeDraft({required List<ActivityAddressTarget> targets})
    : targets = List.unmodifiable(targets) {
    if (targets.isEmpty) throw ArgumentError.value(targets, 'targets');
    final keys = targets.map(
      (target) => '${target.activityId}:${target.branchId ?? ''}',
    );
    if (keys.toSet().length != targets.length) {
      throw ArgumentError.value(
        targets,
        'targets',
        'Duplicate activity and branch target.',
      );
    }
  }

  static const serviceType = 'activity_address_change';
  static const schemaVersion = '1.0.0';
  final List<ActivityAddressTarget> targets;

  Map<String, Object> toJson() => {
    'serviceType': serviceType,
    'schemaVersion': schemaVersion,
    'targets': targets.map((target) => target.toJson()).toList(growable: false),
  };
}

class ActivityAddressTarget {
  ActivityAddressTarget({
    required this.activityId,
    this.branchId,
    required this.newAddress,
  }) {
    if (activityId.trim().isEmpty) {
      throw ArgumentError.value(activityId, 'activityId');
    }
  }

  final String activityId;
  final String? branchId;
  final ActivityAddress newAddress;

  Map<String, Object?> toJson() => {
    'activityId': activityId,
    'branchId': branchId,
    'newAddress': newAddress.toJson(),
  };
}

class ActivityAddress {
  ActivityAddress({
    required String district,
    required String street,
    String? neighborhood,
    String? buildingNumber,
    String? nearbyLandmark,
  }) : district = _required(district, 'district'),
       street = _required(street, 'street'),
       neighborhood = _optional(neighborhood),
       buildingNumber = _optional(buildingNumber),
       nearbyLandmark = _optional(nearbyLandmark);

  final String district;
  final String street;
  final String? neighborhood;
  final String? buildingNumber;
  final String? nearbyLandmark;

  Map<String, Object?> toJson() => {
    'district': district,
    'street': street,
    'neighborhood': neighborhood,
    'buildingNumber': buildingNumber,
    'nearbyLandmark': nearbyLandmark,
  };

  static String _required(String value, String field) {
    final normalized = value.trim();
    if (normalized.isEmpty) throw ArgumentError.value(value, field);
    return normalized;
  }

  static String? _optional(String? value) {
    final normalized = value?.trim();
    return normalized == null || normalized.isEmpty ? null : normalized;
  }
}
