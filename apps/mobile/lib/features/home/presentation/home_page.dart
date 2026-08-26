import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/shell.dart';
import '../../../app/theme.dart';
import '../../../core/design/widgets.dart';
import '../../account/data/account_repository.dart';
import '../../balaghs/presentation/balaghs_page.dart';
import '../../services/presentation/service_launcher.dart';
import '../../services/presentation/services_page.dart';
import '../data/home_repository.dart';
import '../domain/home_models.dart';
import 'inquiry_pages.dart';

/// الصفحة الرئيسية: بطاقة المكلف، ثم الخدمات، ثم الاستعلامات.
///
/// الترتيب مقصود: ما يخص المكلف مباشرةً أولاً، ثم ما يستطيع فعله، ثم ما
/// يستطيع الاطلاع عليه.
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late Future<AccountProfile> _account;
  late Future<List<Announcement>> _announcements;
  late Future<Set<String>> _activeServiceCodes;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    final home = context.read<HomeRepository>();
    _account = context.read<AccountRepository>().me();
    _announcements = home.announcements();
    // رموز الخدمات التي للمكلف فيها طلب لم يُغلق بعد — تُبرَز على بطاقاتها.
    _activeServiceCodes = home
        .myRequests()
        .then((requests) => requests
            .where((request) => !request.status.isClosed)
            .map((request) => request.serviceCode ?? '')
            .where((code) => code.isNotEmpty)
            .toSet())
        .catchError((_) => <String>{});
  }

  Future<void> _refresh() async {
    setState(_load);
    await Future.wait([
      _account.catchError((_) => const AccountProfile()),
      _announcements.catchError((_) => <Announcement>[]),
      _activeServiceCodes,
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الرئيسية'),
        leading: IconButton(
          icon: const Icon(Icons.notifications_none),
          tooltip: 'الإشعارات',
          onPressed: () => AppShell.of(context)?.goToTab(2),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            tooltip: 'الملف الشخصي',
            onPressed: () => AppShell.of(context)?.goToTab(4),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppTheme.screenPadding,
            12,
            AppTheme.screenPadding,
            28,
          ),
          children: [
            _TaxpayerCard(future: _account),
            const SizedBox(height: AppTheme.sectionGap),
            SectionHeader(
              title: 'الخدمات',
              actionLabel: 'عرض الكل',
              onAction: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const ServicesPage()),
              ),
            ),
            _ServicesGrid(activeCodes: _activeServiceCodes),
            const SizedBox(height: AppTheme.sectionGap),
            const SectionHeader(title: 'الاستعلامات'),
            const _InquiriesList(),
            const SizedBox(height: AppTheme.sectionGap),
            _AnnouncementsSection(future: _announcements),
          ],
        ),
      ),
    );
  }
}

/// بطاقة المكلف الخضراء، أو دعوة لطلب رقم ضريبي إن لم يكن له رقم.
class _TaxpayerCard extends StatelessWidget {
  const _TaxpayerCard({required this.future});

  final Future<AccountProfile> future;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AccountProfile>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Skeleton(height: 104, radius: AppTheme.cardRadius);
        }

        final profile = snapshot.data;
        final taxNumber = profile?.taxpayer?.taxNumber;
        final hasTaxNumber = (taxNumber ?? '').trim().isNotEmpty;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
              colors: [AppTheme.primary, AppTheme.primaryDark],
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Container(
                height: 48,
                width: 48,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: const Icon(
                  Icons.account_balance_outlined,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'مرحباً بك',
                      style: TextStyle(fontSize: 12.5, color: Color(0xCCFFFFFF)),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      profile?.displayName ?? 'مكلف',
                      style: const TextStyle(
                        fontSize: 16.5,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 6),
                    if (hasTaxNumber)
                      Text(
                        'الرقم الضريبي: $taxNumber',
                        textDirection: TextDirection.ltr,
                        style: const TextStyle(
                          fontSize: 12.5,
                          color: Color(0xE6FFFFFF),
                        ),
                      )
                    else ...[
                      const Text(
                        'لم يتم ربط حسابك برقم ضريبي حتى الآن.',
                        style: TextStyle(
                          fontSize: 12.5,
                          height: 1.5,
                          color: Color(0xE6FFFFFF),
                        ),
                      ),
                      const SizedBox(height: 9),
                      SizedBox(
                        height: 34,
                        child: FilledButton(
                          onPressed: () => Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => const ServicesPage(),
                            ),
                          ),
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppTheme.primaryDark,
                            minimumSize: Size.zero,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            textStyle: const TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          child: const Text('طلب رقم ضريبي'),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// شبكة الخدمات الخمس مع مدخل البلاغات.
class _ServicesGrid extends StatelessWidget {
  const _ServicesGrid({required this.activeCodes});

  final Future<Set<String>> activeCodes;

  static const _items = [
    (
      code: 'FR-101',
      title: 'فتح ملف ضريبي',
      icon: Icons.note_add_outlined,
    ),
    (
      code: 'FR-102',
      title: 'استخراج رقم ضريبي',
      icon: Icons.badge_outlined,
    ),
    (code: 'FR-103', title: 'بدل فاقد', icon: Icons.restore_page_outlined),
    (code: 'FR-104', title: 'تحديث بيانات', icon: Icons.edit_note_outlined),
    (
      code: 'FR-105',
      title: 'شهادة ضريبة المبيعات',
      icon: Icons.workspace_premium_outlined,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Set<String>>(
      future: activeCodes,
      builder: (context, snapshot) {
        final active = snapshot.data ?? const <String>{};
        return GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: AppTheme.cardGap,
          crossAxisSpacing: AppTheme.cardGap,
          childAspectRatio: 0.92,
          children: [
            for (final item in _items)
              _ServiceTile(
                title: item.title,
                icon: item.icon,
                hasActiveRequest: active.contains(item.code),
                // تفتح الخدمة نفسها لا قائمة الخدمات. الكتالوج يُجلب داخل
                // المُشغّل ليبقى الخادم هو المرجع لما يُتاح لهذا المكلف.
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => ServiceLauncher(
                      code: item.code,
                      title: item.title,
                    ),
                  ),
                ),
              ),
            _ServiceTile(
              title: 'البلاغات',
              icon: Icons.campaign_outlined,
              accent: AppTheme.warning,
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const BalaghsPage()),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _ServiceTile extends StatelessWidget {
  const _ServiceTile({
    required this.title,
    required this.icon,
    required this.onTap,
    this.accent,
    this.hasActiveRequest = false,
  });

  final String title;
  final IconData icon;
  final VoidCallback onTap;
  final Color? accent;

  /// للمكلف طلب قائم على هذه الخدمة لم يُغلق بعد.
  final bool hasActiveRequest;

  @override
  Widget build(BuildContext context) {
    final color = accent ?? AppTheme.primary;
    return Material(
      color: AppTheme.surface,
      borderRadius: BorderRadius.circular(AppTheme.cardRadius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppTheme.cardRadius),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    height: 40,
                    width: 40,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: Icon(icon, size: 21, color: color),
                  ),
                  if (hasActiveRequest)
                    PositionedDirectional(
                      top: -2,
                      end: -2,
                      child: Container(
                        height: 11,
                        width: 11,
                        decoration: BoxDecoration(
                          color: AppTheme.warning,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppTheme.surface, width: 2),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 9),
              Text(
                title,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  height: 1.3,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.text,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InquiriesList extends StatelessWidget {
  const _InquiriesList();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        NavRow(
          icon: Icons.badge_outlined,
          title: 'الرقم الضريبي وبياناته',
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute<void>(builder: (_) => const TaxNumberPage()),
          ),
        ),
        const SizedBox(height: AppTheme.cardGap),
        NavRow(
          icon: Icons.payments_outlined,
          title: 'المستحقات الضريبية',
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute<void>(builder: (_) => const DuesPage()),
          ),
        ),
        const SizedBox(height: AppTheme.cardGap),
        NavRow(
          icon: Icons.description_outlined,
          title: 'حالة الطلبات',
          onTap: () => AppShell.of(context)?.goToTab(1),
        ),
        const SizedBox(height: AppTheme.cardGap),
        NavRow(
          icon: Icons.campaign_outlined,
          title: 'حالة البلاغات',
          onTap: () => AppShell.of(context)?.goToTab(1),
        ),
      ],
    );
  }
}

class _AnnouncementsSection extends StatelessWidget {
  const _AnnouncementsSection({required this.future});

  final Future<List<Announcement>> future;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Announcement>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Skeleton(height: 72, radius: AppTheme.cardRadius);
        }
        final items = snapshot.data ?? const <Announcement>[];
        if (items.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SectionHeader(title: 'إعلانات المكتب'),
            for (final item in items.take(3))
              Padding(
                padding: const EdgeInsets.only(bottom: AppTheme.cardGap),
                child: Container(
                  padding: const EdgeInsets.all(13),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.text,
                        ),
                      ),
                      if ((item.body ?? '').trim().isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 5),
                          child: Text(
                            item.body!,
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12.5,
                              height: 1.6,
                              color: AppTheme.secondary,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
