import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:marib_tax_mobile/core/api/api_client.dart';
import 'package:marib_tax_mobile/core/storage/token_store.dart';

/// خادم وهمي يغطي النقاط التي يستعملها التطبيق، حتى تُختبر الشاشات
/// وقواعد العمل بلا شبكة حقيقية.
///
/// [overrides] تتيح لكل اختبار تغيير رد نقطة بعينها (مثل محاكاة 401).
MockClient fakeHttpClient({
  Map<String, http.Response Function(http.Request request)> overrides =
      const {},
  List<http.Request>? recorder,
}) {
  return MockClient((request) async {
    recorder?.add(request);
    final key = '${request.method} ${request.url.path}';
    final override = overrides[key];
    if (override != null) return override(request);

    return switch (key) {
      'POST /api/v1/auth/otp/request' =>
        _json({'verificationId': '+967771234567'}),
      'POST /api/v1/auth/otp/verify' =>
        _json({'verificationToken': 'verification-token'}),
      'POST /api/v1/auth/register' => _json({'userProfileId': 'profile-1'}, 201),
      'POST /api/v1/auth/login' => _json({
          'accessToken': 'issued-token',
          'userProfileId': 'profile-1',
        }),
      'POST /api/v1/auth/password/reset/request' =>
        _json({'verificationId': '+967771234567'}),
      'POST /api/v1/auth/password/reset/confirm' => _json({'success': true}),
      'POST /api/v1/auth/credentials/request' => _json({
          'success': true,
          'message': 'أُرسلت بيانات الدخول إلى رقم هاتفك المسجَّل لدى المكتب',
        }),
      'GET /api/v1/public/legal-entities' => _json([
          {'id': 'le-1', 'legalName': 'مؤسسة فردية'},
          {'id': 'le-2', 'legalName': 'شركة ذات مسؤولية محدودة'},
        ]),
      'POST /api/v1/taxpayers/me' => _json({
          'taxpayerId': 'taxpayer-1',
          'linkedToExisting': false,
          'statusCode': 'under_review',
        }, 201),
      'GET /api/v1/taxpayers/me' => _json({
          'taxpayerId': 'taxpayer-1',
          'taxNumber': null,
          'displayName': 'محمد علي صالح المرادي',
          'statusCode': 'under_review',
          'tradeName': 'مؤسسة النور التجارية',
          'legalEntityName': 'مؤسسة فردية',
          'activityType': 'تجارة تجزئة',
          'address': 'مأرب - الشارع العام',
        }),
      'GET /api/v1/service-requests/catalog' => _json(fakeServiceCatalog),
      'POST /api/v1/service-requests' => _json({
          'id': 'req-1',
          'publicRef': 'REQ-TEST01',
          'serviceCode': 'FR-101',
          'schemaVersion': '1.0.0',
          'status': 'draft',
          'form': <String, dynamic>{},
          'ownerActorId': 'profile-1',
        }, 201),
      'GET /api/v1/service-requests/req-1' => _json({
          'id': 'req-1',
          'publicRef': 'REQ-TEST01',
          'serviceCode': 'FR-101',
          'status': 'draft',
          'form': <String, dynamic>{},
        }),
      'GET /api/v1/service-requests/req-1/missing-documents' => _json([
          {'code': 'commercial_register', 'label': 'صورة السجل التجاري'},
        ]),
      'GET /api/v1/service-requests/req-1/attachments' => _json([]),
      'POST /api/v1/service-requests/req-1/attachments' =>
        _json({'attachmentId': 'att-1', 'documentCode': 'commercial_register'}, 201),
      'POST /api/v1/service-requests/req-1/submit' => _json({
          'id': 'req-1',
          'publicRef': 'REQ-TEST01',
          'serviceCode': 'FR-101',
          'status': 'submitted',
          'form': <String, dynamic>{},
        }),
      'GET /api/v1/activities/taxpayers/taxpayer-1' => _json([
          {'id': 'aaaaaaaa-1111-4111-8111-111111111111', 'name': 'تجارة تجزئة', 'statusCode': 'active'},
          {'id': 'bbbbbbbb-2222-4222-8222-222222222222', 'name': 'مخبز آلي', 'statusCode': 'active'},
        ]),
      'POST /api/v1/balaghs' => _json({
          'id': 'balagh-1',
          'publicRef': null,
          'balaghType': 'FR-201',
          'status': 'draft',
        }, 201),
      'POST /api/v1/balaghs/balagh-1/submit' => _json({
          'id': 'balagh-1',
          'publicRef': 'BLG-TEST01',
          'balaghType': 'FR-201',
          'status': 'submitted',
        }),
      'GET /api/v1/balaghs' => _json([]),
      'GET /api/v1/public/announcements' => _json([]),
      'GET /api/v1/requests' => _json([]),
      'GET /api/v1/notifications' => _json([]),
      _ => _json({'error': {'code': 'NOT_FOUND', 'message': 'not mapped'}}, 404),
    };
  });
}

ApiClient fakeApiClient(
  TokenStore store, {
  Map<String, http.Response Function(http.Request request)> overrides =
      const {},
  List<http.Request>? recorder,
}) {
  return ApiClient(
    tokenStore: store,
    httpClient: fakeHttpClient(overrides: overrides, recorder: recorder),
    baseUrl: 'http://localhost/api/v1',
  );
}

http.Response _json(Object body, [int status = 200]) => jsonResponse(body, status);

/// رد JSON جاهز — تستعمله الاختبارات لتجاوز نقطة بعينها.
http.Response jsonResponse(Object body, [int status = 200]) => http.Response.bytes(
      utf8.encode(jsonEncode(body)),
      status,
      headers: {'content-type': 'application/json; charset=utf-8'},
    );

/// كتالوج مصغَّر يطابق شكل ما يعيده الخادم من عقد الخدمات.
const List<Map<String, dynamic>> fakeServiceCatalog = [
  {
    'code': 'FR-101',
    'title': 'فتح ملف ضريبي',
    'acceptanceNote': 'لا يُقبل الطلب دون هوية أو جواز، وسجل تجاري، وبيانات النشاط.',
    'availability': 'all',
    'documents': [
      {'code': 'national_id_front', 'label': 'الهوية الشخصية — الوجه الأمامي',
       'requirement': 'national_id_only', 'note': 'بديل عن جواز السفر'},
      {'code': 'national_id_back', 'label': 'الهوية الشخصية — الوجه الخلفي',
       'requirement': 'national_id_only'},
      {'code': 'passport', 'label': 'جواز السفر', 'requirement': 'passport_only'},
      {'code': 'lease_contract', 'label': 'عقد الإيجار', 'requirement': 'optional'},
      {'code': 'commercial_register', 'label': 'صورة السجل التجاري',
       'requirement': 'required'},
    ],
  },
  {
    'code': 'FR-102',
    'title': 'استخراج أو طلب رقم ضريبي',
    'acceptanceNote': 'تظهر فقط لمن لا يملك رقماً ضريبياً مسبقاً.',
    'availability': 'without_tax_number_only',
    'documents': [
      {'code': 'trade_name_registration', 'label': 'شهادة قيد الاسم التجاري',
       'requirement': 'required'},
      {'code': 'articles_of_association', 'label': 'النظام الأساسي',
       'requirement': 'company_only'},
    ],
  },
];

/// رد خطأ بنفس شكل ApiExceptionFilter في الـ API.
http.Response apiError(int status, String code, String message) => _json({
      'error': {'code': code, 'message': message, 'traceId': 'test-trace'},
    }, status);

/// رفض التقديم مع قائمة المستندات الناقصة، كما يرده الخادم فعلاً.
http.Response missingDocumentsError(List<(String, String)> documents) => _json({
      'error': {
        'code': 'UNPROCESSABLE_ENTITY',
        'message': 'لا يمكن تقديم الطلب قبل إرفاق المستندات الإلزامية',
        'traceId': 'test-trace',
        'details': {
          'missingDocuments': [
            for (final (code, label) in documents) {'code': code, 'label': label},
          ],
        },
      },
    }, 422);
