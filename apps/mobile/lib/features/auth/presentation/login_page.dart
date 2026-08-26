import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/design/widgets.dart';
import '../../../core/widgets/office_logo.dart';
import '../domain/yemeni_phone.dart';
import 'auth_controller.dart';
import 'email_otp_page.dart';
import 'forgot_password_page.dart';
import 'register_phone_page.dart';
import 'request_credentials_page.dart';

/// FR-002: الدخول برقم الهاتف وكلمة المرور. لا يُرسل OTP في كل دخول —
/// الرمز محجوز لإنشاء الحساب واستعادة كلمة المرور فقط.
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  static const String routeName = '/login';

  @override
  State<LoginPage> createState() => _LoginPageState();
}

/// طريقتا الدخول المتاحتان.
enum _LoginMethod { phone, email }

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailController = TextEditingController();
  bool _obscure = true;
  bool _remember = false;
  _LoginMethod _method = _LoginMethod.phone;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthController>();

    if (_method == _LoginMethod.email) {
      // الدخول بالبريد برمز لا بكلمة مرور: من لا تصله الرسائل النصية
      // يحتاج قناة ثانية، لا كلمة مرور ثانية.
      final sent = await auth.requestEmailOtp(_emailController.text);
      if (sent && mounted) {
        await Navigator.of(context).pushNamed(EmailOtpPage.routeName);
      }
      return;
    }

    final ok = await auth.login(_phoneController.text, _passwordController.text);
    if (ok && mounted) {
      Navigator.of(context).popUntil((route) => route.isFirst);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              const _Header(),
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppTheme.screenPadding,
                  22,
                  AppTheme.screenPadding,
                  24,
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (auth.errorMessage != null)
                        ErrorBanner(message: auth.errorMessage!),
                      _MethodSwitch(
                        selected: _method,
                        onChanged: (method) => setState(() {
                          _method = method;
                          auth.clearError();
                        }),
                      ),
                      const SizedBox(height: 18),
                      if (_method == _LoginMethod.phone) ...[
                        _PhoneField(controller: _phoneController),
                        const SizedBox(height: 14),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscure,
                          decoration: InputDecoration(
                            labelText: 'كلمة المرور',
                            suffixIcon: IconButton(
                              tooltip: _obscure ? 'إظهار' : 'إخفاء',
                              icon: Icon(
                                _obscure
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                                size: 20,
                                color: AppTheme.secondary,
                              ),
                              onPressed: () =>
                                  setState(() => _obscure = !_obscure),
                            ),
                          ),
                          validator: (value) => (value ?? '').isEmpty
                              ? 'كلمة المرور مطلوبة'
                              : null,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            SizedBox(
                              height: 34,
                              width: 34,
                              child: Checkbox(
                                value: _remember,
                                onChanged: (value) =>
                                    setState(() => _remember = value ?? false),
                              ),
                            ),
                            const Text(
                              'تذكرني',
                              style: TextStyle(
                                fontSize: 13.5,
                                color: AppTheme.text,
                              ),
                            ),
                          ],
                        ),
                      ] else ...[
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          textDirection: TextDirection.ltr,
                          decoration: const InputDecoration(
                            labelText: 'البريد الإلكتروني',
                            hintText: 'name@example.com',
                            hintTextDirection: TextDirection.ltr,
                            helperText: 'سيصلك رمز دخول مكوّن من 6 أرقام.',
                          ),
                          validator: (value) {
                            final email = (value ?? '').trim();
                            if (email.isEmpty) {
                              return 'البريد الإلكتروني مطلوب';
                            }
                            if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
                                .hasMatch(email)) {
                              return 'أدخل بريداً إلكترونياً صحيحاً';
                            }
                            return null;
                          },
                        ),
                      ],
                      const SizedBox(height: 16),
                      BusyButton(
                        label: _method == _LoginMethod.phone
                            ? 'دخول'
                            : 'إرسال رمز الدخول',
                        busy: auth.busy,
                        onPressed: _submit,
                      ),
                      const SizedBox(height: 6),
                      if (_method == _LoginMethod.phone) ...[
                        TextButton(
                          onPressed: () => Navigator.of(context)
                              .pushNamed(ForgotPasswordPage.routeName),
                          child: const Text('نسيت كلمة المرور؟'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.of(context)
                              .pushNamed(RequestCredentialsPage.routeName),
                          child: const Text('لم تصلني بيانات الدخول'),
                        ),
                      ],
                      const SizedBox(height: 14),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'ليس لديك حساب؟',
                            style: TextStyle(
                              fontSize: 13.5,
                              color: AppTheme.secondary,
                            ),
                          ),
                          TextButton(
                            onPressed: () => Navigator.of(context)
                                .pushNamed(RegisterPhonePage.routeName),
                            child: const Text('إنشاء حساب'),
                          ),
                        ],
                      ),
                    ],
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

/// مبدّل طريقة الدخول: هاتف وكلمة مرور، أو رمز يصل البريد.
class _MethodSwitch extends StatelessWidget {
  const _MethodSwitch({required this.selected, required this.onChanged});

  final _LoginMethod selected;
  final ValueChanged<_LoginMethod> onChanged;

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
            active: selected == _LoginMethod.phone,
            onTap: () => onChanged(_LoginMethod.phone),
          ),
          _Option(
            label: 'البريد الإلكتروني',
            active: selected == _LoginMethod.email,
            onTap: () => onChanged(_LoginMethod.email),
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

/// حقل الهاتف بمقدّمة `+967` ثابتة لا تُحذف.
class _PhoneField extends StatelessWidget {
  const _PhoneField({required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: TextInputType.phone,
      textDirection: TextDirection.ltr,
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        LengthLimitingTextInputFormatter(9),
      ],
      decoration: InputDecoration(
        labelText: 'رقم الهاتف',
        hintText: '7XXXXXXXX',
        hintTextDirection: TextDirection.ltr,
        // المقدّمة جزء من زخرفة الحقل لا من نصّه، فلا يستطيع المستخدم
        // حذفها ولا يرسلها التطبيق مكرّرة.
        prefixIcon: const Padding(
          padding: EdgeInsets.symmetric(horizontal: 14),
          child: Text(
            '+967',
            textDirection: TextDirection.ltr,
            style: TextStyle(
              fontSize: 14.5,
              fontWeight: FontWeight.w700,
              color: AppTheme.text,
            ),
          ),
        ),
        prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
      ),
      validator: YemeniPhone.validate,
    );
  }
}

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 34, 24, 26),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFEFF6F4), AppTheme.background],
        ),
      ),
      child: Column(
        children: [
          const OfficeLogo(size: 72),
          const SizedBox(height: 14),
          const Text(
            'مرحباً بك',
            style: TextStyle(
              fontSize: 21,
              fontWeight: FontWeight.w800,
              color: AppTheme.primaryDark,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'سجل الدخول للوصول إلى حسابك وخدماتك الضريبية.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13.5,
              height: 1.6,
              color: AppTheme.secondary,
            ),
          ),
        ],
      ),
    );
  }
}
