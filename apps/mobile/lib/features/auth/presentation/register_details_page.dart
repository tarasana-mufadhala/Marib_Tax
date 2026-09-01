import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../domain/auth_models.dart';
import '../domain/password_rules.dart';
import 'auth_controller.dart';

/// FR-001 خطوتا 6 و7: فورم البيانات الكاملة — جميع الحقول إلزامية.
/// الفارق الوحيد بين من يملك رقماً ضريبياً ومن لا يملك هو حمل الرقم،
/// وقد حُسم في الشاشة السابقة.
class RegisterDetailsPage extends StatefulWidget {
  const RegisterDetailsPage({super.key});

  static const String routeName = '/register/details';

  @override
  State<RegisterDetailsPage> createState() => _RegisterDetailsPageState();
}

class _RegisterDetailsPageState extends State<RegisterDetailsPage> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _secondName = TextEditingController();
  final _thirdName = TextEditingController();
  final _lastName = TextEditingController();
  final _tradeName = TextEditingController();
  final _activityType = TextEditingController();
  final _address = TextEditingController();
  final _password = TextEditingController();
  final _passwordConfirm = TextEditingController();

  LegalEntityOption? _legalEntity;
  late Future<List<LegalEntityOption>> _legalEntitiesFuture;

  @override
  void initState() {
    super.initState();
    _legalEntitiesFuture = context.read<AuthController>().legalEntities();
  }

  @override
  void dispose() {
    for (final controller in [
      _firstName,
      _secondName,
      _thirdName,
      _lastName,
      _tradeName,
      _activityType,
      _address,
      _password,
      _passwordConfirm,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  String? _required(String? value, String field) =>
      (value ?? '').trim().isEmpty ? '$field مطلوب' : null;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_legalEntity == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('اختر الكيان القانوني')));
      return;
    }

    final auth = context.read<AuthController>();
    final details = RegistrationDetails(
      firstName: _firstName.text,
      secondName: _secondName.text,
      thirdName: _thirdName.text,
      lastName: _lastName.text,
      tradeName: _tradeName.text,
      legalEntityId: _legalEntity!.id,
      activityType: _activityType.text,
      address: _address.text,
      taxNumber: auth.existingTaxNumber,
    );

    final ok = await auth.completeRegistration(
      details: details,
      password: _password.text,
    );
    // عند النجاح تتبدّل حالة المصادقة، ويتكفّل جذر التطبيق بعرض الرئيسية.
    if (ok && mounted) {
      Navigator.of(context).popUntil((route) => route.isFirst);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return AuthScaffold(
      title: 'بيانات المكلف',
      subtitle: 'جميع الحقول التالية إلزامية لإكمال إنشاء الحساب.',
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (auth.errorMessage != null) ErrorBanner(message: auth.errorMessage!),
            if (auth.existingTaxNumber != null) ...[
              _TaxNumberChip(taxNumber: auth.existingTaxNumber!),
              const SizedBox(height: 16),
            ],
            _field(_firstName, 'الاسم الأول'),
            _field(_secondName, 'الاسم الثاني'),
            _field(_thirdName, 'الاسم الثالث'),
            _field(_lastName, 'الاسم الرابع (اللقب)'),
            _field(_tradeName, 'الاسم التجاري'),
            _legalEntityField(),
            _field(_activityType, 'نوع النشاط'),
            _field(_address, 'العنوان', maxLines: 2),
            const Divider(height: 32),
            TextFormField(
              controller: _password,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'كلمة المرور',
                helperText: PasswordRules.hint,
                helperMaxLines: 2,
              ),
              validator: PasswordRules.validate,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _passwordConfirm,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'تأكيد كلمة المرور'),
              validator: (value) =>
                  PasswordRules.validateConfirmation(_password.text, value),
            ),
            const SizedBox(height: 24),
            BusyButton(
              label: 'إنشاء الحساب',
              busy: auth.busy,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    int maxLines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        textInputAction:
            maxLines > 1 ? TextInputAction.newline : TextInputAction.next,
        inputFormatters: [LengthLimitingTextInputFormatter(120)],
        decoration: InputDecoration(labelText: label),
        validator: (value) => _required(value, label),
      ),
    );
  }

  /// FR-001 بند 8: القائمة تُعبَّأ من الكيانات التي ينشئها الأدمن، لا من قائمة ثابتة.
  Widget _legalEntityField() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: FutureBuilder<List<LegalEntityOption>>(
        future: _legalEntitiesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const InputDecorator(
              decoration: InputDecoration(labelText: 'الكيان القانوني'),
              child: SizedBox(
                height: 20,
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Text('جارٍ التحميل...',
                      style: TextStyle(color: AppTheme.secondary)),
                ),
              ),
            );
          }

          final options = snapshot.data ?? const <LegalEntityOption>[];
          if (options.isEmpty) {
            return InputDecorator(
              decoration: const InputDecoration(labelText: 'الكيان القانوني'),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'تعذّر تحميل الكيانات القانونية',
                      style: TextStyle(color: AppTheme.secondary),
                    ),
                  ),
                  TextButton(
                    onPressed: () => setState(() {
                      _legalEntitiesFuture =
                          context.read<AuthController>().legalEntities();
                    }),
                    child: const Text('إعادة المحاولة'),
                  ),
                ],
              ),
            );
          }

          return DropdownButtonFormField<LegalEntityOption>(
            initialValue: _legalEntity,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'الكيان القانوني'),
            items: options
                .map((option) => DropdownMenuItem(
                      value: option,
                      child: Text(option.name),
                    ))
                .toList(),
            onChanged: (value) => setState(() => _legalEntity = value),
            validator: (value) => value == null ? 'الكيان القانوني مطلوب' : null,
          );
        },
      ),
    );
  }
}

class _TaxNumberChip extends StatelessWidget {
  const _TaxNumberChip({required this.taxNumber});

  final String taxNumber;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.primarySoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFCADDD5)),
      ),
      child: Row(
        children: [
          const Icon(Icons.badge_outlined, size: 20, color: Color(0xFF176B52)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'الرقم الضريبي: $taxNumber',
              style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
