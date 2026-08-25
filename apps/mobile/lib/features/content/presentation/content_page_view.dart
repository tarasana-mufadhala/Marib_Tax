import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/api/api_exception.dart';
import '../data/content_repository.dart';
import '../domain/content_models.dart';

/// صفحة محتوى يحرّرها المكتب من اللوحة (عن المكتب، الإرشادات، مركز
/// المعلومات) — نفس مفاتيح الصفحات التي يستعملها الموقع العام، فما يُنشر
/// يظهر في الاثنين معاً.
class ContentPageView extends StatefulWidget {
  const ContentPageView({
    super.key,
    required this.pageKey,
    required this.title,
    this.fallback,
  });

  final String pageKey;
  final String title;

  /// نص يُعرض إن لم تكن الصفحة منشورة بعد.
  final String? fallback;

  @override
  State<ContentPageView> createState() => _ContentPageViewState();
}

class _ContentPageViewState extends State<ContentPageView> {
  late Future<ContentPage?> _page;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _page = context.read<ContentRepository>().page(widget.pageKey);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: FutureBuilder<ContentPage?>(
        future: _page,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final failed = snapshot.hasError;
          final page = snapshot.data;
          final body = page?.body.trim() ?? '';

          if (body.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async => setState(_load),
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  const SizedBox(height: 40),
                  Icon(
                    failed ? Icons.cloud_off : Icons.article_outlined,
                    size: 44,
                    color: const Color(0xFF9AAAA3),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    failed
                        ? (snapshot.error is ApiException
                            ? (snapshot.error as ApiException).message
                            : 'تعذّر تحميل المحتوى')
                        : widget.fallback ?? 'لم يُنشر محتوى هذه الصفحة بعد',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 14,
                      height: 1.8,
                      color: Color(0xFF5A6B63),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: TextButton(
                      onPressed: () => setState(_load),
                      child: const Text('تحديث'),
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => setState(_load),
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                if ((page?.title ?? '').isNotEmpty) ...[
                  Text(
                    page!.title,
                    style: const TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 14),
                ],
                Text(
                  body,
                  style: const TextStyle(fontSize: 14.5, height: 1.9),
                ),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }
}
