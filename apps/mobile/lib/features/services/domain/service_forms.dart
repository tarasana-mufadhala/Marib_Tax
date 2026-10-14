/// وصف حقول نموذج كل خدمة، مطابقاً لمخططات Zod على الخادم.
///
/// نبقيه وصفاً بيانياً لا شاشات مكتوبة يدوياً لكل خدمة: أي تغيير في النموذج
/// يصير سطراً هنا، والشاشة تبنيه تلقائياً — فلا تتفرق قواعد الحقول في الواجهة.
library;

enum FieldKind { text, multiline, number, date, choice }

class FormFieldSpec {
  const FormFieldSpec({
    required this.name,
    required this.label,
    this.kind = FieldKind.text,
    this.required$ = true,
    this.choices = const [],
    this.hint,
  });

  final String name;
  final String label;
  final FieldKind kind;
  final bool required$;

  /// (القيمة المرسلة، التسمية المعروضة) لحقول الاختيار.
  final List<({String value, String label})> choices;
  final String? hint;
}

/// حقل نوع وثيقة الهوية — مشترك بين FR-101 و FR-105.
const _identityField = FormFieldSpec(
  name: 'identityDocumentType',
  label: 'وثيقة الهوية',
  kind: FieldKind.choice,
  choices: [
    (value: 'national_id', label: 'البطاقة الشخصية'),
    (value: 'passport', label: 'جواز السفر'),
  ],
);

/// حقل «هل النشاط شركة؟» — يحدد المستندات الإضافية المطلوبة.
const _isCompanyField = FormFieldSpec(
  name: 'isCompany',
  label: 'طبيعة النشاط',
  kind: FieldKind.choice,
  choices: [
    (value: 'false', label: 'مؤسسة فردية'),
    (value: 'true', label: 'شركة'),
  ],
);

const _notesField = FormFieldSpec(
  name: 'notes',
  label: 'ملاحظات',
  kind: FieldKind.multiline,
  required$: false,
);

/// حقول كل خدمة بترتيب العرض.
const Map<String, List<FormFieldSpec>> serviceFormFields = {
  'FR-101': [
    _identityField,
    FormFieldSpec(name: 'activityName', label: 'اسم النشاط التجاري'),
    FormFieldSpec(
      name: 'activityDescription',
      label: 'وصف النشاط',
      kind: FieldKind.multiline,
      required$: false,
    ),
    FormFieldSpec(name: 'commercialRegisterNumber', label: 'رقم السجل التجاري'),
    FormFieldSpec(name: 'district', label: 'المديرية'),
    FormFieldSpec(name: 'street', label: 'الشارع'),
    FormFieldSpec(
      name: 'nearbyLandmark',
      label: 'أقرب معلم',
      required$: false,
    ),
    FormFieldSpec(
      name: 'premisesOwnership',
      label: 'صفة المحل',
      kind: FieldKind.choice,
      choices: [
        (value: 'rented', label: 'مستأجر'),
        (value: 'owned', label: 'ملك'),
      ],
    ),
    FormFieldSpec(name: 'startedAt', label: 'تاريخ بدء النشاط', kind: FieldKind.date),
    FormFieldSpec(
      name: 'employeeCount',
      label: 'عدد العاملين',
      kind: FieldKind.number,
      required$: false,
    ),
    _notesField,
  ],
  'FR-102': [
    FormFieldSpec(name: 'tradeNameRegistrationNumber', label: 'رقم شهادة قيد الاسم التجاري'),
    FormFieldSpec(name: 'practiceLicenseNumber', label: 'رقم رخصة مزاولة المهنة'),
    FormFieldSpec(
      name: 'insuranceCardNumber',
      label: 'رقم البطاقة التأمينية',
      required$: false,
    ),
    _isCompanyField,
    FormFieldSpec(
      name: 'partnerCount',
      label: 'عدد الشركاء',
      kind: FieldKind.number,
      required$: false,
      hint: 'للشركات فقط',
    ),
    _notesField,
  ],
  'FR-103': [
    FormFieldSpec(name: 'lossReason', label: 'سبب الفقدان', kind: FieldKind.multiline),
    FormFieldSpec(
      name: 'previousTaxNumber',
      label: 'الرقم الضريبي السابق',
      required$: false,
    ),
    _isCompanyField,
    _notesField,
  ],
  'FR-104': [
    FormFieldSpec(name: 'previousRegisterNumber', label: 'رقم السجل التجاري السابق'),
    FormFieldSpec(name: 'newRegisterNumber', label: 'رقم السجل التجاري الجديد'),
    FormFieldSpec(name: 'previousTradeName', label: 'الاسم التجاري السابق'),
    FormFieldSpec(name: 'newTradeName', label: 'الاسم التجاري الجديد'),
    FormFieldSpec(name: 'changeReason', label: 'سبب التحديث', kind: FieldKind.multiline),
    _isCompanyField,
    _notesField,
  ],
  'FR-105': [
    _identityField,
    FormFieldSpec(name: 'taxCardNumber', label: 'رقم البطاقة الضريبية'),
    FormFieldSpec(name: 'purpose', label: 'الغرض من الشهادة', kind: FieldKind.multiline),
    _isCompanyField,
    _notesField,
  ],
};

/// يحوّل قيم الحقول النصية إلى الأنواع التي يتوقعها الخادم.
///
/// الحقول الاختيارية الفارغة تُرسل `null` لا سلسلة فارغة، لأن مخطط الخادم
/// يرفض السلاسل الفارغة ويقبل `null`.
Map<String, dynamic> buildFormPayload(
  String serviceCode,
  Map<String, String> values,
) {
  final fields = serviceFormFields[serviceCode] ?? const <FormFieldSpec>[];
  final payload = <String, dynamic>{};

  for (final field in fields) {
    final raw = (values[field.name] ?? '').trim();

    if (raw.isEmpty) {
      if (!field.required$) payload[field.name] = null;
      continue;
    }

    payload[field.name] = switch (field.kind) {
      FieldKind.number => int.tryParse(raw),
      FieldKind.date => _toIsoInstant(raw),
      FieldKind.choice => _choiceValue(raw),
      _ => raw,
    };
  }

  return payload;
}

/// `true`/`false` النصية تُرسل قيمة منطقية، وما عداها يبقى نصاً.
Object _choiceValue(String raw) {
  if (raw == 'true') return true;
  if (raw == 'false') return false;
  return raw;
}

/// الخادم يتوقع تاريخاً بصيغة ISO 8601 كاملة بالتوقيت العالمي.
String _toIsoInstant(String raw) {
  final parsed = DateTime.tryParse(raw);
  return (parsed ?? DateTime.now()).toUtc().toIso8601String();
}
