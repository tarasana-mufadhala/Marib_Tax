import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/design/widgets.dart';
import '../../services/data/service_repository.dart';
import '../../services/domain/service_models.dart';

/// مستندات معاملة قائمة: ما رُفع فعلاً وما بقي إلزامياً، مع رفع المزيد.
class RequestDocumentsPage extends StatefulWidget {
  const RequestDocumentsPage({super.key, required this.requestId});

  final String requestId;

  @override
  State<RequestDocumentsPage> createState() => _RequestDocumentsPageState();
}

class _RequestDocumentsPageState extends State<RequestDocumentsPage> {
  List<ServiceAttachment> _attachments = const [];
  List<MissingDocument> _missing = const [];
  bool _loading = true;
  bool _uploading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repository = context.read<ServiceRepository>();
      final results = await Future.wait([
        repository.attachments(widget.requestId),
        // نقص المستندات قد يُرفض للمعاملات المُرسَلة؛ الفشل هنا ليس خطأ شاشة.
        repository
            .missingDocuments(widget.requestId)
            .catchError((_) => <MissingDocument>[]),
      ]);
      if (!mounted) return;
      setState(() {
        _attachments = results[0] as List<ServiceAttachment>;
        _missing = results[1] as List<MissingDocument>;
        _loading = false;
      });
    } on ApiException catch (error) {
      if (mounted) {
        setState(() {
          _error = error.message;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'تعذّر تحميل المستندات';
          _loading = false;
        });
      }
    }
  }

  Future<void> _addDocument([String? documentCode]) async {
    final picked = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'png', 'jpg', 'jpeg'],
      withData: true,
    );
    final file = picked?.files.firstOrNull;
    final bytes = file?.bytes;
    if (file == null || bytes == null || !mounted) return;

    setState(() {
      _uploading = true;
      _error = null;
    });
    try {
      await context.read<ServiceRepository>().uploadDocument(
            requestId: widget.requestId,
            documentCode: documentCode ?? _missing.firstOrNull?.code ?? 'other',
            bytes: bytes,
            filename: file.name,
            contentType: _contentTypeOf(file.name),
          );
      if (!mounted) return;
      setState(() => _uploading = false);
      await _load();
    } on ApiException catch (error) {
      if (mounted) {
        setState(() {
          _error = error.message;
          _uploading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'تعذّر رفع المستند';
          _uploading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('المستندات المرفقة')),
      body: _loading
          ? Padding(
              padding: const EdgeInsets.all(AppTheme.screenPadding),
              child: Skeleton.cards(count: 4, height: 72),
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(
                AppTheme.screenPadding,
                14,
                AppTheme.screenPadding,
                24,
              ),
              children: [
                if (_error != null) ErrorBanner(message: _error!),
                if (_missing.isNotEmpty) ...[
                  const SectionHeader(title: 'مستندات مطلوبة'),
                  for (final document in _missing)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppTheme.cardGap),
                      child: NavRow(
                        icon: Icons.upload_file_outlined,
                        title: document.label,
                        subtitle: 'لم يُرفع بعد',
                        iconColor: AppTheme.warning,
                        onTap: () => _addDocument(document.code),
                        trailing: const Icon(
                          Icons.add_circle_outline,
                          size: 20,
                          color: AppTheme.warning,
                        ),
                      ),
                    ),
                  const SizedBox(height: AppTheme.sectionGap),
                ],
                SectionHeader(
                  title: 'المستندات المرفقة (${_attachments.length})',
                ),
                if (_attachments.isEmpty)
                  const EmptyState(
                    icon: Icons.folder_open_outlined,
                    message: 'لا توجد مستندات مرفقة بهذه المعاملة',
                  )
                else
                  for (final attachment in _attachments)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppTheme.cardGap),
                      child: _DocumentTile(attachment: attachment),
                    ),
              ],
            ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppTheme.screenPadding,
          8,
          AppTheme.screenPadding,
          16,
        ),
        child: BusyButton(
          label: 'إضافة مستند',
          busy: _uploading,
          onPressed: _addDocument,
        ),
      ),
    );
  }
}

class _DocumentTile extends StatelessWidget {
  const _DocumentTile({required this.attachment});

  final ServiceAttachment attachment;

  /// أيقونة تعكس نوع الملف: PDF أم صورة أم غيرهما.
  (IconData, Color) get _visual {
    final name = attachment.fileName.toLowerCase();
    if (name.endsWith('.pdf')) {
      return (Icons.picture_as_pdf_outlined, AppTheme.danger);
    }
    if (name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg')) {
      return (Icons.image_outlined, AppTheme.primary);
    }
    return (Icons.insert_drive_file_outlined, AppTheme.secondary);
  }

  String get _size {
    final bytes = attachment.sizeBytes;
    if (bytes <= 0) return '';
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).round()} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  @override
  Widget build(BuildContext context) {
    final (icon, color) = _visual;
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Container(
            height: 36,
            width: 36,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 19, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  attachment.fileName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.text,
                  ),
                ),
                if (_size.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      _size,
                      textDirection: TextDirection.ltr,
                      textAlign: TextAlign.right,
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: AppTheme.secondary,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const Icon(Icons.check_circle, size: 18, color: AppTheme.success),
        ],
      ),
    );
  }
}

String _contentTypeOf(String filename) {
  final name = filename.toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}
