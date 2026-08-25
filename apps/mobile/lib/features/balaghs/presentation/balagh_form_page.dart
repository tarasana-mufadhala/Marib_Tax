import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../data/balagh_repository.dart';
import '../domain/balagh_forms.dart';

/// نموذج بلاغ (FR-201..206). الحقول تُبنى من [balaghTypes] المطابق لمخطط
/// الخادم، فلا تتفرق قواعد الحقول بين الطرفين.
class BalaghFormPage extends StatefulWidget {
  const BalaghFormPage({super.key, required this.type});

  final BalaghType type;

  @override
  State<BalaghFormPage> createState() => _BalaghFormPageState();
}

class _BalaghFormPageState extends State<BalaghFormPage> {
  final _formKey = GlobalKey<FormState>();
  final Map<String, TextEditingController> _controllers = {};
  final Map<String, String> _choices = {};
  final Set<String> _confirmed = {};
  final List<String> _selectedActivities = [];

  Future<List<TaxpayerActivity>>? _activities;
  bool _busy = false;
  String? _error;

  bool get _needsActivities =>
      widget.type.fields.any((f) => f.kind == BalaghFieldKind.activities);

  /// بعض البلاغات تخص نشاطاً واحداً لا عدة أنشطة.
  bool get _singleActivity => widget.type.fields.any(
      (f) => f.kind == BalaghFieldKind.activities && !f.name.endsWith('Ids'));

  @override
  void initState() {
    super.initState();
    for (final field in widget.type.fields) {
      switch (field.kind) {
        case BalaghFieldKind.choice:
          _choices[field.name] = field.choices.first.value;
        case BalaghFieldKind.activities:
        case BalaghFieldKind.confirm:
          break;
        default:
          _controllers[field.name] = TextEditingController();
      }
    }
    if (_needsActivities) _loadActivities();
  }

  void _loadActivities() {
    final balaghs = context.read<BalaghRepository>();
    _activities = balaghs.myTaxpayerId().then(
      (id) => id == null
          ? <TaxpayerActivity>[]
          : balaghs.activities(id),
    );
  }

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    // الأنشطة والإقرار خارج نطاق `Form`، فلا تلتقطهما `validate()`. نجمع
    // نقصهما مع نتيجة التحقق قبل الخروج، ليرى المكلف ما ينقصه دفعةً واحدة
    // بدل أن يُصلح حقلاً فيُفاجأ بالتالي.
    final fieldsValid = _formKey.currentState!.validate();
    final missingActivity = _needsActivities && _selectedActivities.isEmpty;
    final missingConfirmation = widget.type.fields.any(
      (field) =>
          field.kind == BalaghFieldKind.confirm &&
          !_confirmed.contains(field.name),
    );

    if (missingActivity || missingConfirmation || !fieldsValid) {
      setState(() {
        _error = missingActivity
            ? 'اختر نشاطاً واحداً على الأقل'
            : missingConfirmation
                ? 'يجب الإقرار بصحة البيانات قبل الإرسال'
                : 'أكمل الحقول المطلوبة قبل الإرسال';
      });
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final values = <String, String>{
        for (final entry in _controllers.entries) entry.key: entry.value.text,
        ..._choices,
        for (final name in _confirmed) name: 'true',
      };
      final payload =
          buildBalaghPayload(widget.type, values, _selectedActivities);
      final result = await context
          .read<BalaghRepository>()
          .submit(balaghType: widget.type.code, formData: payload);

      if (!mounted) return;
      // يُطفأ مؤشّر الإرسال قبل الحوار لا بعده: تركه دائراً خلف الحوار يوحي
      // بأن العملية لم تنتهِ بعد.
      setState(() => _busy = false);
      await showDialog<void>(
        context: context,
        builder: (_) => _SubmittedDialog(
          reference: result.publicRef,
          fieldVisit: widget.type.fieldVisit,
        ),
      );
      if (mounted) Navigator.of(context).popUntil((route) => route.isFirst);
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
      title: widget.type.title,
      subtitle: widget.type.description,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_error != null) ErrorBanner(message: _error!),
            for (final field in widget.type.fields) _buildField(field),
            const SizedBox(height: 12),
            BusyButton(
              label: 'إرسال البلاغ',
              busy: _busy,
              onPressed: _submit,
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildField(BalaghField field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: switch (field.kind) {
        BalaghFieldKind.activities => _ActivityPicker(
            label: field.label,
            hint: field.hint,
            single: _singleActivity,
            selected: _selectedActivities,
            future: _activities,
            onChanged: (ids) => setState(() {
              _selectedActivities
                ..clear()
                ..addAll(ids);
              _error = null;
            }),
            onRetry: () => setState(_loadActivities),
          ),
        BalaghFieldKind.confirm => CheckboxListTile(
            value: _confirmed.contains(field.name),
            onChanged: (checked) => setState(() {
              if (checked == true) {
                _confirmed.add(field.name);
              } else {
                _confirmed.remove(field.name);
              }
              _error = null;
            }),
            title: Text(field.label, style: const TextStyle(fontSize: 13.5)),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
            dense: true,
          ),
        BalaghFieldKind.choice => DropdownButtonFormField<String>(
            initialValue: _choices[field.name],
            isExpanded: true,
            decoration: InputDecoration(
              labelText: field.label,
              helperText: field.hint,
            ),
            items: field.choices
                .map((c) => DropdownMenuItem(value: c.value, child: Text(c.label)))
                .toList(),
            onChanged: (value) =>
                setState(() => _choices[field.name] = value ?? ''),
          ),
        BalaghFieldKind.date => _DateField(
            label: field.label,
            controller: _controllers[field.name]!,
            validator: (value) => _validate(field, value),
          ),
        _ => TextFormField(
            controller: _controllers[field.name],
            keyboardType: field.kind == BalaghFieldKind.number
                ? TextInputType.number
                : TextInputType.text,
            maxLines: field.kind == BalaghFieldKind.multiline ? 3 : 1,
            inputFormatters: [
              if (field.kind == BalaghFieldKind.number)
                FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(200),
            ],
            decoration: InputDecoration(
              labelText:
                  field.required$ ? field.label : '${field.label} (اختياري)',
              helperText: field.hint,
            ),
            validator: (value) => _validate(field, value),
          ),
      },
    );
  }

  String? _validate(BalaghField field, String? value) {
    if (!field.required$) return null;
    return (value ?? '').trim().isEmpty ? '${field.label} مطلوب' : null;
  }
}

class _ActivityPicker extends StatelessWidget {
  const _ActivityPicker({
    required this.label,
    required this.hint,
    required this.single,
    required this.selected,
    required this.future,
    required this.onChanged,
    required this.onRetry,
  });

  final String label;
  final String? hint;
  final bool single;
  final List<String> selected;
  final Future<List<TaxpayerActivity>>? future;
  final ValueChanged<List<String>> onChanged;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<TaxpayerActivity>>(
      future: future,
      builder: (context, snapshot) {
        Widget content;

        if (snapshot.connectionState == ConnectionState.waiting) {
          content = const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Center(child: CircularProgressIndicator(strokeWidth: 2.4)),
          );
        } else if (snapshot.hasError) {
          content = Row(
            children: [
              const Expanded(
                child: Text(
                  'تعذّر تحميل أنشطتك',
                  style: TextStyle(fontSize: 13, color: Color(0xFF7A8A83)),
                ),
              ),
              TextButton(onPressed: onRetry, child: const Text('إعادة المحاولة')),
            ],
          );
        } else {
          final activities = snapshot.data ?? const <TaxpayerActivity>[];
          if (activities.isEmpty) {
            content = const Text(
              'لا توجد أنشطة تجارية مسجَّلة باسمك لدى المكتب. راجع المكتب '
              'لتسجيل نشاطك قبل تقديم هذا البلاغ.',
              style: TextStyle(fontSize: 12.5, height: 1.7, color: Color(0xFF9A5B00)),
            );
          } else {
            content = Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (single)
                  RadioGroup<String>(
                    groupValue: selected.isEmpty ? null : selected.first,
                    onChanged: (value) =>
                        onChanged(value == null ? [] : [value]),
                    child: Column(
                      children: [
                        for (final activity in activities)
                          RadioListTile<String>(
                            value: activity.id,
                            title: Text(activity.name,
                                style: const TextStyle(fontSize: 13.5)),
                            contentPadding: EdgeInsets.zero,
                            dense: true,
                          ),
                      ],
                    ),
                  )
                else
                  for (final activity in activities)
                    CheckboxListTile(
                      value: selected.contains(activity.id),
                      onChanged: (checked) {
                        final next = [...selected];
                        if (checked == true) {
                          next.add(activity.id);
                        } else {
                          next.remove(activity.id);
                        }
                        onChanged(next);
                      },
                      title: Text(activity.name,
                          style: const TextStyle(fontSize: 13.5)),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                    ),
              ],
            );
          }
        }

        return Container(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFD8E0DB)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF5A6B63),
                ),
              ),
              if (hint != null)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    hint!,
                    style: const TextStyle(fontSize: 11.5, color: Color(0xFF9AAAA3)),
                  ),
                ),
              const SizedBox(height: 4),
              content,
            ],
          ),
        );
      },
    );
  }
}

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
          firstDate: DateTime(now.year - 20),
          lastDate: DateTime(now.year + 1),
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

class _SubmittedDialog extends StatelessWidget {
  const _SubmittedDialog({required this.reference, required this.fieldVisit});

  final String? reference;
  final bool fieldVisit;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      icon: const Icon(Icons.check_circle, color: AppTheme.primary, size: 44),
      title: const Text('تم استلام بلاغك'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (reference != null)
            Text(
              'رقم البلاغ: $reference',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
          const SizedBox(height: 10),
          Text(
            fieldVisit
                ? 'سيصلك إشعار بموعد النزول الميداني للمعاينة، ثم إشعار بالقرار.'
                : 'سيُعالَج البلاغ داخل المكتب ويصلك إشعار بالقرار.',
            textAlign: TextAlign.center,
            style: const TextStyle(height: 1.8, fontSize: 13.5),
          ),
        ],
      ),
      actions: [
        FilledButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('حسناً'),
        ),
      ],
    );
  }
}
