import '../../../core/api/api_client.dart';

/// نشاط تجاري كما يعرضه ملف الحساب.
class AccountActivity {
  const AccountActivity({
    required this.id,
    required this.name,
    this.activityType,
    this.statusCode,
    this.address,
  });

  final String id;
  final String name;
  final String? activityType;
  final String? statusCode;
  final String? address;

  factory AccountActivity.fromJson(Map<String, dynamic> json) => AccountActivity(
        id: (json['id'] ?? '').toString(),
        name: (json['name'] ?? '—').toString(),
        activityType: json['activityType']?.toString(),
        statusCode: json['statusCode']?.toString(),
        address: json['address']?.toString(),
      );

  /// حالة النشاط بالعربية؛ الرمز الخام لا يفيد المكلف.
  String get statusLabel => switch (statusCode) {
        'active' => 'نشط',
        'stopped' || 'suspended' => 'موقوف',
        'under_review' => 'قيد المراجعة',
        _ => statusCode ?? '—',
      };
}

/// ملف المكلف المرتبط بالحساب، إن اكتمل تسجيله.
class AccountTaxpayer {
  const AccountTaxpayer({
    required this.taxpayerId,
    this.taxNumber,
    this.displayName,
    this.statusCode,
    this.legalEntityName,
  });

  final String taxpayerId;
  final String? taxNumber;
  final String? displayName;
  final String? statusCode;
  final String? legalEntityName;

  factory AccountTaxpayer.fromJson(Map<String, dynamic> json) => AccountTaxpayer(
        taxpayerId: (json['taxpayerId'] ?? '').toString(),
        taxNumber: json['taxNumber']?.toString(),
        displayName: json['displayName']?.toString(),
        statusCode: json['statusCode']?.toString(),
        legalEntityName: json['legalEntityName']?.toString(),
      );

  String get statusLabel => switch (statusCode) {
        'active' || 'approved' => 'معتمد',
        'under_review' => 'قيد المراجعة',
        'suspended' => 'موقوف',
        _ => statusCode ?? '—',
      };
}

class AccountProfile {
  const AccountProfile({
    this.displayName,
    this.phone,
    this.email,
    this.taxpayer,
    this.activities = const [],
  });

  final String? displayName;
  final String? phone;
  final String? email;
  final AccountTaxpayer? taxpayer;
  final List<AccountActivity> activities;

  factory AccountProfile.fromJson(Map<String, dynamic> json) {
    final taxpayer = json['taxpayer'];
    final activities = json['activities'];
    return AccountProfile(
      displayName: json['displayName']?.toString(),
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
      taxpayer: taxpayer is Map<String, dynamic>
          ? AccountTaxpayer.fromJson(taxpayer)
          : null,
      activities: activities is List
          ? activities
              .whereType<Map<String, dynamic>>()
              .map(AccountActivity.fromJson)
              .toList(growable: false)
          : const [],
    );
  }
}

class AccountRepository {
  AccountRepository({required ApiClient api}) : _api = api;

  final ApiClient _api;

  Future<AccountProfile> me() async =>
      AccountProfile.fromJson(await _api.getObject('/account/me'));

  /// الخادم يتحقّق من كلمة المرور الحالية بمنح فعلي، فلا يكفي رمز الجلسة.
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _api.post('/account/password', body: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }
}
