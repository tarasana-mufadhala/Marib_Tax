import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/design/widgets.dart';
import '../data/service_repository.dart';
import '../domain/service_models.dart';
import 'service_form_page.dart';

/// يفتح خدمة بعينها من رمزها مباشرة.
///
/// بطاقة الخدمة في الرئيسية تعرف رمزها لا تعريفها الكامل، والتعريف يأتي من
/// كتالوج الخادم — فنجلبه هنا ثم ننتقل إلى النموذج. الكتالوج هو المرجع لما
/// يُتاح لهذا المكلف: خدمة يحجبها الخادم لا تُفتح، وتُشرح للمكلف بدل أن
/// تفتح نموذجاً سيُرفَض عند الإرسال.
class ServiceLauncher extends StatefulWidget {
  const ServiceLauncher({super.key, required this.code, required this.title});

  final String code;
  final String title;

  @override
  State<ServiceLauncher> createState() => _ServiceLauncherState();
}

class _ServiceLauncherState extends State<ServiceLauncher> {
  late Future<List<ServiceDefinition>> _catalog;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _catalog = context.read<ServiceRepository>().catalog();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: FutureBuilder<List<ServiceDefinition>>(
        future: _catalog,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Padding(
              padding: const EdgeInsets.all(AppTheme.screenPadding),
              child: Skeleton.cards(count: 3, height: 84),
            );
          }

          if (snapshot.hasError) {
            return EmptyState(
              icon: Icons.cloud_off,
              message: snapshot.error is ApiException
                  ? (snapshot.error as ApiException).message
                  : 'تعذّر تحميل الخدمة',
              actionLabel: 'إعادة المحاولة',
              onAction: () => setState(_load),
            );
          }

          final service = (snapshot.data ?? const <ServiceDefinition>[])
              .where((item) => item.code == widget.code)
              .firstOrNull;

          if (service == null) {
            return const EmptyState(
              icon: Icons.lock_outline,
              message: 'هذه الخدمة غير متاحة لحسابك حالياً.\n'
                  'قد تكون مشروطة بحالة ملفك الضريبي — راجع المكتب '
                  'إن كنت تحتاجها.',
            );
          }

          // النموذج يحل محل هذه الشاشة في المكدّس، فزر الرجوع يعود
          // للرئيسية لا لشاشة تحميل انتهى دورها.
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted) return;
            Navigator.of(context).pushReplacement(
              MaterialPageRoute<void>(
                builder: (_) => ServiceFormPage(service: service),
              ),
            );
          });
          return const SizedBox.shrink();
        },
      ),
    );
  }
}
