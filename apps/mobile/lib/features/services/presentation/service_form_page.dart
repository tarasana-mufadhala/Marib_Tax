import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../data/service_repository.dart';
import '../domain/service_forms.dart';
import '../domain/service_models.dart';
import 'service_documents_page.dart';

/// نموذج بيانات الخدمة. الحقول تُبنى من [serviceFormFields] المطابق
/// لمخطط الخادم، فلا تتفرق قواعد الحقول بين الطرفين.
class ServiceFormPage extends StatefulWidget {
  const ServiceFormPage({super.key, required this.service});

  final ServiceDefinition service;

  @override
  State<ServiceFormPage> createState() => _ServiceFormPageState();
}

class _ServiceFormPageState extends State<ServiceFormPage> {
  final _formKey = GlobalKey<FormState>();
  final Map<String, TextEditingController> _controllers = {};
  final Map<String, String> _choices = {};

  bool _busy = false;
  String? _error;

  List<FormFieldSpec> get _fields =>
      serviceFormFields[widget.service.code] ?? const [];

  @override
  void initState() {
    super.initState();
    for (final field in _fields) {
      if (field.kind == FieldKind.choice) {
        // الاختيار الأول قيمة افتراضية حتى لا يبقى الحقل فارغاً بلا سبب.
        _choices[field.name] = field.choices.first.value;
      } else {
        _controllers[field.name] = TextEditingController();
      }
    }
  }

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _continue() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final values = <String, String>{
        for (final entry in _controllers.entries) entry.key: entry.value.text,
        ..._choices,
      };
      final payload = buildFormPayload(widget.service.code, values);
      final draft = await context
          .read<ServiceRepository>()
          .createDraft(serviceCode: widget.service.code, form: payload);

      if (!mounted) return;
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => ServiceDocumentsPage(
            service: widget.service,
            request: draft,
            identityDocumentType: _choices['identityDocumentType'],
            isCompany: _choices['isCompany'] == 'true',
          ),
        ),
      );
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: widget.service.title,
      subtitle: widget.service.acceptanceNote,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_error != null) ErrorBanner(message: _error!),
            for (final field in _fields) _buildField(field),
            const SizedBox(height: 12),
            BusyButton(
              label: 'حفظ ومتابعة للمستندات',
              busy: _busy,
              onPressed: _continue,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(FormFieldSpec field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: switch (field.kind) {
        FieldKind.choice => DropdownButtonFormField<String>(
            initialValue: _choices[field.name],
            isExpanded: true,
            decoration: InputDecoration(
              labelText: field.label,
              helperText: field.hint,
            ),
            items: field.choices
                .map((choice) => DropdownMenuItem(
                      value: choice.value,
                      child: Text(choice.label),
                    ))
                .toList(),
            onChanged: (value) =>
                setState(() => _choices[field.name] = value ?? ''),
          ),
        FieldKind.date => _DateField(
            label: field.label,
            controller: _controllers[field.name]!,
            validator: (value) => _validate(field, value),
          ),
        _ => TextFormField(
            controller: _controllers[field.name],
            keyboardType: field.kind == FieldKind.number
                ? TextInputType.number
                : TextInputType.text,
            maxLines: field.kind == FieldKind.multiline ? 3 : 1,
            inputFormatters: [
              if (field.kind == FieldKind.number)
                FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(200),
            ],
            decoration: InputDecoration(
              labelText: field.required$ ? field.label : '${field.label} (اختياري)',
              helperText: field.hint,
            ),
            validator: (value) => _validate(field, value),
          ),
      },
    );
  }

  String? _validate(FormFieldSpec field, String? value) {
    if (!field.required$) return null;
    return (value ?? '').trim().isEmpty ? '${field.label} مطلوب' : null;
  }
}

/// حقل تاريخ يفتح منتقي التاريخ ولا يقبل كتابة حرة.
class _DateField extends StatelessWidget {
  const _DateField({
    required this.label,
    required this.controller,
    required this.validator,
  });

  final String label;
  final TextEditingController controller;
  final String? Function(String?) validator;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      readOnly: true,
      decoration: InputDecoration(
        labelText: label,
        suffixIcon: const Icon(Icons.calendar_today, size: 18),
      ),
      validator: validator,
      onTap: () async {
        final now = DateTime.now();
        final picked = await showDatePicker(
          context: context,
          initialDate: now,
          firstDate: DateTime(now.year - 50),
          lastDate: now,
          locale: const Locale('ar'),
        );
        if (picked != null) {
          controller.text =
              '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
        }
      },
    );
  }
}
