import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/office_logo.dart';

/// شاشة البداية: تظهر أثناء استرجاع الجلسة المحفوظة.
///
/// بلا أزرار — لا قرار للمستخدم هنا، والانتقال يقع تلقائياً حين تُحسم
/// حالة الجلسة.
class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF2F8F6), AppTheme.background],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              const OfficeLogo(size: 108),
              const SizedBox(height: 22),
              const Text(
                'مكتب الضرائب',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primaryDark,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'محافظة مأرب',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(height: 26),
              Container(
                height: 3,
                width: 52,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(height: 22),
              const Text(
                'خدمات ضريبية إلكترونية',
                style: TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.text,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'أسهل .. أسرع .. أكثر شفافية',
                style: TextStyle(fontSize: 13, color: AppTheme.secondary),
              ),
              const Spacer(),
              const SizedBox(
                height: 26,
                width: 26,
                child: CircularProgressIndicator(
                  strokeWidth: 2.4,
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(height: 34),
            ],
          ),
        ),
      ),
    );
  }
}
