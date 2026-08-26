import 'package:flutter/material.dart';

import '../features/content/presentation/info_center_page.dart';
import '../features/home/presentation/home_page.dart';
import '../features/notifications/presentation/notifications_page.dart';
import '../features/profile/presentation/profile_page.dart';
import '../features/requests/presentation/my_requests_page.dart';
import 'theme.dart';

/// هيكل التطبيق: خمس شاشات رئيسية بشريط تنقل سفلي ثابت.
///
/// الشاشات تُبقى حيّة بـ [IndexedStack] لا تُبنى من جديد عند كل تنقّل:
/// العودة إلى «طلباتي» يجب أن تُرجع القائمة كما تركها المستخدم لا أن
/// تعيد تحميلها من الشبكة.
class AppShell extends StatefulWidget {
  const AppShell({super.key, this.initialTab = 0});

  static const String routeName = '/';

  final int initialTab;

  @override
  State<AppShell> createState() => AppShellState();

  /// للتنقّل بين التبويبات من داخل الشاشات (مثل «عرض الكل»).
  static AppShellState? of(BuildContext context) =>
      context.findAncestorStateOfType<AppShellState>();
}

class AppShellState extends State<AppShell> {
  late int _index = widget.initialTab;

  void goToTab(int index) {
    if (index != _index) setState(() => _index = index);
  }

  static const _tabs = [
    (icon: Icons.home_outlined, active: Icons.home, label: 'الرئيسية'),
    (
      icon: Icons.description_outlined,
      active: Icons.description,
      label: 'طلباتي'
    ),
    (
      icon: Icons.notifications_none,
      active: Icons.notifications,
      label: 'الإشعارات'
    ),
    (icon: Icons.info_outline, active: Icons.info, label: 'المعلومات'),
    (icon: Icons.person_outline, active: Icons.person, label: 'الملف الشخصي'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: const [
          HomePage(),
          MyRequestsPage(),
          NotificationsPage(),
          InfoCenterPage(),
          ProfilePage(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppTheme.surface,
          border: Border(top: BorderSide(color: AppTheme.border)),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 62,
            child: Row(
              children: [
                for (var i = 0; i < _tabs.length; i++)
                  Expanded(
                    child: _TabButton(
                      icon: _index == i ? _tabs[i].active : _tabs[i].icon,
                      label: _tabs[i].label,
                      active: _index == i,
                      onTap: () => goToTab(i),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? AppTheme.primary : AppTheme.secondary;
    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 22, color: color),
          const SizedBox(height: 3),
          Text(
            label,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: active ? FontWeight.w700 : FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
