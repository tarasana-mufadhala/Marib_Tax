import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../auth/domain/password_rules.dart';
import '../../services/presentation/services_page.dart';
import '../data/account_repository.dart';

/// شاشة «حسابي»: بيانات صاحب الحساب ونشاطه التجاري، وتغيير كلمة المرور.
class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  static const String routeName = '/account';

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  late Future<AccountProfile> _profile;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _profile = context.read<AccountRepository>().me();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('حسابي')),
      body: FutureBuilder<AccountProfile>(
        future: _profile,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _ErrorState(
              message: snapshot.error is ApiException
                  ? (snapshot.error as ApiException).message
                  : 'تعذّر تحميل بيانات حسابك',
              onRetry: () => setState(_load),
            );
          }

          final profile = snapshot.data!;
          return RefreshIndicator(
            onRefresh: () async => setState(_load),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _Section(
                  title: 'البيانات الشخصية',
                  children: [
                    _Row(label: 'الاسم', value: profile.displayName),
                    _Row(label: 'رقم الهاتف', value: profile.phone, ltr: true),
                    if (profile.email != null)
                      _Row(label: 'البريد الإلكتروني', value: profile.email, ltr: true),
                  ],
                ),
                const SizedBox(height: 14),
                if (profile.taxpayer != null)
                  _Section(
                    title: 'الملف الضريبي',
                    children: [
                      _Row(
                        label: 'الرقم الضريبي',
                        value: profile.taxpayer!.taxNumber,
                        ltr: true,
                      ),
                      _Row(
                        label: 'الاسم لدى المكتب',
                        value: profile.taxpayer!.displayName,
                      ),
                      _Row(
                        label: 'الكيان القانوني',
                        value: profile.taxpayer!.legalEntityName,
                      ),
                      _Row(
                        label: 'حالة الملف',
                        value: profile.taxpayer!.statusLabel,
                      ),
                    ],
                  )
                else
                  const _Notice(
                    'لم تُكمل بيانات ملفك الضريبي بعد. أكمِلها من شاشة التسجيل '
                    'أو راجع المكتب.',
                  ),
                const SizedBox(height: 14),
                _Section(
                  title: 'النشاط التجاري',
                  children: [
                    if (profile.activities.isEmpty)
                      const _Notice(
                        'لا توجد أنشطة تجارية مسجَّلة باسمك لدى المكتب.',
                      )
                    else
                      for (final activity in profile.activities)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _Row(label: 'اسم النشاط', value: activity.name),
                              _Row(
                                label: 'نوع النشاط',
                                value: activity.activityType,
                              ),
                              _Row(label: 'الحالة', value: activity.statusLabel),
                              if (activity.address != null)
                                _Row(label: 'العنوان', value: activity.address),
                            ],
                          ),
                        ),
                    const SizedBox(height: 6),
                    // تغيير نوع النشاط تعديلٌ على سجل رسمي يعتمد عليه الربط
                    // الضريبي، فلا يُكتب من الهاتف مباشرة: يمر بطلب FR-104
                    // بمستنداته ليعتمده المكتب.
                    OutlinedButton.icon(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const ServicesPage(),
                        ),
                      ),
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      label: const Text('طلب تغيير نوع النشاط التجاري'),
                    ),
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Text(
                        'يُقدَّم التغيير عبر خدمة «تحديث بيانات الرقم الضريبي أو '
                        'الأسماء التجارية» ولا يسري إلا بعد اعتماد المكتب.',
                        style: TextStyle(
                          fontSize: 11.5,
                          height: 1.7,
                          color: Color(0xFF7A8A83),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _Section(
                  title: 'الأمان',
                  children: [
                    OutlinedButton.icon(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const ChangePasswordPage(),
                        ),
                      ),
                      icon: const Icon(Icons.lock_outline, size: 18),
                      label: const Text('تغيير كلمة المرور'),
                    ),
                  ],
                ),
                const SizedBox(height: 28),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// تغيير كلمة المرور من داخل الجلسة.
class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();

  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      await context.read<AccountRepository>().changePassword(
            currentPassword: _current.text,
            newPassword: _next.text,
          );
      if (!mounted) return;
      setState(() => _busy = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم تغيير كلمة المرور')),
      );
      Navigator.of(context).pop();
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
          _error = 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً';
          _busy = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'تغيير كلمة المرور',
      subtitle: 'أدخل كلمة المرور الحالية ثم الجديدة.',
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_error != null) ErrorBanner(message: _error!),
            TextFormField(
              controller: _current,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'كلمة المرور الحالية'),
              validator: (value) => (value ?? '').isEmpty
                  ? 'كلمة المرور الحالية مطلوبة'
                  : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _next,
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
              controller: _confirm,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'تأكيد كلمة المرور الجديدة',
              ),
              validator: (value) =>
                  PasswordRules.validateConfirmation(_next.text, value),
            ),
            const SizedBox(height: 20),
            BusyButton(
              label: 'حفظ كلمة المرور',
              busy: _busy,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 10),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value, this.ltr = false});

  final String label;
  final String? value;
  final bool ltr;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 118,
            child: Text(
              label,
              style: const TextStyle(fontSize: 12.5, color: Color(0xFF7A8A83)),
            ),
          ),
          Expanded(
            child: Text(
              (value ?? '').trim().isEmpty ? '—' : value!,
              textDirection: ltr ? TextDirection.ltr : null,
              textAlign: ltr ? TextAlign.left : TextAlign.start,
              style: const TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1B2B24),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF6E5),
        borderRadius: BorderRadius.circular(11),
        border: Border.all(color: const Color(0xFFF0DFBC)),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 12.5,
          height: 1.8,
          color: Color(0xFF8A5B00),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const SizedBox(height: 60),
        const Icon(Icons.cloud_off, size: 44, color: Color(0xFF9AAAA3)),
        const SizedBox(height: 14),
        Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 14, height: 1.8, color: Color(0xFF5A6B63)),
        ),
        const SizedBox(height: 12),
        Center(child: TextButton(onPressed: onRetry, child: const Text('إعادة المحاولة'))),
      ],
    );
  }
}
