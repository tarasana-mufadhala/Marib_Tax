import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/api/api_exception.dart';
import '../data/service_repository.dart';
import '../domain/service_models.dart';
import 'service_form_page.dart';

/// كتالوج الخدمات (القسم 4.3). المعروض هنا هو ما يسمح به الخادم لهذا المكلف:
/// FR-102 لا تظهر لمن يملك رقماً ضريبياً — والإخفاء ليس الحماية، الخادم يرفضها أيضاً.
class ServicesPage extends StatefulWidget {
  const ServicesPage({super.key});

  static const String routeName = '/services';

  @override
  State<ServicesPage> createState() => _ServicesPageState();
}

class _ServicesPageState extends State<ServicesPage> {
  late Future<List<ServiceDefinition>> _catalog;

  @override
  void initState() {
    super.initState();
    _catalog = context.read<ServiceRepository>().catalog();
  }

  void _reload() {
    setState(() {
      _catalog = context.read<ServiceRepository>().catalog();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الخدمات المقدَّمة')),
      body: FutureBuilder<List<ServiceDefinition>>(
        future: _catalog,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            final message = snapshot.error is ApiException
                ? (snapshot.error as ApiException).message
                : 'تعذّر تحميل الخدمات';
            return _ErrorState(message: message, onRetry: _reload);
          }

          final services = snapshot.data ?? const <ServiceDefinition>[];
          if (services.isEmpty) {
            return const _ErrorState(message: 'لا توجد خدمات متاحة حالياً');
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: services.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) =>
                _ServiceCard(service: services[index]),
          );
        },
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  const _ServiceCard({required this.service});

  final ServiceDefinition service;

  @override
  Widget build(BuildContext context) {
    final mandatory = service.documents
        .where((d) => d.requirement != DocumentRequirement.optional)
        .length;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => ServiceFormPage(service: service),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      service.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryDark,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2F0),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      service.code,
                      textDirection: TextDirection.ltr,
                      style: const TextStyle(fontSize: 11, color: Color(0xFF5A6B63)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                service.acceptanceNote,
                style: const TextStyle(
                  fontSize: 13,
                  height: 1.6,
                  color: Color(0xFF5A6B63),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.attach_file, size: 16, color: Color(0xFF7A8A83)),
                  const SizedBox(width: 6),
                  Text(
                    '$mandatory مستند مطلوب',
                    style: const TextStyle(fontSize: 12.5, color: Color(0xFF7A8A83)),
                  ),
                  const Spacer(),
                  const Text(
                    'ابدأ الطلب',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary,
                    ),
                  ),
                  const Icon(Icons.chevron_left, size: 18, color: AppTheme.primary),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off, size: 44, color: Color(0xFF9AAAA3)),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF5A6B63)),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton(onPressed: onRetry, child: const Text('إعادة المحاولة')),
            ],
          ],
        ),
      ),
    );
  }
}
