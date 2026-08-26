import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../domain/yemeni_phone.dart';
import 'auth_controller.dart';

/// للمكلف الذي أُنشئ حسابه من بيانات المكتب ولم تصله كلمة المرور بعد.
///
/// الرسالة تذهب إلى الهاتف المسجَّل لدى المكتب لا إلى ما يُدخله الطالب،
/// فإدخال رقم غيره لا يوصله شيئاً.
class RequestCredentialsPage extends StatefulWidget {
  const RequestCredentialsPage({super.key});

  static const String routeName = '/request-credentials';

  @override
  State<RequestCredentialsPage> createState() => _RequestCredentialsPageState();
}

class _RequestCredentialsPageState extends State<RequestCredentialsPage> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  bool _sent = false;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final ok = await context
        .read<AuthController>()
        .requestImportedCredentials(_phoneController.text);
    if (ok && mounted) setState(() => _sent = true);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    if (_sent) {
      return AuthScaffold(
        title: 'بيانات الدخول',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.mark_email_read_outlined,
                size: 56, color: AppTheme.primary),
            const SizedBox(height: 16),
            const Text(
              'أُرسلت بيانات الدخول إلى رقم هاتفك المسجَّل لدى المكتب.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 15, height: 1.7),
            ),
            const SizedBox(height: 8),
            const Text(
              'يرجى تغيير كلمة المرور بعد أول دخول.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppTheme.secondary),
            ),
            const SizedBox(height: 28),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('العودة لتسجيل الدخول'),
            ),
          ],
        ),
      );
    }

    return AuthScaffold(
      title: 'لم تصلني بيانات الدخول',
      subtitle:
          'إن كان المكتب قد سجّلك مسبقاً ولم تصلك بيانات الدخول، أدخل رقم هاتفك '
          'المسجَّل لدى المكتب وسنرسلها إليه.',
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
                labelText: 'رقم الهاتف المسجَّل لدى المكتب',
                hintText: '7XXXXXXXX',
                hintTextDirection: TextDirection.ltr,
                prefixText: '+967 ',
              ),
              validator: YemeniPhone.validate,
              onChanged: (_) => auth.clearError(),
            ),
            const SizedBox(height: 24),
            BusyButton(
              label: 'إرسال بيانات الدخول',
              busy: auth.busy,
              onPressed: _submit,
            ),
            const SizedBox(height: 12),
            const Text(
              'إن كنت قد أنشأت حسابك بنفسك ونسيت كلمة المرور، استخدم «نسيت كلمة المرور».',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: AppTheme.secondary, height: 1.6),
            ),
          ],
        ),
      ),
    );
  }
}
