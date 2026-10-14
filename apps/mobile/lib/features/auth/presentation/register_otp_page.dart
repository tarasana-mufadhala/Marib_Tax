import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/design/otp_field.dart';
import '../../../core/design/widgets.dart';
import '../../content/presentation/contact_page.dart';
import 'auth_controller.dart';
import 'register_tax_number_page.dart';

/// FR-001 خطوة 4: إدخال رمز التحقق المرسل إلى الهاتف.
class RegisterOtpPage extends StatefulWidget {
  const RegisterOtpPage({super.key});

  static const String routeName = '/register/otp';

  @override
  State<RegisterOtpPage> createState() => _RegisterOtpPageState();
}

class _RegisterOtpPageState extends State<RegisterOtpPage> {
  String _code = '';

  Future<void> _submit() async {
    final auth = context.read<AuthController>();
    if (_code.length != 6) {
      auth.showError('الرمز يتكون من 6 أرقام');
      return;
    }
    final ok = await auth.verifyOtp(_code);
    if (ok && mounted) {
      await Navigator.of(context).pushNamed(RegisterTaxNumberPage.routeName);
    }
  }

  Future<void> _resend() async {
    final auth = context.read<AuthController>();
    final phone = auth.pendingPhone;
    if (phone == null) return;
    final ok = await auth.startRegistration(phone.local);
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('أُرسل رمز تحقق جديد')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final phone = auth.pendingPhone;

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
                'تحقق من رقم الهاتف',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.text,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'أدخل رمز التحقق الذي تم إرساله إلى',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13.5, color: AppTheme.secondary),
              ),
              const SizedBox(height: 4),
              Text(
                phone?.e164 ?? '+967 7XXXXXXXX',
                textAlign: TextAlign.center,
                textDirection: TextDirection.ltr,
                style: const TextStyle(
                  fontSize: 15.5,
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
              BusyButton(label: 'تحقّق', busy: auth.busy, onPressed: _submit),
              const SizedBox(height: 26),
              const _HelpCard(),
            ],
          ),
        ),
      ),
    );
  }
}

class _HelpCard extends StatelessWidget {
  const _HelpCard();

  @override
  Widget build(BuildContext context) {
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
          const Text(
            'لم يصلك الرمز؟',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppTheme.text,
            ),
          ),
          const SizedBox(height: 5),
          const Text(
            'تأكد من أن الرقم صحيح ومن تغطية الشبكة، ثم انتظر انتهاء العدّاد '
            'لإعادة الإرسال.',
            style: TextStyle(
              fontSize: 12.5,
              height: 1.7,
              color: AppTheme.secondary,
            ),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: TextButton.icon(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const ContactPage()),
              ),
              icon: const Icon(Icons.support_agent_outlined, size: 18),
              label: const Text('التواصل مع الدعم'),
            ),
          ),
        ],
      ),
    );
  }
}
