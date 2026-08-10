import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import 'login_page.dart';
import 'register_phone_page.dart';

/// FR-001 خطوة 1: الشاشة الافتتاحية — تعريف بالمكتب وزرّا الدخول والتسجيل.
class WelcomePage extends StatelessWidget {
  const WelcomePage({super.key});

  static const String routeName = '/welcome';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppTheme.primaryDark, AppTheme.primary],
          ),
        ),
        child: SafeArea(
          // الشاشة تمتد رأسياً حتى تملأ الجهاز، وتتحوّل إلى تمرير حين يقصر
          // الارتفاع (الوضع الأفقي أو الأجهزة الصغيرة) بدل أن تتجاوز حدودها.
          child: LayoutBuilder(
            builder: (context, constraints) => SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: IntrinsicHeight(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        const Spacer(),
                        Container(
                          height: 96,
                          width: 96,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                          ),
                          alignment: Alignment.center,
                          child: const Text(
                            'مـ',
                            style: TextStyle(
                              fontSize: 44,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryDark,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'مكتب الضرائب\nبمحافظة مأرب',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 14),
                        const Text(
                          'قدّم طلباتك وبلاغاتك، وتابع حالتها ومستحقاتك،\nمن جهازك مباشرة.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Color(0xFFD3E7DF), fontSize: 15, height: 1.7),
                        ),
                        const Spacer(),
                        FilledButton(
                          style: FilledButton.styleFrom(
                            backgroundColor: AppTheme.gold,
                            foregroundColor: Colors.black87,
                          ),
                          onPressed: () => Navigator.of(context).pushNamed(LoginPage.routeName),
                          child: const Text('تسجيل الدخول'),
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white70),
                          ),
                          onPressed: () =>
                              Navigator.of(context).pushNamed(RegisterPhonePage.routeName),
                          child: const Text('إنشاء حساب جديد'),
                        ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
