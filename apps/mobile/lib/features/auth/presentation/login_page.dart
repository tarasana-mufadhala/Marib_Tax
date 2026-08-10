import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/widgets/app_scaffold.dart';
import '../domain/yemeni_phone.dart';
import 'auth_controller.dart';
import 'forgot_password_page.dart';

/// FR-002: الدخول برقم الهاتف وكلمة المرور. لا يُرسل OTP في كل دخول —
/// الرمز محجوز لإنشاء الحساب واستعادة كلمة المرور فقط.
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  static const String routeName = '/login';

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthController>();
    final ok = await auth.login(_phoneController.text, _passwordController.text);
    if (ok && mounted) {
      Navigator.of(context).popUntil((route) => route.isFirst);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return AuthScaffold(
      title: 'تسجيل الدخول',
      subtitle: 'أدخل رقم هاتفك المسجَّل وكلمة المرور.',
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (auth.errorMessage != null) ErrorBanner(message: auth.errorMessage!),
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
            const SizedBox(height: 14),
            TextFormField(
              controller: _passwordController,
              obscureText: _obscure,
              decoration: InputDecoration(
                labelText: 'كلمة المرور',
                suffixIcon: IconButton(
                  icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
              validator: (value) =>
                  (value ?? '').isEmpty ? 'كلمة المرور مطلوبة' : null,
              onChanged: (_) => auth.clearError(),
            ),
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: TextButton(
                onPressed: () =>
                    Navigator.of(context).pushNamed(ForgotPasswordPage.routeName),
                child: const Text('نسيت كلمة المرور؟'),
              ),
            ),
            const SizedBox(height: 8),
            BusyButton(label: 'دخول', busy: auth.busy, onPressed: _submit),
          ],
        ),
      ),
    );
  }
}
