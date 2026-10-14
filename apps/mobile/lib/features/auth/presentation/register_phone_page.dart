import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/widgets/app_scaffold.dart';
import '../domain/yemeni_phone.dart';
import 'auth_controller.dart';
import 'register_otp_page.dart';

/// FR-001 خطوة 2: إدخال رقم الهاتف ثم إرسال رمز التحقق.
class RegisterPhonePage extends StatefulWidget {
  const RegisterPhonePage({super.key});

  static const String routeName = '/register/phone';

  @override
  State<RegisterPhonePage> createState() => _RegisterPhonePageState();
}

class _RegisterPhonePageState extends State<RegisterPhonePage> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthController>();
    final ok = await auth.startRegistration(_phoneController.text);
    if (ok && mounted) {
      await Navigator.of(context).pushNamed(RegisterOtpPage.routeName);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return AuthScaffold(
      title: 'إنشاء حساب جديد',
      subtitle: 'أدخل رقم هاتفك المحمول، وسنرسل إليك رمز تحقق للتأكد من ملكيته.',
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
            const SizedBox(height: 24),
            BusyButton(
              label: 'إرسال رمز التحقق',
              busy: auth.busy,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}
