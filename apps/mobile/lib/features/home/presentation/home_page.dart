import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../auth/presentation/auth_controller.dart';
import '../../content/presentation/contact_page.dart';
import '../../content/presentation/content_page_view.dart';
import '../../content/presentation/document_list_page.dart';
import '../../account/presentation/account_page.dart';
import '../../balaghs/presentation/balaghs_page.dart';
import '../../services/presentation/services_page.dart';
import '../data/home_repository.dart';
import '../domain/home_models.dart';

/// الصفحة الرئيسية بعد الدخول (القسم 4.2) — العناصر مرتّبة حسب الأهمية
/// كما نصّ المستند: الإعلانات ثم الخدمات (الأبرز) ثم الاستعلامات ثم الإشعارات.
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  static const String routeName = '/';

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late Future<List<Announcement>> _announcements;
  late Future<List<RequestSummary>> _requests;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    final repository = context.read<HomeRepository>();
    _announcements = repository.announcements();
    _requests = repository.myRequests();
  }

  Future<void> _refresh() async {
    setState(_load);
    await Future.wait([
      _announcements.catchError((_) => <Announcement>[]),
      _requests.catchError((_) => <RequestSummary>[]),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('مكتب الضرائب — مأرب'),
        actions: [
          IconButton(
            tooltip: 'حسابي',
            icon: const Icon(Icons.person_outline),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(builder: (_) => const AccountPage()),
            ),
          ),
          IconButton(
            tooltip: 'تسجيل الخروج',
            icon: const Icon(Icons.logout),
            onPressed: () => context.read<AuthController>().logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _AnnouncementsBanner(future: _announcements),
            const SizedBox(height: 24),
            const _SectionTitle('الخدمات المقدَّمة'),
            const SizedBox(height: 12),
            const _ServicesGrid(),
            const SizedBox(height: 24),
            const _SectionTitle('الاستعلامات'),
            const SizedBox(height: 12),
            _RequestsSummary(future: _requests),
            const SizedBox(height: 24),
            const _SectionTitle('معلومات ومحتوى'),
            const SizedBox(height: 12),
            const _InfoLinks(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: AppTheme.primaryDark,
        ),
      );
}

class _AnnouncementsBanner extends StatelessWidget {
  const _AnnouncementsBanner({required this.future});

  final Future<List<Announcement>> future;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Announcement>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const _BannerShell(child: LinearProgressIndicator());
        }
        final items = snapshot.data ?? const <Announcement>[];
        if (items.isEmpty) {
          return const _BannerShell(
            child: Text(
              'لا توجد إعلانات حالياً',
              style: TextStyle(color: Colors.white70),
            ),
          );
        }
        return SizedBox(
          height: 132,
          child: PageView.builder(
            itemCount: items.length,
            controller: PageController(viewportFraction: 0.94),
            itemBuilder: (context, index) {
              final item = items[index];
              return Padding(
                padding: const EdgeInsets.only(left: 8),
                child: _BannerShell(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Expanded(
                        child: Text(
                          item.body ?? '',
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFFD6E8E1),
                            fontSize: 13,
                            height: 1.6,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class _BannerShell extends StatelessWidget {
  const _BannerShell({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 132,
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primaryDark, AppTheme.primary],
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      alignment: Alignment.centerRight,
      child: child,
    );
  }
}

/// الخدمات الخمس والبلاغات الستة (4.3 و4.4).
///
/// الطلبات تفتح كتالوج الخادم الحقيقي — لا قائمة ثابتة هنا، لأن ما يُتاح
/// للمكلف يعتمد على حالته (FR-102 مثلاً تُخفى عمّن يملك رقماً ضريبياً).
/// البلاغات الستة تفتح نموذجاً يُبنى من وصف حقول مطابق لمخطط الخادم.
class _ServicesGrid extends StatelessWidget {
  const _ServicesGrid();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _GroupLabel('الطلبات'),
        const _RequestsEntryCard(),
        const SizedBox(height: 16),
        const _GroupLabel('البلاغات'),
        const _BalaghsEntryCard(),
      ],
    );
  }

}

/// مدخل واحد لكل خدمات القسم 4.3؛ القائمة تُقرأ من الخادم داخل الشاشة.
class _RequestsEntryCard extends StatelessWidget {
  const _RequestsEntryCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (_) => const ServicesPage()),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                height: 44,
                width: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF4F0),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.folder_open, color: AppTheme.primary),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'تقديم طلب خدمة',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'فتح ملف ضريبي، استخراج رقم، بدل فاقد، تحديث بيانات، شهادة مبيعات',
                      style: TextStyle(fontSize: 12.5, color: Color(0xFF5A6B63), height: 1.5),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_left, color: AppTheme.primary),
            ],
          ),
        ),
      ),
    );
  }
}

/// مدخل البلاغات الستة، بنفس شكل بطاقة الطلبات: الشاشة الأولى تعرض
/// مدخلين واضحين لا اثنتي عشرة بطاقة.
class _BalaghsEntryCard extends StatelessWidget {
  const _BalaghsEntryCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (_) => const BalaghsPage()),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                height: 44,
                width: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF4F0),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.campaign_outlined, color: AppTheme.primary),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'تقديم بلاغ',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'إيقاف نشاط، خروج مستأجر، خروج عامل، تغيير عنوان، نقل ملكية، تفعيل نشاط',
                      style: TextStyle(fontSize: 12.5, color: Color(0xFF5A6B63), height: 1.5),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_left, color: AppTheme.primary),
            ],
          ),
        ),
      ),
    );
  }
}

class _GroupLabel extends StatelessWidget {
  const _GroupLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Color(0xFF5A6B63),
          ),
        ),
      );
}

class _RequestsSummary extends StatelessWidget {
  const _RequestsSummary({required this.future});

  final Future<List<RequestSummary>> future;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<RequestSummary>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            ),
          );
        }
        if (snapshot.hasError) {
          return const Card(
            child: ListTile(
              leading: Icon(Icons.cloud_off, color: Color(0xFF9AAAA3)),
              title: Text('تعذّر تحميل طلباتك'),
              subtitle: Text('اسحب للأسفل لإعادة المحاولة'),
            ),
          );
        }
        final items = snapshot.data ?? const <RequestSummary>[];
        if (items.isEmpty) {
          return const Card(
            child: ListTile(
              leading: Icon(Icons.inbox_outlined, color: Color(0xFF9AAAA3)),
              title: Text('لا توجد طلبات أو بلاغات بعد'),
              subtitle: Text('ابدأ بأي خدمة من القائمة أعلاه'),
            ),
          );
        }
        return Card(
          child: Column(
            children: [
              for (final item in items.take(5))
                ListTile(
                  title: Text(item.serviceName ?? item.publicRef),
                  subtitle: Text(item.publicRef, textDirection: TextDirection.ltr),
                  trailing: _StatusChip(status: item.status),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final RequestStatus status;

  @override
  Widget build(BuildContext context) {
    final (background, foreground) = switch (status) {
      _ when status.needsTaxpayerAction => (const Color(0xFFFFF3E0), const Color(0xFF9A5B00)),
      RequestStatus.rejected || RequestStatus.cancelled => (const Color(0xFFFDECEA), AppTheme.danger),
      RequestStatus.completed || RequestStatus.approved => (const Color(0xFFE8F5EE), AppTheme.primaryDark),
      _ => (const Color(0xFFEEF2F0), const Color(0xFF5A6B63)),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.label,
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: foreground),
      ),
    );
  }
}

/// أقسام المحتوى (4.2 بنود 5–11).
///
/// كلها تقرأ من نقاط الموقع العام نفسها، فما ينشره المكتب يظهر في الموقع
/// والتطبيق معاً بلا ازدواج في المصدر.
class _InfoLinks extends StatelessWidget {
  const _InfoLinks();

  @override
  Widget build(BuildContext context) {
    final entries = <({IconData icon, String label, Widget Function() page})>[
      (
        icon: Icons.info_outline,
        label: 'عن المكتب',
        page: () => const ContentPageView(
              pageKey: 'about',
              title: 'عن المكتب',
              fallback:
                  'مكتب الضرائب بمحافظة مأرب — الجهة المسؤولة عن تحصيل الضرائب '
                  'وتقديم الخدمات الضريبية في المحافظة.',
            ),
      ),
      (
        icon: Icons.menu_book_outlined,
        label: 'مركز المعلومات',
        page: () => const ContentPageView(
              pageKey: 'info-center',
              title: 'مركز المعلومات',
            ),
      ),
      (
        icon: Icons.help_outline,
        label: 'الإرشادات',
        page: () => const DocumentListPage(
              introPageKey: 'guidelines',
              title: 'الإرشادات والأدلة',
              subtitle:
                  'أدلة المصلحة الإرشادية تشرح إجراءات التسجيل والإقرارات '
                  'والتحصيل والمنازعات خطوةً بخطوة.',
              category: 'guide',
            ),
      ),
      (
        icon: Icons.description_outlined,
        label: 'النماذج',
        page: () => const DocumentListPage(
              title: 'النماذج والإقرارات',
              subtitle: 'الاستمارات المعتمدة للتعبئة والتقديم لدى المكتب.',
              category: 'form',
            ),
      ),
      (
        icon: Icons.gavel_outlined,
        label: 'القوانين واللوائح',
        page: () => const DocumentListPage(
              title: 'القوانين واللوائح',
              subtitle: 'النصوص القانونية الحاكمة للعمل الضريبي.',
              category: 'law',
            ),
      ),
      (
        icon: Icons.article_outlined,
        label: 'القرارات والتعليمات',
        page: () => const DocumentListPage(
              title: 'القرارات والتعليمات',
              subtitle: 'القرارات والتعاميم الصادرة عن مصلحة الضرائب.',
              category: 'decision',
            ),
      ),
      (
        icon: Icons.receipt_long_outlined,
        label: 'ضرائب الدخل',
        page: () => const DocumentListPage(
              title: 'ضرائب الدخل',
              subtitle:
                  'كل ما يخص ضريبة الدخل: القوانين والقرارات والإقرارات والأدلة.',
              topic: 'income_tax',
            ),
      ),
      (
        icon: Icons.point_of_sale_outlined,
        label: 'ضريبة المبيعات',
        page: () => const DocumentListPage(
              title: 'ضريبة المبيعات',
              subtitle:
                  'كل ما يخص الضريبة العامة على المبيعات: القوانين والقرارات '
                  'والنماذج والأدلة.',
              topic: 'sales_tax',
            ),
      ),
      (
        icon: Icons.call_outlined,
        label: 'عناوين الاتصال',
        page: () => const ContactPage(),
      ),
    ];

    return Card(
      child: Column(
        children: [
          for (final entry in entries)
            ListTile(
              leading: Icon(entry.icon, color: AppTheme.primary),
              title: Text(entry.label),
              trailing: const Icon(Icons.chevron_left, size: 20),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => entry.page()),
              ),
            ),
        ],
      ),
    );
  }
}
