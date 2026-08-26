import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/design/widgets.dart';
import '../data/account_repository.dart';

/// إضافة بريد إلكتروني إلى حساب مسجَّل بالهاتف.
///
/// البريد إضافة لا استبدال: بعد تأكيده يبقى الدخول برقم الهاتف وكلمة المرور
/// كما هو، ويكسب المكلف قناة ثانية للدخول برمز وللإشعارات.
class AddEmailPage extends StatefulWidget {
  const AddEmailPage({super.key, this.currentEmail});

  final String? currentEmail;

  @override
  State<AddEmailPage> createState() => _AddEmailPageState();
}

class _AddEmailPageState extends State<AddEmailPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _busy = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<AccountRepository>().addEmail(
            email: _emailController.text.trim(),
            currentPassword: _passwordController.text,
          );
      if (mounted) {
        setState(() {
          _sent = true;
          _busy = false;
        });
      }
    } on ApiException catch (error) {
      if (mounted) {
        setState(() {
          _error = error.message;
          _busy = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'تعذّر إضافة البريد، حاول لاحقاً';
          _busy = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('البريد الإلكتروني')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppTheme.screenPadding,
            18,
            AppTheme.screenPadding,
            24,
          ),
          child: _sent ? _sentView() : _formView(),
        ),
      ),
    );
  }

  Widget _sentView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 30),
        Container(
          height: 68,
          width: 68,
          alignment: Alignment.center,
          decoration: const BoxDecoration(
            color: AppTheme.primarySoft,
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.mark_email_unread_outlined,
            size: 32,
            color: AppTheme.primary,
          ),
        ),
        const SizedBox(height: 18),
        const Text(
          'أُرسلت رسالة تأكيد',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: AppTheme.text,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'افتح الرسالة التي وصلت ${_emailController.text.trim()} وأكّد البريد.\n'
          'لا يُفعَّل البريد قبل تأكيدك إياه.',
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 13.5,
            height: 1.8,
            color: AppTheme.secondary,
          ),
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(true),
          child: const Text('حسناً'),
        ),
      ],
    );
  }

  Widget _formView() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (widget.currentEmail != null)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: AppTheme.primarySoft,
                borderRadius: BorderRadius.circular(AppTheme.cardRadius),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.mail_outline,
                    size: 19,
                    color: AppTheme.primary,
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Text(
                      'البريد الحالي: ${widget.currentEmail}',
                      textDirection: TextDirection.ltr,
                      textAlign: TextAlign.right,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: AppTheme.primaryDark,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          const Text(
            'أضف بريدك الإلكتروني لتصلك الإشعارات عليه، ولتتمكن من الدخول '
            'برمز يصل بريدك عند تعذّر الرسائل النصية. رقم هاتفك يبقى كما هو.',
            style: TextStyle(
              fontSize: 13.5,
              height: 1.8,
              color: AppTheme.secondary,
            ),
          ),
          const SizedBox(height: 20),
          if (_error != null) ErrorBanner(message: _error!),
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
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _passwordController,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: 'كلمة المرور الحالية',
              helperText: 'للتأكد أنك صاحب الحساب.',
            ),
            validator: (value) =>
                (value ?? '').isEmpty ? 'كلمة المرور مطلوبة' : null,
          ),
          const SizedBox(height: 22),
          BusyButton(
            label: widget.currentEmail == null ? 'إضافة البريد' : 'تغيير البريد',
            busy: _busy,
            onPressed: _submit,
          ),
        ],
      ),
    );
  }
}
