import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../core/design/widgets.dart';
import 'contact_page.dart';
import 'content_page_view.dart';
import 'document_list_page.dart';

/// مركز المعلومات: نفس محتوى الموقع العام بنفس مفاتيحه، فما يُنشر مرة
/// يظهر في التطبيق والموقع معاً.
class InfoCenterPage extends StatelessWidget {
  const InfoCenterPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('مركز المعلومات')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppTheme.screenPadding,
          14,
          AppTheme.screenPadding,
          24,
        ),
        children: [
          _Entry(
            icon: Icons.menu_book_outlined,
            title: 'الإرشادات',
            description: 'دليل استخدام الخدمات.',
            page: const ContentPageView(
              pageKey: 'guidelines',
              title: 'الإرشادات',
              fallback: 'لم تُنشر الإرشادات بعد.',
            ),
          ),
          _Entry(
            icon: Icons.download_outlined,
            title: 'النماذج القابلة للتحميل',
            description: 'نماذج وإقرارات رسمية.',
            page: const DocumentListPage(
              title: 'النماذج',
              subtitle: 'نماذج وإقرارات رسمية جاهزة للتحميل والطباعة.',
              category: 'forms',
            ),
          ),
          _Entry(
            icon: Icons.gavel_outlined,
            title: 'القوانين واللوائح',
            description: 'الأنظمة الضريبية المعتمدة.',
            page: const DocumentListPage(
              title: 'القوانين واللوائح',
              subtitle: 'الأنظمة والقوانين الضريبية المعتمدة.',
              category: 'laws',
            ),
          ),
          _Entry(
            icon: Icons.article_outlined,
            title: 'القرارات والتعليمات',
            description: 'القرارات والتنبيهات الصادرة.',
            page: const DocumentListPage(
              title: 'القرارات والتعليمات',
              subtitle: 'القرارات والتنبيهات الصادرة عن المكتب.',
              category: 'decisions',
            ),
          ),
          _Entry(
            icon: Icons.account_balance_outlined,
            title: 'عن المكتب',
            description: 'نبذة عن مكتب الضرائب بمحافظة مأرب.',
            page: const ContentPageView(
              pageKey: 'about',
              title: 'عن المكتب',
              fallback: 'لم تُنشر هذه الصفحة بعد.',
            ),
          ),
          _Entry(
            icon: Icons.support_agent_outlined,
            title: 'معلومات التواصل',
            description: 'موقع المكتب وطرق التواصل.',
            page: const ContactPage(),
            isLast: true,
          ),
        ],
      ),
    );
  }
}

class _Entry extends StatelessWidget {
  const _Entry({
    required this.icon,
    required this.title,
    required this.description,
    required this.page,
    this.isLast = false,
  });

  final IconData icon;
  final String title;
  final String description;
  final Widget page;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : AppTheme.cardGap),
      child: NavRow(
        icon: icon,
        title: title,
        subtitle: description,
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (_) => page),
        ),
      ),
    );
  }
}
