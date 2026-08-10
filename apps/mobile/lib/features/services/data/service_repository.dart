import '../../../core/api/api_client.dart';
import '../domain/service_models.dart';

/// كل نداءات خدمات القسم 4.3.
class ServiceRepository {
  ServiceRepository({required ApiClient api}) : _api = api;

  final ApiClient _api;

  /// الكتالوج المتاح لهذا المكلف — الخادم يخفي FR-102 عمّن يملك رقماً ضريبياً.
  Future<List<ServiceDefinition>> catalog() async {
    final rows = await _api.getList('/service-requests/catalog');
    return rows
        .whereType<Map<String, dynamic>>()
        .map(ServiceDefinition.fromJson)
        .toList(growable: false);
  }

  Future<ServiceRequest> createDraft({
    required String serviceCode,
    required Map<String, dynamic> form,
  }) async {
    final json = await _api.post('/service-requests', body: {
      'serviceCode': serviceCode,
      'schemaVersion': '1.0.0',
      'form': form,
    });
    return ServiceRequest.fromJson(json);
  }

  Future<ServiceRequest> read(String id) async =>
      ServiceRequest.fromJson(await _api.getObject('/service-requests/$id'));

  Future<ServiceRequest> editDraft(String id, Map<String, dynamic> form) async =>
      ServiceRequest.fromJson(
        await _api.patch('/service-requests/$id', body: {'form': form}),
      );

  /// المستندات الإلزامية الناقصة — تُعرض للمكلف قبل الإرسال.
  Future<List<MissingDocument>> missingDocuments(String id) async {
    final rows = await _api.getList('/service-requests/$id/missing-documents');
    return rows
        .whereType<Map<String, dynamic>>()
        .map(MissingDocument.fromJson)
        .toList(growable: false);
  }

  Future<List<ServiceAttachment>> attachments(String id) async {
    final rows = await _api.getList('/service-requests/$id/attachments');
    return rows
        .whereType<Map<String, dynamic>>()
        .map(ServiceAttachment.fromJson)
        .toList(growable: false);
  }

  Future<ServiceAttachment> uploadDocument({
    required String requestId,
    required String documentCode,
    required List<int> bytes,
    required String filename,
    required String contentType,
  }) async {
    final json = await _api.uploadFile(
      '/service-requests/$requestId/attachments',
      bytes: bytes,
      filename: filename,
      contentType: contentType,
      fields: {'documentCode': documentCode},
    );
    return ServiceAttachment(
      id: (json['attachmentId'] ?? '').toString(),
      fileName: filename,
      documentCode: (json['documentCode'] ?? documentCode).toString(),
      sizeBytes: bytes.length,
    );
  }

  Future<ServiceRequest> submit(String id) async =>
      ServiceRequest.fromJson(await _api.post('/service-requests/$id/submit'));
}
