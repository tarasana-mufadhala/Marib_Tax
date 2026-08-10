import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/widgets/app_scaffold.dart';
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
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthController>();
    final ok = await auth.verifyOtp(_codeController.text);
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

    return AuthScaffold(
      title: 'رمز التحقق',
      subtitle: phone == null
          ? 'أدخل رمز التحقق المكوّن من 6 أرقام.'
          : 'أرسلنا رمزاً مكوّناً من 6 أرقام إلى الرقم ${phone.e164}.',
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (auth.errorMessage != null) ErrorBanner(message: auth.errorMessage!),
            TextFormField(
              controller: _codeController,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              textDirection: TextDirection.ltr,
              maxLength: 6,
              style: const TextStyle(fontSize: 26, letterSpacing: 10),
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: const InputDecoration(
                labelText: 'رمز التحقق',
                counterText: '',
              ),
              validator: (value) {
                final code = (value ?? '').trim();
                if (code.isEmpty) return 'رمز التحقق مطلوب';
                if (code.length != 6) return 'الرمز يتكون من 6 أرقام';
                return null;
              },
              onChanged: (_) => auth.clearError(),
            ),
            const SizedBox(height: 20),
            BusyButton(label: 'تحقّق', busy: auth.busy, onPressed: _submit),
            const SizedBox(height: 8),
            TextButton(
              onPressed: auth.busy ? null : _resend,
              child: const Text('لم يصلك الرمز؟ إعادة الإرسال'),
            ),
          ],
        ),
      ),
    );
  }
}
