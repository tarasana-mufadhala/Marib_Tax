import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/design/otp_field.dart';
import '../../../core/design/widgets.dart';
import '../../auth/domain/yemeni_phone.dart';
import '../data/account_repository.dart';

/// تغيير رقم الهاتف على خطوتين.
///
/// الرقم هو هوية الدخول، فالخادم يشترط كلمة المرور الحالية ثم رمزاً يصل
/// الرقم الجديد. الشاشة تعكس هذا الترتيب ولا تختصره.
class ChangePhonePage extends StatefulWidget {
  const ChangePhonePage({super.key});

  @override
  State<ChangePhonePage> createState() => _ChangePhonePageState();
}

class _ChangePhonePageState extends State<ChangePhonePage> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _codeSent = false;
  bool _busy = false;
  String _code = '';
  String? _error;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  YemeniPhone? get _phone => YemeniPhone.tryParse(_phoneController.text);

  Future<void> _requestCode() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<AccountRepository>().requestPhoneChange(
            newPhoneNumber: _phone!.e164,
            currentPassword: _passwordController.text,
          );
      if (mounted) {
        setState(() {
          _codeSent = true;
          _busy = false;
        });
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => (_error = error.message, _busy = false));
    } catch (_) {
      if (mounted) {
        setState(() => (_error = 'تعذّر إرسال الرمز، حاول لاحقاً', _busy = false));
      }
    }
  }

  Future<void> _confirm() async {
    if (_code.length != 6) {
      setState(() => _error = 'الرمز يتكون من 6 أرقام');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<AccountRepository>().confirmPhoneChange(
            newPhoneNumber: _phone!.e164,
            code: _code,
          );
      if (!mounted) return;
      setState(() => _busy = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم تغيير رقم هاتفك')),
      );
      Navigator.of(context).pop();
    } on ApiException catch (error) {
      if (mounted) setState(() => (_error = error.message, _busy = false));
    } catch (_) {
      if (mounted) {
        setState(() => (_error = 'تعذّر تغيير الرقم، حاول لاحقاً', _busy = false));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('تغيير رقم الهاتف')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppTheme.screenPadding,
            18,
            AppTheme.screenPadding,
            24,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  _codeSent
                      ? 'أدخل الرمز الذي وصل الرقم الجديد.'
                      : 'أدخل رقمك الجديد وكلمة مرورك الحالية. سيصلك رمز '
                          'تحقق على الرقم الجديد.',
                  style: const TextStyle(
                    fontSize: 13.5,
                    height: 1.7,
                    color: AppTheme.secondary,
                  ),
                ),
                const SizedBox(height: 20),
                if (_error != null) ErrorBanner(message: _error!),
                TextFormField(
                  controller: _phoneController,
                  enabled: !_codeSent,
                  keyboardType: TextInputType.phone,
                  textDirection: TextDirection.ltr,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(9),
                  ],
                  decoration: const InputDecoration(
                    labelText: 'رقم الهاتف الجديد',
                    hintText: '7XXXXXXXX',
                    hintTextDirection: TextDirection.ltr,
                    prefixIcon: Padding(
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
                    prefixIconConstraints:
                        BoxConstraints(minWidth: 0, minHeight: 0),
                  ),
                  validator: YemeniPhone.validate,
                ),
                if (!_codeSent) ...[
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'كلمة المرور الحالية',
                    ),
                    validator: (value) =>
                        (value ?? '').isEmpty ? 'كلمة المرور مطلوبة' : null,
                  ),
                  const SizedBox(height: 22),
                  BusyButton(
                    label: 'إرسال رمز التحقق',
                    busy: _busy,
                    onPressed: _requestCode,
                  ),
                ] else ...[
                  const SizedBox(height: 26),
                  OtpField(
                    onChanged: (value) {
                      _code = value;
                      if (_error != null) setState(() => _error = null);
                    },
                    onCompleted: (_) => _confirm(),
                  ),
                  const SizedBox(height: 26),
                  BusyButton(
                    label: 'تأكيد الرقم الجديد',
                    busy: _busy,
                    onPressed: _confirm,
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: _busy
                        ? null
                        : () => setState(() {
                              _codeSent = false;
                              _code = '';
                              _error = null;
                            }),
                    child: const Text('تعديل الرقم'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
