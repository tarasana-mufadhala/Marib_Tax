import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/widgets/app_scaffold.dart';
import '../domain/password_rules.dart';
import '../domain/yemeni_phone.dart';
import 'auth_controller.dart';

/// FR-002: استعادة كلمة المرور عبر رمز يُرسل للهاتف المسجَّل — لا بريد إلكتروني.
class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  static const String routeName = '/forgot-password';

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

enum _Step { phone, reset }

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _phoneFormKey = GlobalKey<FormState>();
  final _resetFormKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  _Step _step = _Step.phone;

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _requestCode() async {
    if (!_phoneFormKey.currentState!.validate()) return;
    final ok =
        await context.read<AuthController>().requestPasswordReset(_phoneController.text);
    if (ok && mounted) setState(() => _step = _Step.reset);
  }

  Future<void> _confirm() async {
    if (!_resetFormKey.currentState!.validate()) return;
    final ok = await context
        .read<AuthController>()
        .confirmPasswordReset(_codeController.text, _passwordController.text);
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم تغيير كلمة المرور، يمكنك الدخول الآن')),
      );
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return AuthScaffold(
      title: 'استعادة كلمة المرور',
      subtitle: _step == _Step.phone
          ? 'أدخل رقم هاتفك المسجَّل وسنرسل إليك رمز تحقق.'
          : 'أدخل الرمز الذي وصلك، ثم اختر كلمة مرور جديدة.',
      child: _step == _Step.phone
          ? Form(
              key: _phoneFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (auth.errorMessage != null)
                    ErrorBanner(message: auth.errorMessage!),
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    textDirection: TextDirection.ltr,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9+\s]')),
                      LengthLimitingTextInputFormatter(15),
                    ],
                    decoration: const InputDecoration(
                      labelText: 'رقم الهاتف',
                      hintText: '7XXXXXXXX',
                      hintTextDirection: TextDirection.ltr,
                      prefixText: '+967 ',
                    ),
                    validator: YemeniPhone.validate,
                    onChanged: (_) => auth.clearError(),
                  ),
                  const SizedBox(height: 24),
                  BusyButton(
                    label: 'إرسال رمز التحقق',
                    busy: auth.busy,
                    onPressed: _requestCode,
                  ),
                ],
              ),
            )
          : Form(
              key: _resetFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (auth.errorMessage != null)
                    ErrorBanner(message: auth.errorMessage!),
                  TextFormField(
                    controller: _codeController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    textDirection: TextDirection.ltr,
                    maxLength: 6,
                    style: const TextStyle(fontSize: 24, letterSpacing: 8),
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      labelText: 'رمز التحقق',
                      counterText: '',
                    ),
                    validator: (value) => (value ?? '').trim().length != 6
                        ? 'الرمز يتكون من 6 أرقام'
                        : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'كلمة المرور الجديدة',
                      helperText: PasswordRules.hint,
                      helperMaxLines: 2,
                    ),
                    validator: PasswordRules.validate,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _confirmController,
                    obscureText: true,
                    decoration: const InputDecoration(
                        labelText: 'تأكيد كلمة المرور الجديدة'),
                    validator: (value) => PasswordRules.validateConfirmation(
                        _passwordController.text, value),
                  ),
                  const SizedBox(height: 24),
                  BusyButton(
                    label: 'تعيين كلمة المرور',
                    busy: auth.busy,
                    onPressed: _confirm,
                  ),
                ],
              ),
            ),
    );
  }
}
