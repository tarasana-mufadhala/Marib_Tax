import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/design/otp_field.dart';
import '../../../core/design/widgets.dart';
import 'auth_controller.dart';

/// التحقق من رمز الدخول المرسل إلى البريد.
class EmailOtpPage extends StatefulWidget {
  const EmailOtpPage({super.key});

  static const String routeName = '/login/email-otp';

  @override
  State<EmailOtpPage> createState() => _EmailOtpPageState();
}

class _EmailOtpPageState extends State<EmailOtpPage> {
  String _code = '';

  Future<void> _submit() async {
    final auth = context.read<AuthController>();
    if (_code.length != 6) {
      auth.showError('الرمز يتكون من 6 أرقام');
      return;
    }
    final ok = await auth.verifyEmailOtp(_code);
    if (ok && mounted) {
      Navigator.of(context).popUntil((route) => route.isFirst);
    }
  }

  Future<void> _resend() async {
    final auth = context.read<AuthController>();
    final email = auth.pendingEmail;
    if (email == null) return;
    final ok = await auth.requestEmailOtp(email);
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('أُرسل رمز جديد إلى بريدك')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return Scaffold(
      appBar: AppBar(),
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
              const Text(
                'تحقق من بريدك الإلكتروني',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.text,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'أدخل رمز الدخول الذي تم إرساله إلى',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13.5, color: AppTheme.secondary),
              ),
              const SizedBox(height: 4),
              Text(
                auth.pendingEmail ?? '—',
                textAlign: TextAlign.center,
                textDirection: TextDirection.ltr,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(height: 28),
              if (auth.errorMessage != null)
                ErrorBanner(message: auth.errorMessage!),
              OtpField(
                onChanged: (value) {
                  _code = value;
                  auth.clearError();
                },
                onCompleted: (_) => _submit(),
              ),
              const SizedBox(height: 22),
              ResendCountdown(seconds: 45, onResend: _resend),
              const SizedBox(height: 24),
              BusyButton(label: 'دخول', busy: auth.busy, onPressed: _submit),
              const SizedBox(height: 22),
              Container(
                padding: const EdgeInsets.all(13),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                  border: Border.all(color: AppTheme.border),
                ),
                child: const Text(
                  'إن لم تجد الرسالة في صندوق الوارد، راجع مجلد الرسائل '
                  'غير المرغوب فيها.',
                  style: TextStyle(
                    fontSize: 12.5,
                    height: 1.7,
                    color: AppTheme.secondary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
