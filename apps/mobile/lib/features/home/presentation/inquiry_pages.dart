import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/design/widgets.dart';
import '../../account/data/account_repository.dart';

/// استعلام «الرقم الضريبي وبياناته».
class TaxNumberPage extends StatefulWidget {
  const TaxNumberPage({super.key});

  @override
  State<TaxNumberPage> createState() => _TaxNumberPageState();
}

class _TaxNumberPageState extends State<TaxNumberPage> {
  late Future<AccountProfile> _profile;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _profile = context.read<AccountRepository>().me();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الرقم الضريبي وبياناته')),
      body: FutureBuilder<AccountProfile>(
        future: _profile,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Padding(
              padding: const EdgeInsets.all(AppTheme.screenPadding),
              child: Skeleton.cards(count: 2, height: 130),
            );
          }
          if (snapshot.hasError) {
            return EmptyState(
              icon: Icons.cloud_off,
              message: snapshot.error is ApiException
                  ? (snapshot.error as ApiException).message
                  : 'تعذّر تحميل بياناتك',
              actionLabel: 'إعادة المحاولة',
              onAction: () => setState(_load),
            );
          }

          final profile = snapshot.data!;
          final taxpayer = profile.taxpayer;

          if (taxpayer == null) {
            return const EmptyState(
              icon: Icons.badge_outlined,
              message: 'لم يتم ربط حسابك بملف ضريبي حتى الآن.\n'
                  'قدّم طلب فتح ملف ضريبي من شاشة الخدمات.',
            );
          }

          return RefreshIndicator(
            onRefresh: () async => setState(_load),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                AppTheme.screenPadding,
                14,
                AppTheme.screenPadding,
                24,
              ),
              children: [
                InfoCard(
                  title: 'الملف الضريبي',
                  rows: [
                    (label: 'الرقم الضريبي', value: taxpayer.taxNumber, ltr: true),
                    (label: 'الاسم لدى المكتب', value: taxpayer.displayName, ltr: false),
                    (label: 'الكيان القانوني', value: taxpayer.legalEntityName, ltr: false),
                    (label: 'حالة الملف', value: taxpayer.statusLabel, ltr: false),
                  ],
                ),
                const SizedBox(height: AppTheme.cardGap),
                if (profile.activities.isEmpty)
                  const EmptyState(
                    icon: Icons.storefront_outlined,
                    message: 'لا توجد أنشطة تجارية مسجَّلة باسمك.',
                  )
                else
                  for (final activity in profile.activities)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppTheme.cardGap),
                      child: InfoCard(
                        title: 'النشاط التجاري',
                        rows: [
                          (label: 'اسم النشاط', value: activity.name, ltr: false),
                          (label: 'نوع النشاط', value: activity.activityType, ltr: false),
                          (label: 'الحالة', value: activity.statusLabel, ltr: false),
                          (label: 'العنوان', value: activity.address, ltr: false),
                        ],
                      ),
                    ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// استعلام «المستحقات الضريبية».
class DuesPage extends StatefulWidget {
  const DuesPage({super.key});

  @override
  State<DuesPage> createState() => _DuesPageState();
}

class _DuesPageState extends State<DuesPage> {
  late Future<List<TaxDue>> _dues;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _dues = context.read<AccountRepository>().dues();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('المستحقات الضريبية')),
      body: FutureBuilder<List<TaxDue>>(
        future: _dues,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Padding(
              padding: const EdgeInsets.all(AppTheme.screenPadding),
              child: Skeleton.cards(count: 3, height: 88),
            );
          }
          if (snapshot.hasError) {
            return EmptyState(
              icon: Icons.cloud_off,
              message: snapshot.error is ApiException
                  ? (snapshot.error as ApiException).message
                  : 'تعذّر تحميل المستحقات',
              actionLabel: 'إعادة المحاولة',
              onAction: () => setState(_load),
            );
          }

          final dues = snapshot.data ?? const <TaxDue>[];
          final outstanding = dues.where((due) => !due.isSettled).toList();

          return RefreshIndicator(
            onRefresh: () async => setState(_load),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                AppTheme.screenPadding,
                14,
                AppTheme.screenPadding,
                24,
              ),
              children: [
                if (dues.isEmpty)
                  const EmptyState(
                    icon: Icons.verified_outlined,
                    message: 'لا توجد مستحقات مسجَّلة عليك.',
                  )
                else ...[
                  _DuesTotal(dues: outstanding),
                  const SizedBox(height: AppTheme.sectionGap),
                  for (final due in dues)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppTheme.cardGap),
                      child: _DueCard(due: due),
                    ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

/// إجمالي غير المسدَّد — أول ما يحتاج المكلف معرفته.
class _DuesTotal extends StatelessWidget {
  const _DuesTotal({required this.dues});

  final List<TaxDue> dues;

  @override
  Widget build(BuildContext context) {
    final total = dues.fold<double>(0, (sum, due) => sum + due.amount);
    final currency = dues.isEmpty ? 'YER' : dues.first.currencyCode;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: total > 0
              ? const [Color(0xFFD95757), Color(0xFFB94444)]
              : const [AppTheme.primary, AppTheme.primaryDark],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'إجمالي المستحق غير المسدَّد',
            style: TextStyle(fontSize: 12.5, color: Color(0xCCFFFFFF)),
          ),
          const SizedBox(height: 6),
          Text(
            '${_money(total)} $currency',
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          if (total > 0)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text(
                'السداد يتم لدى المكتب، ويُسجَّل في حسابك بعد التأكيد.',
                style: TextStyle(
                  fontSize: 12,
                  height: 1.6,
                  color: Color(0xE6FFFFFF),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _DueCard extends StatelessWidget {
  const _DueCard({required this.due});

  final TaxDue due;

  @override
  Widget build(BuildContext context) {
    final color = due.isSettled ? AppTheme.success : AppTheme.warning;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  due.serviceName ?? 'مستحق ضريبي',
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.text,
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  due.statusLabel,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${_money(due.amount)} ${due.currencyCode}',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.text,
            ),
          ),
          if (due.requestRef != null)
            Padding(
              padding: const EdgeInsets.only(top: 5),
              child: Text(
                'مرجع الطلب: ${due.requestRef}',
                textDirection: TextDirection.ltr,
                textAlign: TextAlign.right,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.secondary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// مبلغ بفواصل آلاف، فالمبالغ الضريبية طويلة ويصعب قراءتها بلا فواصل.
String _money(double value) {
  final whole = value.round().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < whole.length; i++) {
    if (i > 0 && (whole.length - i) % 3 == 0) buffer.write(',');
    buffer.write(whole[i]);
  }
  return buffer.toString();
}

/// بطاقة بيانات: عنوان وصفوف «تسمية: قيمة».
class InfoCard extends StatelessWidget {
  const InfoCard({super.key, required this.title, required this.rows});

  final String title;
  final List<({String label, String? value, bool ltr})> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(15, 13, 15, 6),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppTheme.primary,
            ),
          ),
          const SizedBox(height: 10),
          for (final row in rows)
            Padding(
              padding: const EdgeInsets.only(bottom: 9),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 116,
                    child: Text(
                      row.label,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: AppTheme.secondary,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      (row.value ?? '').trim().isEmpty ? '—' : row.value!,
                      textDirection: row.ltr ? TextDirection.ltr : null,
                      textAlign: row.ltr ? TextAlign.left : TextAlign.start,
                      style: const TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.text,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
