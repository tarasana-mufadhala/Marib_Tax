import 'package:flutter/material.dart';

import '../data/attachment_repository.dart';
import '../domain/attachment_models.dart';

class AttachmentsPage extends StatefulWidget {
  const AttachmentsPage({
    super.key,
    this.repository = const MockAttachmentRepository(),
  });

  final AttachmentRepository repository;

  @override
  State<AttachmentsPage> createState() => _AttachmentsPageState();
}

class _AttachmentsPageState extends State<AttachmentsPage> {
  AttachmentCategory? _category;
  LocalAttachmentSelection? _selection;
  bool _offline = false;
  bool _uploading = false;
  double _progress = 0;

  void _pickMockFile() {
    setState(() {
      _selection = const LocalAttachmentSelection(
        displayName: 'إقرار-ضريبي-تجريبي.pdf',
        mimeLabel: 'PDF',
        sizeLabel: '1.2 م.ب',
      );
      _progress = 0;
    });
  }

  Future<void> _mockUpload() async {
    if (_category == null || _selection == null || _offline) return;
    setState(() => _uploading = true);
    for (final value in const [0.25, 0.6, 1.0]) {
      await Future<void>.delayed(const Duration(milliseconds: 80));
      if (!mounted) return;
      setState(() => _progress = value);
    }
    if (mounted) setState(() => _uploading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text('المرفقات')),
        body: FutureBuilder<List<AttachmentSummary>>(
          future: widget.repository.listAttachments(),
          builder: (context, snapshot) => ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (_offline) _offlineCard(),
              Text(
                'إضافة مرفق',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              const Text('عرض تجريبي محلي؛ لن يُرفع أو يُحفظ أي ملف.'),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                key: const Key('mock-picker'),
                onPressed: _pickMockFile,
                icon: const Icon(Icons.attach_file),
                label: const Text('اختيار ملف تجريبي'),
              ),
              if (_selection != null) ...[
                const SizedBox(height: 12),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.picture_as_pdf_outlined),
                    title: Text(_selection!.displayName),
                    subtitle: Text(
                      '${_selection!.mimeLabel} • ${_selection!.sizeLabel}',
                    ),
                    trailing: IconButton(
                      tooltip: 'إزالة الاختيار',
                      onPressed: () => setState(() => _selection = null),
                      icon: const Icon(Icons.close),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              DropdownButtonFormField<AttachmentCategory>(
                key: const Key('category-picker'),
                initialValue: _category,
                decoration: const InputDecoration(
                  labelText: 'نوع المرفق *',
                  border: OutlineInputBorder(),
                ),
                items: AttachmentCategory.values
                    .map(
                      (value) => DropdownMenuItem(
                        value: value,
                        child: Text(value.label),
                      ),
                    )
                    .toList(),
                onChanged: (value) => setState(() => _category = value),
              ),
              if (_selection != null && _category == null)
                const Padding(
                  padding: EdgeInsets.only(top: 8),
                  child: Text(
                    'اختر نوع المرفق للمتابعة.',
                    style: TextStyle(color: Colors.red),
                  ),
                ),
              const SizedBox(height: 16),
              if (_uploading || _progress > 0) ...[
                LinearProgressIndicator(value: _progress),
                const SizedBox(height: 6),
                Text(
                  _progress == 1
                      ? 'اكتملت المحاكاة — لم يُرفع ملف فعلي.'
                      : 'تجهيز تجريبي…',
                ),
              ],
              FilledButton(
                key: const Key('mock-upload'),
                onPressed:
                    _selection != null &&
                        _category != null &&
                        !_offline &&
                        !_uploading
                    ? _mockUpload
                    : null,
                child: const Text('محاكاة الإضافة'),
              ),
              SwitchListTile(
                key: const Key('offline-toggle'),
                value: _offline,
                onChanged: (value) => setState(() => _offline = value),
                title: const Text('محاكاة عدم الاتصال'),
              ),
              const Divider(height: 32),
              Text(
                'المرفقات الحالية',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              for (final attachment
                  in snapshot.data ?? const <AttachmentSummary>[])
                _AttachmentCard(attachment: attachment),
            ],
          ),
        ),
      ),
    );
  }

  Widget _offlineCard() => Card(
    color: Theme.of(context).colorScheme.errorContainer,
    child: ListTile(
      leading: const Icon(Icons.cloud_off_outlined),
      title: const Text('لا يوجد اتصال'),
      subtitle: const Text(
        'اختيارك محفوظ داخل هذه الشاشة فقط. أعد المحاولة عند عودة الاتصال.',
      ),
      trailing: TextButton(
        onPressed: () async {
          await widget.repository.retrySync();
          if (mounted) setState(() => _offline = false);
        },
        child: const Text('إعادة المحاولة'),
      ),
    ),
  );
}

class _AttachmentCard extends StatelessWidget {
  const _AttachmentCard({required this.attachment});
  final AttachmentSummary attachment;

  @override
  Widget build(BuildContext context) {
    final denied = attachment.availability == AttachmentAvailability.denied;
    return Card(
      child: ExpansionTile(
        leading: Icon(denied ? Icons.lock_outline : Icons.description_outlined),
        title: Text(attachment.name),
        subtitle: Text(
          '${attachment.category.label} • ${attachment.classification.label}',
        ),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        children: denied
            ? const [
                ListTile(
                  title: Text('هذا المرفق غير متاح أو ليست لديك صلاحية لعرضه.'),
                ),
              ]
            : [
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Text(
                    'سجل الإصدارات',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                for (final version in attachment.versions)
                  ListTile(
                    dense: true,
                    title: Text('الإصدار ${version.number} — ${version.note}'),
                    subtitle: Text(version.createdLabel),
                  ),
                OutlinedButton.icon(
                  onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('تم بدء تدفق نسخة مصححة تجريبية فقط.'),
                    ),
                  ),
                  icon: const Icon(Icons.add_circle_outline),
                  label: const Text('إضافة نسخة مصححة'),
                ),
              ],
      ),
    );
  }
}
