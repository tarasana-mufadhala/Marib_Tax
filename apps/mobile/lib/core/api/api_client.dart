import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' show MediaType;

import '../config/app_config.dart';
import '../storage/token_store.dart';
import 'api_exception.dart';

/// عميل الـ API: يضيف رمز الجلسة، ويترجم أخطاء الخادم والشبكة
/// إلى [ApiException] برسالة عربية واحدة يفهمها المستخدم.
class ApiClient {
  ApiClient({
    required TokenStore tokenStore,
    http.Client? httpClient,
    String? baseUrl,
  })  : _tokenStore = tokenStore,
        _http = httpClient ?? http.Client(),
        _baseUrl = (baseUrl ?? AppConfig.apiBaseUrl).replaceAll(RegExp(r'/$'), '');

  final TokenStore _tokenStore;
  final http.Client _http;
  final String _baseUrl;

  /// يُستدعى عند انتهاء الجلسة نهائياً ليعيد التطبيق إلى شاشة الدخول.
  /// لا يُستدعى إلا بعد فشل التجديد: انتهاء رمز الوصول وحده أمر متوقّع كل
  /// ساعة، وإخراج المكلف عنده يقطع عمله بلا سبب.
  void Function()? onUnauthenticated;

  /// يجدّد الجلسة برمز التجديد. يعيد true إن صار في المخزن رمز وصول جديد.
  Future<bool> Function()? onRefreshSession;

  /// تجديد واحد قيد التنفيذ لا أكثر: الشاشة الواحدة تُطلق عدة نداءات معاً،
  /// وكلها تصطدم بالـ 401 نفسه. تجديدات متوازية تُبطل رموز بعضها لأن GoTrue
  /// يدوّر رمز التجديد عند كل استعمال.
  Future<bool>? _refreshInFlight;

  Future<Map<String, dynamic>> getObject(String path) async =>
      _asObject(await _send('GET', path));

  Future<List<dynamic>> getList(String path) async =>
      _asList(await _send('GET', path));

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
    bool authenticated = true,
  }) async =>
      _asObject(await _send('POST', path, body: body, authenticated: authenticated));

  Future<Map<String, dynamic>> patch(
    String path, {
    Map<String, dynamic>? body,
  }) async =>
      _asObject(await _send('PATCH', path, body: body));

  /// رفع ملف بصيغة multipart مع حقول نصية مرافقة.
  Future<Map<String, dynamic>> uploadFile(
    String path, {
    required List<int> bytes,
    required String filename,
    required String contentType,
    Map<String, String> fields = const {},
    String fileField = 'file',
    bool allowRefresh = true,
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    final request = http.MultipartRequest('POST', uri)..fields.addAll(fields);

    final token = await _tokenStore.read();
    if (token != null && token.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    final separator = contentType.split('/');
    request.files.add(
      http.MultipartFile.fromBytes(
        fileField,
        bytes,
        filename: filename,
        contentType: separator.length == 2
            ? MediaType(separator.first, separator.last)
            : null,
      ),
    );

    http.Response response;
    try {
      final streamed = await _http.send(request).timeout(AppConfig.requestTimeout);
      response = await http.Response.fromStream(streamed);
    } on TimeoutException {
      throw const ApiException('انتهت مهلة رفع الملف، يرجى المحاولة مجدداً');
    } catch (_) {
      throw const ApiException('تعذّر رفع الملف، تحقق من اتصالك بالإنترنت');
    }

    // رفع كبير قد يستغرق أكثر من عمر رمز الوصول، فالتجديد وإعادة المحاولة
    // هنا يحفظان للمكلف ملفاً رُفع بالفعل بدل أن يعيده من الصفر.
    if (response.statusCode == 401 && allowRefresh && await _tryRefresh()) {
      return uploadFile(
        path,
        bytes: bytes,
        filename: filename,
        contentType: contentType,
        fields: fields,
        fileField: fileField,
        allowRefresh: false,
      );
    }

    return _asObject(await _decode(response));
  }

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool authenticated = true,
    bool allowRefresh = true,
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    final headers = <String, String>{'Content-Type': 'application/json'};

    if (authenticated) {
      final token = await _tokenStore.read();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    http.Response response;
    try {
      final request = http.Request(method, uri)..headers.addAll(headers);
      if (body != null) request.body = jsonEncode(body);
      final streamed = await _http.send(request).timeout(AppConfig.requestTimeout);
      response = await http.Response.fromStream(streamed);
    } on TimeoutException {
      throw const ApiException('انتهت مهلة الاتصال بالخادم، يرجى المحاولة مجدداً');
    } catch (_) {
      throw const ApiException('تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت');
    }

    // رمز الوصول انتهى: يُجدَّد بصمت وتُعاد المحاولة مرة واحدة. المكلف لا
    // يرى شيئاً، ولا يُطلب منه دخول جديد ما دام رمز التجديد صالحاً.
    if (response.statusCode == 401 &&
        authenticated &&
        allowRefresh &&
        await _tryRefresh()) {
      return _send(
        method,
        path,
        body: body,
        authenticated: authenticated,
        allowRefresh: false,
      );
    }

    return _decode(response, authenticated: authenticated);
  }

  /// يجدّد الجلسة مرة واحدة مهما تزامنت النداءات المصطدمة بالـ 401.
  Future<bool> _tryRefresh() async {
    final refresh = onRefreshSession;
    if (refresh == null) return false;
    // النداءات المتزامنة تنتظر التجديد الجاري بدل إطلاق تجديد ثانٍ يُبطله.
    return _refreshInFlight ??= refresh().whenComplete(() {
      _refreshInFlight = null;
    });
  }

  /// معالجة موحّدة للرد: 401 يُنهي الجلسة، وبقية الأخطاء تصير [ApiException].
  Future<dynamic> _decode(
    http.Response response, {
    bool authenticated = true,
  }) async {
    if (response.statusCode == 401) {
      // 401 على نقطة عامة (دخول بكلمة مرور خاطئة) ليس انتهاء جلسة: مسح
      // الرمز عنده يُخرج مكلفاً داخلَ حسابه أصلاً لأنه أخطأ في نموذج آخر.
      if (authenticated) {
        // الجلسة غير صالحة ولا التجديد أنقذها: نمسح الرمزين ونُبلّغ الواجهة.
        await _tokenStore.clear();
        onUnauthenticated?.call();
      }
      throw ApiException(
        _messageOf(response) ?? 'انتهت جلستك، يرجى تسجيل الدخول من جديد',
        statusCode: 401,
        code: _codeOf(response),
      );
    }

    if (response.statusCode >= 400) {
      throw ApiException(
        _messageOf(response) ?? 'تعذّر تنفيذ العملية، يرجى المحاولة لاحقاً',
        statusCode: response.statusCode,
        code: _codeOf(response),
        details: _detailsOf(response),
      );
    }

    if (response.body.isEmpty) return <String, dynamic>{};
    try {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } catch (_) {
      throw const ApiException('وصل رد غير مفهوم من الخادم');
    }
  }

  Map<String, dynamic> _asObject(dynamic decoded) {
    if (decoded is Map<String, dynamic>) return decoded;
    throw const ApiException('وصل رد غير متوقع من الخادم');
  }

  List<dynamic> _asList(dynamic decoded) {
    if (decoded is List) return decoded;
    throw const ApiException('وصل رد غير متوقع من الخادم');
  }

  String? _messageOf(http.Response response) {
    try {
      final decoded = jsonDecode(utf8.decode(response.bodyBytes));
      if (decoded is Map<String, dynamic>) {
        final error = decoded['error'];
        if (error is Map && error['message'] is String) {
          return _arabicFor(error['code'] as String?, error['message'] as String);
        }
        if (decoded['error'] is String) return decoded['error'] as String;
        if (decoded['message'] is String) return decoded['message'] as String;
      }
    } catch (_) {
      // رد غير JSON — نترك الرسالة الافتراضية.
    }
    return null;
  }

  /// تفاصيل إضافية يرسلها الخادم مع الخطأ (مثل قائمة المستندات الناقصة).
  Map<String, dynamic>? _detailsOf(http.Response response) {
    try {
      final decoded = jsonDecode(utf8.decode(response.bodyBytes));
      if (decoded is Map<String, dynamic>) {
        final error = decoded['error'];
        if (error is Map<String, dynamic>) {
          final details = error['details'];
          if (details is Map<String, dynamic>) return details;
          // بعض الردود تضع الحقول مباشرة في جسم الخطأ.
          return error;
        }
        return decoded;
      }
    } catch (_) {
      // رد غير JSON.
    }
    return null;
  }

  String? _codeOf(http.Response response) {
    try {
      final decoded = jsonDecode(utf8.decode(response.bodyBytes));
      if (decoded is Map<String, dynamic> && decoded['error'] is Map) {
        return (decoded['error'] as Map)['code'] as String?;
      }
    } catch (_) {
      // لا رمز.
    }
    return null;
  }

  /// الـ API يرد أحياناً برسالة إنجليزية عامة، وأحياناً برسالة عربية دقيقة
  /// تقول للمستخدم بالضبط ما ينقصه («الحقل «العنوان» مطلوب»). الرسالة العربية
  /// أنفع من أي ترجمة عامة، فلا تُستبدل.
  String _arabicFor(String? code, String fallback) {
    if (_containsArabic(fallback)) return fallback;
    switch (code) {
      case 'AUTHENTICATION_REQUIRED':
        return 'رقم الهاتف أو كلمة المرور غير صحيحة';
      case 'ACCESS_DENIED':
        return 'لا تملك صلاحية تنفيذ هذه العملية';
      case 'BAD_REQUEST':
        return 'البيانات المُدخلة غير صحيحة';
      case 'NOT_FOUND':
        return 'العنصر المطلوب غير موجود';
      case 'CONFLICT':
        return 'العملية تتعارض مع بيانات موجودة مسبقاً';
      default:
        return fallback;
    }
  }

  static final RegExp _arabicLetters = RegExp(r'[؀-ۿ]');

  bool _containsArabic(String value) => _arabicLetters.hasMatch(value);

  void close() => _http.close();
}
