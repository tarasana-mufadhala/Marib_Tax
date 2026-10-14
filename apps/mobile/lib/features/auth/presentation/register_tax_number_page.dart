import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/app_scaffold.dart';
import 'auth_controller.dart';
import 'register_details_page.dart';

/// FR-001 خطوة 5: السؤال التفريعي «هل لديك رقم ضريبي مسبق؟».
/// الإجابة تحدد إن كان حقل الرقم الضريبي سيُطلب، ولا تغيّر بقية الفورم.
class RegisterTaxNumberPage extends StatefulWidget {
  const RegisterTaxNumberPage({super.key});

  static const String routeName = '/register/tax-number';

  @override
  State<RegisterTaxNumberPage> createState() => _RegisterTaxNumberPageState();
}

class _RegisterTaxNumberPageState extends State<RegisterTaxNumberPage> {
  final _formKey = GlobalKey<FormState>();
  final _taxNumberController = TextEditingController();

  /// null = لم يُجب بعد.
  bool? _hasTaxNumber;

  @override
  void dispose() {
    _taxNumberController.dispose();
    super.dispose();
  }

  void _continue() {
    if (_hasTaxNumber == null) return;
    if (_hasTaxNumber! && !_formKey.currentState!.validate()) return;

    context
        .read<AuthController>()
        .setExistingTaxNumber(_hasTaxNumber! ? _taxNumberController.text : null);
    Navigator.of(context).pushNamed(RegisterDetailsPage.routeName);
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'الرقم الضريبي',
      subtitle: 'هل لديك رقم ضريبي مسجَّل لدى المكتب مسبقاً؟',
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _ChoiceCard(
              label: 'نعم، لديّ رقم ضريبي',
              description: 'سنربط حسابك ببياناتك وخدماتك المسجّلة لدى المكتب.',
              selected: _hasTaxNumber == true,
              onTap: () => setState(() => _hasTaxNumber = true),
            ),
            const SizedBox(height: 12),
            _ChoiceCard(
              label: 'لا، ليس لديّ رقم ضريبي',
              description: 'ستتمكن من طلب استخراج رقم ضريبي بعد إنشاء الحساب.',
              selected: _hasTaxNumber == false,
              onTap: () => setState(() => _hasTaxNumber = false),
            ),
            if (_hasTaxNumber == true) ...[
              const SizedBox(height: 20),
              TextFormField(
                controller: _taxNumberController,
                keyboardType: TextInputType.text,
                textDirection: TextDirection.ltr,
                inputFormatters: [LengthLimitingTextInputFormatter(40)],
                decoration: const InputDecoration(labelText: 'الرقم الضريبي'),
                validator: (value) => (value ?? '').trim().isEmpty
                    ? 'أدخل الرقم الضريبي أو اختر «لا»'
                    : null,
              ),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _hasTaxNumber == null ? null : _continue,
              child: const Text('متابعة'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChoiceCard extends StatelessWidget {
  const _ChoiceCard({
    required this.label,
    required this.description,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String description;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primarySoft : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? AppTheme.primary : AppTheme.border,
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
              color: selected ? AppTheme.primary : AppTheme.secondary,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: const TextStyle(fontSize: 13, color: AppTheme.secondary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
