import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/design/widgets.dart';
import '../../../core/widgets/office_logo.dart';
import 'auth_controller.dart';

/// شاشة قفل الجلسة القائمة: المكلف داخل حسابه، وتبقى بياناته مستورة حتى
/// يُثبت أنه هو. تُعرض بدل شاشة الدخول حين يكون الدخول بالبصمة مفعّلاً.
class LockPage extends StatefulWidget {
  const LockPage({super.key});

  static const String routeName = '/lock';

  @override
  State<LockPage> createState() => _LockPageState();
}

class _LockPageState extends State<LockPage> {
  String _label = 'البصمة';

  @override
  void initState() {
    super.initState();
    // طلب البصمة فور فتح التطبيق: نقرة إضافية قبل نافذة النظام لا تضيف
    // أماناً، وتضيف خطوة في كل مرة.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadLabel();
      _unlock();
    });
  }

  Future<void> _loadLabel() async {
    final label = await context.read<AuthController>().biometricLabel();
    if (mounted) setState(() => _label = label);
  }

  Future<void> _unlock() async {
    await context.read<AuthController>().unlockWithBiometrics();
  }

  Future<void> _usePassword() async {
    // الرجوع لكلمة المرور يُنهي الجلسة المقفلة: إبقاؤها محفوظة بينما يدخل
    // شخص آخر بكلمة مروره يخلط حسابين على جهاز واحد.
    await context.read<AuthController>().cancelLock();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

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
                        const OfficeLogo(size: 92, padding: 10),
                        const SizedBox(height: 26),
                        const Text(
                          'التطبيق مقفل',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'استخدم $_label للدخول إلى حسابك.',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Color(0xFFD3E7DF),
                            fontSize: 14.5,
                            height: 1.7,
                          ),
                        ),
                        const SizedBox(height: 30),
                        if (auth.busy)
                          const SizedBox(
                            height: 74,
                            width: 74,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.6,
                            ),
                          )
                        else
                          _FingerprintButton(onTap: _unlock),
                        const Spacer(),
                        if (auth.errorMessage != null)
                          ErrorBanner(message: auth.errorMessage!),
                        FilledButton(
                          onPressed: auth.busy ? null : _unlock,
                          child: Text('الدخول بـ$_label'),
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white70),
                          ),
                          onPressed: auth.busy ? null : _usePassword,
                          child: const Text('الدخول بكلمة المرور'),
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

class _FingerprintButton extends StatelessWidget {
  const _FingerprintButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'الدخول بالبصمة',
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Container(
          height: 74,
          width: 74,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.14),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white54),
          ),
          child: const Icon(Icons.fingerprint, size: 40, color: Colors.white),
        ),
      ),
    );
  }
}
