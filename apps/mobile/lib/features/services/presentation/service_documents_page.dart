import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/api/api_exception.dart';
import '../data/service_repository.dart';
import '../domain/service_models.dart';

/// رفع المستندات ثم التقديم.
///
/// المستندات المعروضة هي مستندات الخدمة كما يعرّفها الخادم، مع إبراز
/// الإلزامي في هذا السياق (نوع الهوية المختار وطبيعة النشاط)، لأن
/// الخادم يرفض التقديم قبل استيفائها.
class ServiceDocumentsPage extends StatefulWidget {
  const ServiceDocumentsPage({
    super.key,
    required this.service,
    required this.request,
    this.identityDocumentType,
    this.isCompany = false,
  });

  final ServiceDefinition service;
  final ServiceRequest request;
  final String? identityDocumentType;
  final bool isCompany;

  @override
  State<ServiceDocumentsPage> createState() => _ServiceDocumentsPageState();
}

class _ServiceDocumentsPageState extends State<ServiceDocumentsPage> {
  final Map<String, ServiceAttachment> _uploaded = {};
  final Set<String> _uploading = {};

  List<MissingDocument> _missing = const [];
  bool _loading = true;
  bool _submitting = false;
  String? _error;

  ServiceRepository get _repository => context.read<ServiceRepository>();

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() => _loading = true);
    try {
      final attachments = await _repository.attachments(widget.request.id);
      final missing = await _repository.missingDocuments(widget.request.id);
      if (!mounted) return;
      setState(() {
        _uploaded
          ..clear()
          ..addEntries(attachments.map((a) => MapEntry(a.documentCode, a)));
        _missing = missing;
        _error = null;
      });
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  /// هل هذا المستند إلزامي في سياق هذا الطلب؟ نطبّق قاعدة العقد نفسها
  /// محلياً لنُبرز ما يلزم، والخادم يبقى الحكم عند التقديم.
  bool _isMandatory(ServiceDocument document) => switch (document.requirement) {
        DocumentRequirement.required$ => true,
        DocumentRequirement.optional => false,
        DocumentRequirement.companyOnly => widget.isCompany,
        DocumentRequirement.nationalIdOnly =>
          widget.identityDocumentType == 'national_id',
        DocumentRequirement.passportOnly =>
          widget.identityDocumentType == 'passport',
        DocumentRequirement.unknown => false,
      };

  /// المستندات المعروضة: نُخفي البدائل غير المختارة حتى لا يحتار المكلف.
  List<ServiceDocument> get _visibleDocuments =>
      widget.service.documents.where((document) {
        final isUnchosenIdentity =
            (document.requirement == DocumentRequirement.nationalIdOnly ||
                    document.requirement == DocumentRequirement.passportOnly) &&
                !_isMandatory(document);
        return !isUnchosenIdentity;
      }).toList(growable: false);

  Future<void> _pickAndUpload(ServiceDocument document) async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'png', 'jpg', 'jpeg'],
      withData: true,
    );
    final file = result?.files.firstOrNull;
    if (file == null) return;

    final bytes = file.bytes;
    if (bytes == null) {
      setState(() => _error = 'تعذّر قراءة الملف المختار');
      return;
    }
    // السلة على الخادم لا تقبل أكثر من 5 ميغابايت.
    if (bytes.length > 5 * 1024 * 1024) {
      setState(() => _error = 'حجم الملف يتجاوز 5 ميغابايت');
      return;
    }

    setState(() {
      _uploading.add(document.code);
      _error = null;
    });

    try {
      await _repository.uploadDocument(
        requestId: widget.request.id,
        documentCode: document.code,
        bytes: bytes,
        filename: file.name,
        contentType: _mimeOf(file.extension),
      );
      await _refresh();
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _uploading.remove(document.code));
    }
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await _repository.submit(widget.request.id);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (_) => const _SubmittedDialog(),
      );
      if (mounted) Navigator.of(context).popUntil((route) => route.isFirst);
    } on ApiException catch (error) {
      if (!mounted) return;
      // الخادم يُرجع ما ينقص بالضبط — نعرضه بدل رسالة عامة.
      final missing = error.missingDocuments;
      setState(() {
        _error = missing.isEmpty
            ? error.message
            : 'ينقص الطلب: ${missing.map((d) => d.label).join('، ')}';
        if (missing.isNotEmpty) {
          _missing = missing
              .map((d) => MissingDocument(code: d.code, label: d.label))
              .toList();
        }
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ready = _missing.isEmpty && !_loading;

    return Scaffold(
      appBar: AppBar(title: const Text('مستندات الطلب')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _RequestHeader(request: widget.request, service: widget.service),
                  const SizedBox(height: 16),
                  if (_error != null) _ErrorBox(message: _error!),
                  _StatusBanner(ready: ready, missingCount: _missing.length),
                  const SizedBox(height: 16),
                  for (final document in _visibleDocuments)
                    _DocumentTile(
                      document: document,
                      mandatory: _isMandatory(document),
                      attachment: _uploaded[document.code],
                      uploading: _uploading.contains(document.code),
                      onPick: () => _pickAndUpload(document),
                    ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: ready && !_submitting ? _submit : null,
                    child: _submitting
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Text('إرسال الطلب'),
                  ),
                  if (!ready)
                    const Padding(
                      padding: EdgeInsets.only(top: 10),
                      child: Text(
                        'لا يمكن إرسال الطلب قبل إرفاق كل المستندات الإلزامية.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12.5, color: Color(0xFF7A8A83)),
                      ),
                    ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }
}

String _mimeOf(String? extension) => switch ((extension ?? '').toLowerCase()) {
      'pdf' => 'application/pdf',
      'png' => 'image/png',
      'jpg' || 'jpeg' => 'image/jpeg',
      _ => 'application/octet-stream',
    };

class _RequestHeader extends StatelessWidget {
  const _RequestHeader({required this.request, required this.service});

  final ServiceRequest request;
  final ServiceDefinition service;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            const Icon(Icons.description_outlined, color: AppTheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service.title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'رقم الطلب: ${request.publicRef ?? '—'}',
                    style: const TextStyle(fontSize: 12.5, color: Color(0xFF5A6B63)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({required this.ready, required this.missingCount});

  final bool ready;
  final int missingCount;

  @override
  Widget build(BuildContext context) {
    final (background, border, icon, color, text) = ready
        ? (
            const Color(0xFFE8F5EE),
            const Color(0xFFBFE0CD),
            Icons.check_circle_outline,
            AppTheme.primaryDark,
            'الطلب مستوفٍ وجاهز للإرسال',
          )
        : (
            const Color(0xFFFFF3E0),
            const Color(0xFFF5D9A8),
            Icons.info_outline,
            const Color(0xFF9A5B00),
            'ينقص الطلب $missingCount من المستندات الإلزامية',
          );

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(fontSize: 13.5, color: color, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _DocumentTile extends StatelessWidget {
  const _DocumentTile({
    required this.document,
    required this.mandatory,
    required this.attachment,
    required this.uploading,
    required this.onPick,
  });

  final ServiceDocument document;
  final bool mandatory;
  final ServiceAttachment? attachment;
  final bool uploading;
  final VoidCallback onPick;

  @override
  Widget build(BuildContext context) {
    final done = attachment != null;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: Icon(
          done ? Icons.check_circle : Icons.upload_file,
          color: done ? AppTheme.primary : const Color(0xFF9AAAA3),
        ),
        title: Text(
          document.label,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 3),
            Text(
              done
                  ? attachment!.fileName
                  : mandatory
                      ? document.requirementLabel
                      : 'اختياري',
              style: TextStyle(
                fontSize: 12,
                color: done ? AppTheme.primaryDark : const Color(0xFF7A8A83),
              ),
            ),
            if (document.note != null && !done)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  document.note!,
                  style: const TextStyle(fontSize: 11.5, color: Color(0xFF9AAAA3)),
                ),
              ),
          ],
        ),
        trailing: uploading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(strokeWidth: 2.4),
              )
            : TextButton(
                onPressed: onPick,
                child: Text(done ? 'استبدال' : 'إرفاق'),
              ),
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  const _ErrorBox({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFDECEA),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF5C6C0)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppTheme.danger, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: AppTheme.danger, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}

class _SubmittedDialog extends StatelessWidget {
  const _SubmittedDialog();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      icon: const Icon(Icons.check_circle, color: AppTheme.primary, size: 44),
      title: const Text('تم إرسال طلبك'),
      content: const Text(
        'سيصلك إشعار باستلام الطلب، ويمكنك متابعة حالته من الصفحة الرئيسية.',
        textAlign: TextAlign.center,
        style: TextStyle(height: 1.7),
      ),
      actions: [
        FilledButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('حسناً'),
        ),
      ],
    );
  }
}
