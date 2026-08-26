import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/design/widgets.dart';
import '../../home/data/home_repository.dart';
import '../../home/domain/home_models.dart';

enum NotificationFilter {
  all('الكل'),
  requests('طلبات'),
  balaghs('بلاغات'),
  general('عام');

  const NotificationFilter(this.label);

  final String label;
}

/// نبرة الإشعار مستنتجة من نصّه.
///
/// الخادم يرسل عنواناً ونصّاً بلا تصنيف، والمكلف يحتاج أن يميّز «مطلوب
/// سداد» عن «جاهز للاستلام» بلمحة. الاستنتاج هنا عرضٌ فقط: لا قرار يُبنى
/// عليه، فخطؤه يكلّف أيقونة لا أكثر.
enum _Tone { success, warning, danger, info }

_Tone _toneOf(AppNotification notification) {
  final text = '${notification.title} ${notification.body}';
  if (text.contains('سداد') || text.contains('متأخر')) return _Tone.danger;
  if (text.contains('جاهز') || text.contains('اكتمل') || text.contains('موافقة')) {
    return _Tone.success;
  }
  if (text.contains('استكمال') ||
      text.contains('مطلوب') ||
      text.contains('نزول')) {
    return _Tone.warning;
  }
  return _Tone.info;
}

bool _matches(AppNotification notification, NotificationFilter filter) {
  final text = '${notification.title} ${notification.body}';
  return switch (filter) {
    NotificationFilter.all => true,
    NotificationFilter.requests => text.contains('طلب'),
    NotificationFilter.balaghs => text.contains('بلاغ') || text.contains('إخطار'),
    NotificationFilter.general =>
      !text.contains('طلب') && !text.contains('بلاغ'),
  };
}

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  late Future<List<AppNotification>> _notifications;
  NotificationFilter _filter = NotificationFilter.all;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _notifications = context.read<HomeRepository>().notifications();
  }

  Future<void> _refresh() async {
    setState(_load);
    await _notifications.catchError((_) => <AppNotification>[]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الإشعارات'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Container(
            color: AppTheme.surface,
            padding: const EdgeInsets.fromLTRB(
              AppTheme.screenPadding,
              4,
              AppTheme.screenPadding,
              12,
            ),
            child: FilterChips<NotificationFilter>(
              options: [
                for (final option in NotificationFilter.values)
                  (value: option, label: option.label),
              ],
              selected: _filter,
              onSelected: (value) => setState(() => _filter = value),
            ),
          ),
        ),
      ),
      body: FutureBuilder<List<AppNotification>>(
        future: _notifications,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Padding(
              padding: const EdgeInsets.all(AppTheme.screenPadding),
              child: Skeleton.cards(count: 5, height: 76),
            );
          }

          final items = (snapshot.data ?? const <AppNotification>[])
              .where((item) => _matches(item, _filter))
              .toList(growable: false);

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                AppTheme.screenPadding,
                14,
                AppTheme.screenPadding,
                24,
              ),
              children: [
                if (snapshot.hasError)
                  EmptyState(
                    icon: Icons.cloud_off,
                    message: 'تعذّر تحميل الإشعارات',
                    actionLabel: 'إعادة المحاولة',
                    onAction: _refresh,
                  )
                else if (items.isEmpty)
                  const EmptyState(
                    icon: Icons.notifications_none,
                    message: 'لا توجد إشعارات',
                  )
                else
                  for (final item in items)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppTheme.cardGap),
                      child: _NotificationCard(
                        notification: item,
                        onRead: () async {
                          if (item.isRead) return;
                          await context
                              .read<HomeRepository>()
                              .markNotificationRead(item.id)
                              .catchError((_) {});
                          if (mounted) setState(_load);
                        },
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

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.notification, required this.onRead});

  final AppNotification notification;
  final Future<void> Function() onRead;

  (IconData, Color) get _visual => switch (_toneOf(notification)) {
        _Tone.success => (Icons.check_circle_outline, AppTheme.success),
        _Tone.warning => (Icons.error_outline, AppTheme.warning),
        _Tone.danger => (Icons.warning_amber_rounded, AppTheme.danger),
        _Tone.info => (Icons.notifications_none, AppTheme.primary),
      };

  @override
  Widget build(BuildContext context) {
    final (icon, color) = _visual;
    return Material(
      color: notification.isRead ? AppTheme.surface : AppTheme.primarySoft,
      borderRadius: BorderRadius.circular(AppTheme.cardRadius),
      child: InkWell(
        onTap: onRead,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        child: Container(
          padding: const EdgeInsets.all(13),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppTheme.cardRadius),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 38,
                width: 38,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(icon, size: 20, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notification.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: notification.isRead
                            ? FontWeight.w600
                            : FontWeight.w800,
                        color: AppTheme.text,
                      ),
                    ),
                    if (notification.body.trim().isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 3),
                        child: Text(
                          notification.body,
                          style: const TextStyle(
                            fontSize: 12.5,
                            height: 1.6,
                            color: AppTheme.secondary,
                          ),
                        ),
                      ),
                    if (notification.createdAt != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 5),
                        child: Text(
                          _relativeTime(notification.createdAt!),
                          style: const TextStyle(
                            fontSize: 11.5,
                            color: AppTheme.secondary,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              if (!notification.isRead)
                Container(
                  margin: const EdgeInsets.only(top: 5),
                  height: 8,
                  width: 8,
                  decoration: const BoxDecoration(
                    color: AppTheme.primary,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

String _relativeTime(DateTime value) {
  final difference = DateTime.now().difference(value.toLocal());
  if (difference.inMinutes < 1) return 'الآن';
  if (difference.inMinutes < 60) return 'منذ ${difference.inMinutes} دقيقة';
  if (difference.inHours < 24) return 'منذ ${difference.inHours} ساعة';
  if (difference.inDays < 30) return 'منذ ${difference.inDays} يوم';
  final local = value.toLocal();
  return '${local.year}/${local.month.toString().padLeft(2, '0')}/${local.day.toString().padLeft(2, '0')}';
}
