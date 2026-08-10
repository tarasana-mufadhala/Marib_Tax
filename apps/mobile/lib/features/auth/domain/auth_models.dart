/// كيان قانوني يُعبَّأ في القائمة المنسدلة بشاشة التسجيل (FR-001 بند 8).
/// المصدر هو ما يُنشئه الأدمن من لوحة التحكم، لا قائمة ثابتة في التطبيق.
class LegalEntityOption {
  const LegalEntityOption({required this.id, required this.name});

  final String id;
  final String name;

  factory LegalEntityOption.fromJson(Map<String, dynamic> json) =>
      LegalEntityOption(
        id: json['id'] as String,
        name: (json['legalName'] ?? json['legal_name'] ?? '—') as String,
      );

  @override
  bool operator ==(Object other) =>
      other is LegalEntityOption && other.id == id;

  @override
  int get hashCode => id.hashCode;
}

/// بيانات التسجيل الكاملة (FR-001 بندا 6 و7).
/// كل الحقول إلزامية ما عدا الرقم الضريبي — يُملأ فقط لمن يملك رقماً مسبقاً.
class RegistrationDetails {
  const RegistrationDetails({
    required this.firstName,
    required this.secondName,
    required this.thirdName,
    required this.lastName,
    required this.tradeName,
    required this.legalEntityId,
    required this.activityType,
    required this.address,
    this.taxNumber,
  });

  final String firstName;
  final String secondName;
  final String thirdName;
  final String lastName;
  final String tradeName;
  final String legalEntityId;
  final String activityType;
  final String address;
  final String? taxNumber;

  /// الاسم الرباعي كما يُعرض ويُخزَّن.
  String get fullName =>
      [firstName, secondName, thirdName, lastName].join(' ').trim();

  bool get hasTaxNumber => (taxNumber ?? '').trim().isNotEmpty;

  Map<String, dynamic> toJson() => {
        'firstName': firstName.trim(),
        'secondName': secondName.trim(),
        'thirdName': thirdName.trim(),
        'lastName': lastName.trim(),
        'displayName': fullName,
        'tradeName': tradeName.trim(),
        'legalEntityId': legalEntityId,
        'activityType': activityType.trim(),
        'address': address.trim(),
        if (hasTaxNumber) 'taxNumber': taxNumber!.trim(),
      };
}

/// نتيجة حفظ بيانات المكلف.
class TaxpayerProfileResult {
  const TaxpayerProfileResult({
    required this.taxpayerId,
    required this.linkedToExisting,
    required this.statusCode,
  });

  final String taxpayerId;

  /// الرقم الضريبي المُدخل طابق مكلفاً قائماً فرُبط الحساب به بدل إنشاء سجل جديد.
  final bool linkedToExisting;

  final String statusCode;
}

/// ملف المكلف كما يعيده الخادم.
class TaxpayerProfile {
  const TaxpayerProfile({
    required this.taxpayerId,
    this.taxNumber,
    this.displayName,
    this.statusCode,
    this.tradeName,
    this.legalEntityName,
    this.activityType,
    this.address,
  });

  final String taxpayerId;
  final String? taxNumber;
  final String? displayName;
  final String? statusCode;
  final String? tradeName;
  final String? legalEntityName;
  final String? activityType;
  final String? address;

  /// 4.2: خدمة «استخراج رقم ضريبي» تظهر فقط لمن لا يملك رقماً مسبقاً.
  bool get hasTaxNumber => (taxNumber ?? '').trim().isNotEmpty;

  factory TaxpayerProfile.fromJson(Map<String, dynamic> json) => TaxpayerProfile(
        taxpayerId: (json['taxpayerId'] ?? '').toString(),
        taxNumber: json['taxNumber']?.toString(),
        displayName: json['displayName']?.toString(),
        statusCode: json['statusCode']?.toString(),
        tradeName: json['tradeName']?.toString(),
        legalEntityName: json['legalEntityName']?.toString(),
        activityType: json['activityType']?.toString(),
        address: json['address']?.toString(),
      );
}

/// جلسة مصادقة ناجحة.
class AuthSession {
  const AuthSession({required this.accessToken, required this.userProfileId});

  final String accessToken;
  final String userProfileId;

  factory AuthSession.fromJson(Map<String, dynamic> json) => AuthSession(
        accessToken: json['accessToken'] as String,
        userProfileId: json['userProfileId'] as String,
      );
}
