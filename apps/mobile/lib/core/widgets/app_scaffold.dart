import 'package:flutter/material.dart';

import '../../app/theme.dart';

// ErrorBanner و BusyButton انتقلا إلى نظام التصميم الموحّد. يُعاد تصديرهما
// هنا حتى تبقى الشاشات القائمة تعمل بلا تعديل استيراداتها، وتأخذ الشكل
// الجديد تلقائياً — فلا نسختان من الزر نفسه تتباعدان مع الوقت.
export '../design/widgets.dart' show BusyButton, ErrorBanner;

/// هيكل موحّد لشاشات النماذج والمصادقة.
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    super.key,
    required this.title,
    required this.child,
    this.subtitle,
    this.showBack = true,
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final bool showBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        automaticallyImplyLeading: showBack,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppTheme.screenPadding,
            18,
            AppTheme.screenPadding,
            24,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (subtitle != null) ...[
                Text(
                  subtitle!,
                  style: const TextStyle(
                    fontSize: 13.5,
                    color: AppTheme.secondary,
                    height: 1.7,
                  ),
                ),
                const SizedBox(height: 20),
              ],
              child,
            ],
          ),
        ),
      ),
    );
  }
}
