import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../domain/password_rules.dart';
import '../domain/yemeni_phone.dart';
import 'auth_controller.dart';

/// قناة استعادة كلمة المرور.
///
/// الهاتف هو الأصل؛ والبريد بديلٌ لمن لا تصله الرسائل النصية — بدونه يبقى
/// من فقد كلمة مروره عالقاً ولو كان له بريد مضاف.
enum _Channel { phone, email }

/// FR-002: استعادة كلمة المرور برمز يصل الهاتف أو البريد.
class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  static const String routeName = '/forgot-password';

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

enum _Step { identify, reset }

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _identifyFormKey = GlobalKey<FormState>();
  final _resetFormKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  _Channel _channel = _Channel.phone;
  _Step _step = _Step.identify;

  @override
  void dispose() {
    _phoneController.dispose();
    _emailController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _requestCode() async {
    if (!_identifyFormKey.currentState!.validate()) return;
    final auth = context.read<AuthController>();
    final ok = _channel == _Channel.phone
        ? await auth.requestPasswordReset(_phoneController.text)
        : await auth.requestEmailPasswordReset(_emailController.text);
    if (ok && mounted) setState(() => _step = _Step.reset);
  }

  Future<void> _confirm() async {
    if (!_resetFormKey.currentState!.validate()) return;
    final auth = context.read<AuthController>();
    final ok = _channel == _Channel.phone
        ? await auth.confirmPasswordReset(
            _codeController.text,
            _passwordController.text,
          )
        : await auth.confirmEmailPasswordReset(
            _codeController.text,
            _passwordController.text,
          );
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم تغيير كلمة المرور، يمكنك الدخول الآن')),
      );
      Navigator.of(context).pop();
    }
  }

  String get _subtitle {
    if (_step == _Step.reset) {
      return 'أدخل الرمز الذي وصلك، ثم اختر كلمة مرور جديدة.';
    }
    return _channel == _Channel.phone
        ? 'أدخل رقم هاتفك المسجَّل وسنرسل إليك رمز تحقق.'
        : 'أدخل بريدك المسجَّل وسنرسل إليك رمز تحقق.';
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return AuthScaffold(
      title: 'استعادة كلمة المرور',
      subtitle: _subtitle,
      child: _step == _Step.identify
          ? _identifyForm(auth)
          : _resetForm(auth),
    );
  }

  Widget _identifyForm(AuthController auth) {
    return Form(
      key: _identifyFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (auth.errorMessage != null) ErrorBanner(message: auth.errorMessage!),
          _ChannelSwitch(
            selected: _channel,
            onChanged: (channel) => setState(() {
              _channel = channel;
              auth.clearError();
            }),
          ),
          const SizedBox(height: 18),
          if (_channel == _Channel.phone)
            TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              textDirection: TextDirection.ltr,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(9),
              ],
              decoration: const InputDecoration(
                labelText: 'رقم الهاتف',
                hintText: '7XXXXXXXX',
                hintTextDirection: TextDirection.ltr,
                prefixText: '+967 ',
              ),
              validator: YemeniPhone.validate,
              onChanged: (_) => auth.clearError(),
            )
          else
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              textDirection: TextDirection.ltr,
              decoration: const InputDecoration(
                labelText: 'البريد الإلكتروني',
                hintText: 'name@example.com',
                hintTextDirection: TextDirection.ltr,
              ),
              validator: (value) {
                final email = (value ?? '').trim();
                if (email.isEmpty) return 'البريد الإلكتروني مطلوب';
                if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
                  return 'أدخل بريداً إلكترونياً صحيحاً';
                }
                return null;
              },
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
    );
  }

  Widget _resetForm(AuthController auth) {
    return Form(
      key: _resetFormKey,
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
              helperMaxLines: 3,
            ),
            validator: PasswordRules.validate,
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _confirmController,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: 'تأكيد كلمة المرور الجديدة',
            ),
            validator: (value) => PasswordRules.validateConfirmation(
              _passwordController.text,
              value,
            ),
          ),
          const SizedBox(height: 24),
          BusyButton(
            label: 'تغيير كلمة المرور',
            busy: auth.busy,
            onPressed: _confirm,
          ),
          const SizedBox(height: 6),
          TextButton(
            onPressed: auth.busy
                ? null
                : () => setState(() {
                      _step = _Step.identify;
                      _codeController.clear();
                      auth.clearError();
                    }),
            child: const Text('تعديل البيانات أو تغيير القناة'),
          ),
        ],
      ),
    );
  }
}

/// مبدّل قناة الاستعادة، بنفس شكل مبدّل الدخول.
class _ChannelSwitch extends StatelessWidget {
  const _ChannelSwitch({required this.selected, required this.onChanged});

  final _Channel selected;
  final ValueChanged<_Channel> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFEEF2F1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _Option(
            label: 'رقم الهاتف',
            active: selected == _Channel.phone,
            onTap: () => onChanged(_Channel.phone),
          ),
          _Option(
            label: 'البريد الإلكتروني',
            active: selected == _Channel.email,
            onTap: () => onChanged(_Channel.email),
          ),
        ],
      ),
    );
  }
}

class _Option extends StatelessWidget {
  const _Option({
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: active ? AppTheme.surface : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: active ? FontWeight.w700 : FontWeight.w500,
              color: active ? AppTheme.primary : AppTheme.secondary,
            ),
          ),
        ),
      ),
    );
  }
}
