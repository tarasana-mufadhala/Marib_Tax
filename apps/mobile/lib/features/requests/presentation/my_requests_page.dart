import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/design/status_style.dart';
import '../../../core/design/widgets.dart';
import '../../balaghs/data/balagh_repository.dart';
import '../../balaghs/domain/balagh_forms.dart';
import '../../balaghs/presentation/balaghs_page.dart';
import '../../home/data/home_repository.dart';
import '../../home/domain/home_models.dart';
import '../../services/presentation/services_page.dart';
import 'request_details_page.dart';

/// مجموعات التصفية كما يفهمها المكلف — لا رموز حالات خام.
enum RequestFilter {
  all('الكل'),
  underReview('قيد المراجعة'),
  actionNeeded('بانتظار إجراء'),
  ready('جاهز'),
  completed('مكتمل');

  const RequestFilter(this.label);

  final String label;

  bool matches(RequestStatus status) => switch (this) {
        RequestFilter.all => true,
        RequestFilter.underReview => status == RequestStatus.underReview ||
            status == RequestStatus.submitted ||
            status == RequestStatus.received ||
            status == RequestStatus.fieldVisitScheduled,
        RequestFilter.actionNeeded => status.needsTaxpayerAction &&
            status != RequestStatus.readyForPickup,
        RequestFilter.ready => status == RequestStatus.readyForPickup,
        RequestFilter.completed => status == RequestStatus.completed ||
            status == RequestStatus.approved,
      };
}

/// «طلباتي»: تبويب للخدمات وآخر للبلاغات، ومرشّحات حالة فوق كلٍّ منهما.
class MyRequestsPage extends StatefulWidget {
  const MyRequestsPage({super.key});

  @override
  State<MyRequestsPage> createState() => _MyRequestsPageState();
}

class _MyRequestsPageState extends State<MyRequestsPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 2, vsync: this);

  late Future<List<RequestSummary>> _requests;
  late Future<List<BalaghSummary>> _balaghs;
  RequestFilter _filter = RequestFilter.all;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _requests = context.read<HomeRepository>().myRequests();
    _balaghs = context.read<BalaghRepository>().mine();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    setState(_load);
    await Future.wait([
      _requests.catchError((_) => <RequestSummary>[]),
      _balaghs.catchError((_) => <BalaghSummary>[]),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('طلباتي'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(94),
          child: Column(
            children: [
              TabBar(
                controller: _tabs,
                labelColor: AppTheme.primary,
                unselectedLabelColor: AppTheme.secondary,
                indicatorColor: AppTheme.primary,
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: AppTheme.border,
                labelStyle: const TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
                tabs: const [Tab(text: 'الخدمات'), Tab(text: 'البلاغات')],
              ),
              Container(
                color: AppTheme.surface,
                padding: const EdgeInsets.fromLTRB(
                  AppTheme.screenPadding,
                  10,
                  AppTheme.screenPadding,
                  10,
                ),
                child: FilterChips<RequestFilter>(
                  options: [
                    for (final option in RequestFilter.values)
                      (value: option, label: option.label),
                  ],
                  selected: _filter,
                  onSelected: (value) => setState(() => _filter = value),
                ),
              ),
            ],
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _ServiceRequestsTab(
            future: _requests,
            filter: _filter,
            onRefresh: _refresh,
          ),
          _BalaghsTab(
            future: _balaghs,
            filter: _filter,
            onRefresh: _refresh,
          ),
        ],
      ),
    );
  }
}

class _ServiceRequestsTab extends StatelessWidget {
  const _ServiceRequestsTab({
    required this.future,
    required this.filter,
    required this.onRefresh,
  });

  final Future<List<RequestSummary>> future;
  final RequestFilter filter;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<RequestSummary>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const _LoadingList();
        }
        if (snapshot.hasError) {
          return _ListShell(
            onRefresh: onRefresh,
            child: EmptyState(
              icon: Icons.cloud_off,
              message: 'تعذّر تحميل طلباتك',
              actionLabel: 'إعادة المحاولة',
              onAction: onRefresh,
            ),
          );
        }

        final items = (snapshot.data ?? const <RequestSummary>[])
            .where((item) => filter.matches(item.status))
            .toList(growable: false);

        if (items.isEmpty) {
          return _ListShell(
            onRefresh: onRefresh,
            child: EmptyState(
              icon: Icons.description_outlined,
              message: filter == RequestFilter.all
                  ? 'لم تقدّم أي طلب بعد'
                  : 'لا توجد طلبات في هذه الحالة',
              actionLabel: filter == RequestFilter.all ? 'تقديم طلب' : null,
              onAction: filter == RequestFilter.all
                  ? () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const ServicesPage(),
                        ),
                      )
                  : null,
            ),
          );
        }

        return _ListShell(
          onRefresh: onRefresh,
          child: Column(
            children: [
              for (final item in items)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppTheme.cardGap),
                  child: _TransactionCard(
                    title: item.serviceName ?? 'طلب خدمة',
                    reference: item.publicRef,
                    status: item.status,
                    date: item.submittedAt,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => RequestDetailsPage(
                          requestId: item.id,
                          title: item.serviceName ?? 'طلب خدمة',
                          reference: item.publicRef,
                          status: item.status,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _BalaghsTab extends StatelessWidget {
  const _BalaghsTab({
    required this.future,
    required this.filter,
    required this.onRefresh,
  });

  final Future<List<BalaghSummary>> future;
  final RequestFilter filter;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<BalaghSummary>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const _LoadingList();
        }
        if (snapshot.hasError) {
          return _ListShell(
            onRefresh: onRefresh,
            child: EmptyState(
              icon: Icons.cloud_off,
              message: 'تعذّر تحميل بلاغاتك',
              actionLabel: 'إعادة المحاولة',
              onAction: onRefresh,
            ),
          );
        }

        final items = (snapshot.data ?? const <BalaghSummary>[])
            .where((item) => filter.matches(RequestStatus.fromCode(item.status)))
            .toList(growable: false);

        if (items.isEmpty) {
          return _ListShell(
            onRefresh: onRefresh,
            child: EmptyState(
              icon: Icons.campaign_outlined,
              message: filter == RequestFilter.all
                  ? 'لم تقدّم أي بلاغ بعد'
                  : 'لا توجد بلاغات في هذه الحالة',
              actionLabel: filter == RequestFilter.all ? 'تقديم بلاغ' : null,
              onAction: filter == RequestFilter.all
                  ? () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const BalaghsPage(),
                        ),
                      )
                  : null,
            ),
          );
        }

        return _ListShell(
          onRefresh: onRefresh,
          child: Column(
            children: [
              for (final item in items)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppTheme.cardGap),
                  child: _TransactionCard(
                    title: balaghTypeOf(item.balaghType)?.title ??
                        item.balaghType,
                    reference: item.publicRef ?? '—',
                    status: RequestStatus.fromCode(item.status),
                    date: null,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => RequestDetailsPage(
                          requestId: item.id,
                          title: balaghTypeOf(item.balaghType)?.title ??
                              item.balaghType,
                          reference: item.publicRef ?? '—',
                          status: RequestStatus.fromCode(item.status),
                          isBalagh: true,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

/// بطاقة معاملة موحّدة للطلبات والبلاغات.
class _TransactionCard extends StatelessWidget {
  const _TransactionCard({
    required this.title,
    required this.reference,
    required this.status,
    required this.date,
    required this.onTap,
  });

  final String title;
  final String reference;
  final RequestStatus status;
  final DateTime? date;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppTheme.surface,
      borderRadius: BorderRadius.circular(AppTheme.cardRadius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
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
                      title,
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.text,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusChip(status: status),
                ],
              ),
              const SizedBox(height: 7),
              Text(
                reference,
                textDirection: TextDirection.ltr,
                textAlign: TextAlign.right,
                style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.secondary,
                ),
              ),
              if (date != null) ...[
                const SizedBox(height: 4),
                Text(
                  'تاريخ التقديم: ${_formatDate(date!)}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.secondary,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

String _formatDate(DateTime value) {
  final local = value.toLocal();
  final month = local.month.toString().padLeft(2, '0');
  final day = local.day.toString().padLeft(2, '0');
  return '${local.year}/$month/$day';
}

class _ListShell extends StatelessWidget {
  const _ListShell({required this.child, required this.onRefresh});

  final Widget child;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppTheme.screenPadding,
          14,
          AppTheme.screenPadding,
          24,
        ),
        children: [child],
      ),
    );
  }
}

class _LoadingList extends StatelessWidget {
  const _LoadingList();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppTheme.screenPadding,
        14,
        AppTheme.screenPadding,
        24,
      ),
      children: [Skeleton.cards(count: 4)],
    );
  }
}
