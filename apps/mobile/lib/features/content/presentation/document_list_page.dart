import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app/theme.dart';
import '../../../core/api/api_exception.dart';
import '../data/content_repository.dart';
import '../domain/content_models.dart';

/// قائمة مستندات المكتبة بتصنيف واحد — تعرض ما يعرضه الموقع العام نفسه
/// (النماذج، القوانين، القرارات، الأدلة).
class DocumentListPage extends StatefulWidget {
  const DocumentListPage({
    super.key,
    required this.title,
    required this.subtitle,
    this.category,
    this.topic,
    this.introPageKey,
  });

  final String title;
  final String subtitle;
  final String? category;
  final String? topic;

  /// مفتاح صفحة محتوى تُعرض مقدمةً فوق القائمة — كما يفعل الموقع في
  /// «الإرشادات»، حيث يسبق نصُّ المكتب قائمةَ الأدلة.
  final String? introPageKey;

  @override
  State<DocumentListPage> createState() => _DocumentListPageState();
}

class _DocumentListPageState extends State<DocumentListPage> {
  late Future<List<LibraryDocument>> _documents;
  Future<ContentPage?>? _intro;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    final repository = context.read<ContentRepository>();
    _documents = repository.documents(
      category: widget.category,
      topic: widget.topic,
    );
    final introKey = widget.introPageKey;
    // تعذّر تحميل المقدمة لا يمنع عرض المستندات: هي إضافة لا شرط.
    _intro = introKey == null
        ? null
        : repository.page(introKey).catchError((_) => null);
  }

  Future<void> _open(LibraryDocument document) async {
    final url = Uri.parse(
      context.read<ContentRepository>().fileUrlOf(document.id),
    );
    final launched = await launchUrl(url, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تعذّر فتح الملف على هذا الجهاز')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: FutureBuilder<List<LibraryDocument>>(
        future: _documents,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _Message(
              icon: Icons.cloud_off,
              title: snapshot.error is ApiException
                  ? (snapshot.error as ApiException).message
                  : 'تعذّر تحميل المستندات',
              action: TextButton(
                onPressed: () => setState(_load),
                child: const Text('إعادة المحاولة'),
              ),
            );
          }

          final documents = snapshot.data ?? const <LibraryDocument>[];
          if (documents.isEmpty) {
            return const _Message(
              icon: Icons.folder_off_outlined,
              title: 'لا توجد مستندات منشورة في هذا القسم بعد',
            );
          }

          return RefreshIndicator(
            onRefresh: () async => setState(_load),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: documents.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.subtitle,
                          style: const TextStyle(
                            fontSize: 13,
                            height: 1.7,
                            color: AppTheme.secondary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${documents.length} مستنداً متاحاً للتحميل',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.secondary,
                          ),
                        ),
                        if (_intro != null) _IntroText(page: _intro!),
                      ],
                    ),
                  );
                }
                return _DocumentTile(
                  document: documents[index - 1],
                  onOpen: () => _open(documents[index - 1]),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

/// نص المكتب المنشور فوق القائمة؛ يختفي بلا أثر إن لم يكن منشوراً.
class _IntroText extends StatelessWidget {
  const _IntroText({required this.page});

  final Future<ContentPage?> page;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<ContentPage?>(
      future: page,
      builder: (context, snapshot) {
        final body = snapshot.data?.body.trim() ?? '';
        if (body.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.primarySoft,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              body,
              style: const TextStyle(fontSize: 13, height: 1.9),
            ),
          ),
        );
      },
    );
  }
}

class _DocumentTile extends StatelessWidget {
  const _DocumentTile({required this.document, required this.onOpen});

  final LibraryDocument document;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onOpen,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 38,
                width: 38,
                decoration: BoxDecoration(
                  color: const Color(0xFFFBF3DC),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.picture_as_pdf_outlined,
                  size: 20,
                  color: Color(0xFF9A7B12),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      document.title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 10,
                      runSpacing: 4,
                      children: [
                        Text(
                          document.readableSize,
                          style: const TextStyle(
                            fontSize: 11.5,
                            color: AppTheme.secondary,
                          ),
                        ),
                        if (document.version != null && document.version!.isNotEmpty)
                          Text(
                            document.version!,
                            style: const TextStyle(
                              fontSize: 11.5,
                              color: AppTheme.secondary,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.download_outlined, size: 20, color: AppTheme.primary),
            ],
          ),
        ),
      ),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({required this.icon, required this.title, this.action});

  final IconData icon;
  final String title;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 44, color: AppTheme.secondary),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.secondary, height: 1.6),
            ),
            if (action != null) ...[const SizedBox(height: 12), action!],
          ],
        ),
      ),
    );
  }
}
