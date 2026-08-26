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

/// مستحق ضريبي على المكلف.
class TaxDue {
  const TaxDue({
    required this.id,
    required this.amount,
    required this.currencyCode,
    required this.statusCode,
    this.publicRef,
    this.requestRef,
    this.serviceName,
    this.assessedAt,
  });

  final String id;
  final double amount;
  final String currencyCode;
  final String statusCode;
  final String? publicRef;
  final String? requestRef;
  final String? serviceName;
  final DateTime? assessedAt;

  factory TaxDue.fromJson(Map<String, dynamic> json) => TaxDue(
        id: (json['id'] ?? '').toString(),
        amount: double.tryParse((json['amount'] ?? '0').toString()) ?? 0,
        currencyCode: (json['currencyCode'] ?? 'YER').toString(),
        statusCode: (json['statusCode'] ?? '').toString(),
        publicRef: json['publicRef']?.toString(),
        requestRef: json['requestRef']?.toString(),
        serviceName: json['serviceName']?.toString(),
        assessedAt: DateTime.tryParse((json['assessedAt'] ?? '').toString()),
      );

  bool get isSettled => statusCode == 'paid' || statusCode == 'settled';

  String get statusLabel => switch (statusCode) {
        'paid' || 'settled' => 'مسدَّد',
        'partially_paid' => 'مسدَّد جزئياً',
        'assessed' || 'due' || 'pending' => 'مستحق',
        'overdue' => 'متأخر',
        'cancelled' => 'ملغى',
        _ => statusCode.isEmpty ? '—' : statusCode,
      };
}

class AccountRepository {
  AccountRepository({required ApiClient api}) : _api = api;

  final ApiClient _api;

  Future<AccountProfile> me() async =>
      AccountProfile.fromJson(await _api.getObject('/account/me'));

  /// مستحقات المكلف الحالي. الخادم يقصرها على مستحقاته هو.
  Future<List<TaxDue>> dues() async {
    final rows = await _api.getList('/dues/me');
    return rows
        .whereType<Map<String, dynamic>>()
        .map(TaxDue.fromJson)
        .toList(growable: false);
  }

  /// إضافة بريد إلى الحساب — لا يحلّ محل الرقم بل يُضاف إليه.
  Future<void> addEmail({
    required String email,
    required String currentPassword,
  }) async {
    await _api.post('/account/email', body: {
      'email': email,
      'currentPassword': currentPassword,
    });
  }

  /// تغيير الرقم على خطوتين: كلمة المرور ثم رمز يصل الرقم الجديد.
  Future<void> requestPhoneChange({
    required String newPhoneNumber,
    required String currentPassword,
  }) async {
    await _api.post('/account/phone/change/request', body: {
      'newPhoneNumber': newPhoneNumber,
      'currentPassword': currentPassword,
    });
  }

  Future<void> confirmPhoneChange({
    required String newPhoneNumber,
    required String code,
  }) async {
    await _api.post('/account/phone/change/confirm', body: {
      'newPhoneNumber': newPhoneNumber,
      'code': code,
    });
  }

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
