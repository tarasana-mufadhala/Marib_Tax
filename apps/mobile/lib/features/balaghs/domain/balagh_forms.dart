/// وصف حقول البلاغات الستة (FR-201..206) مطابقاً لمخططات Zod على الخادم.
///
/// نبقيه وصفاً بيانياً لا شاشة مكتوبة لكل بلاغ: أي تغيير في المخطط يصير
/// سطراً هنا، والشاشة تبنيه — فلا تتفرق قواعد الحقول بين الطرفين.
library;

enum BalaghFieldKind { text, multiline, number, date, choice, activities, confirm }

class BalaghField {
  const BalaghField({
    required this.name,
    required this.label,
    this.kind = BalaghFieldKind.text,
    this.required$ = true,
    this.choices = const [],
    this.hint,
    /// الحقل داخل كائن متداخل في الحمولة (مثل newAddress).
    this.group,
  });

  final String name;
  final String label;
  final BalaghFieldKind kind;
  final bool required$;
  final List<({String value, String label})> choices;
  final String? hint;
  final String? group;
}

class BalaghType {
  const BalaghType({
    required this.code,
    required this.title,
    required this.description,
    required this.fieldVisit,
    required this.fields,
  });

  final String code;
  final String title;
  final String description;

  /// هل يتبع هذا البلاغ نزول ميداني؟ (القسم 4.4)
  final bool fieldVisit;
  final List<BalaghField> fields;
}

const _notes = BalaghField(
  name: 'notes',
  label: 'ملاحظات',
  kind: BalaghFieldKind.multiline,
  required$: false,
);

/// البلاغات الستة بترتيبها في المستند.
const List<BalaghType> balaghTypes = [
  BalaghType(
    code: 'FR-201',
    title: 'إخطار إيقاف نشاط',
    description:
        'اختر الأنشطة التي ترغب بإيقافها. يتبع البلاغ نزول ميداني للتحقق، '
        'ثم يصلك قرار الموافقة أو الرفض.',
    fieldVisit: true,
    fields: [
      BalaghField(
        name: 'activityIds',
        label: 'الأنشطة المراد إيقافها',
        kind: BalaghFieldKind.activities,
      ),
      BalaghField(
        name: 'stopType',
        label: 'نوع الإيقاف',
        kind: BalaghFieldKind.choice,
        choices: [
          (value: 'permanent', label: 'إيقاف نهائي'),
          (value: 'temporary', label: 'إيقاف مؤقت'),
        ],
      ),
      BalaghField(name: 'stoppedAt', label: 'تاريخ الإيقاف', kind: BalaghFieldKind.date),
      BalaghField(name: 'reason', label: 'سبب الإيقاف', kind: BalaghFieldKind.multiline),
      BalaghField(name: 'lastWorkingDay', label: 'آخر يوم عمل', required$: false),
      BalaghField(name: 'siteStatus', label: 'حالة الموقع', required$: false),
      BalaghField(
        name: 'siteOccupancyType',
        label: 'صفة شغل الموقع',
        required$: false,
        hint: 'ملك أو إيجار',
      ),
      _notes,
      BalaghField(
        name: 'declarationConfirmed',
        label: 'أقرّ بصحة البيانات المذكورة أعلاه',
        kind: BalaghFieldKind.confirm,
      ),
    ],
  ),

  BalaghType(
    code: 'FR-202',
    title: 'إخطار خروج مستأجر أو إخلاء عقار',
    description:
        'بيانات العقار والمستأجرين. يتبع البلاغ نزول ميداني ثم قرار موافقة أو رفض.',
    fieldVisit: true,
    fields: [
      BalaghField(name: 'propertyType', label: 'نوع العقار', hint: 'محل تجاري، شقة، مخزن...'),
      BalaghField(name: 'district', label: 'المديرية'),
      BalaghField(name: 'street', label: 'الشارع'),
      BalaghField(
        name: 'tenantCount',
        label: 'عدد المستأجرين الخارجين',
        kind: BalaghFieldKind.number,
      ),
      BalaghField(name: 'locationSnapshot', label: 'وصف الموقع', required$: false),
      _notes,
      BalaghField(
        name: 'ownershipDeclarationConfirmed',
        label: 'أقرّ بملكيتي للعقار وبصحة البيانات',
        kind: BalaghFieldKind.confirm,
      ),
    ],
  ),

  BalaghType(
    code: 'FR-203',
    title: 'إخطار خروج عامل',
    description: 'يتبع البلاغ نزول ميداني ثم قرار موافقة أو رفض.',
    fieldVisit: true,
    fields: [
      BalaghField(
        name: 'activityId',
        label: 'النشاط التابع له العامل',
        kind: BalaghFieldKind.activities,
        hint: 'اختر نشاطاً واحداً',
      ),
      BalaghField(
        name: 'workerCount',
        label: 'عدد العاملين الخارجين',
        kind: BalaghFieldKind.number,
      ),
    ],
  ),

  BalaghType(
    code: 'FR-204',
    title: 'إخطار تغيير عنوان النشاط',
    description:
        'أدخل العنوان الجديد. يتبع البلاغ نزول ميداني للتحقق ثم قرار موافقة أو رفض.',
    fieldVisit: true,
    fields: [
      BalaghField(
        name: 'activityId',
        label: 'النشاط',
        kind: BalaghFieldKind.activities,
        hint: 'اختر نشاطاً واحداً',
      ),
      BalaghField(name: 'district', label: 'المديرية الجديدة', group: 'newAddress'),
      BalaghField(name: 'street', label: 'الشارع الجديد', group: 'newAddress'),
      BalaghField(
        name: 'neighborhood',
        label: 'الحي',
        required$: false,
        group: 'newAddress',
      ),
      BalaghField(
        name: 'nearbyLandmark',
        label: 'أقرب معلم',
        required$: false,
        group: 'newAddress',
      ),
      BalaghField(
        name: 'occupancyType',
        label: 'صفة المقر الجديد',
        kind: BalaghFieldKind.choice,
        choices: [
          (value: 'rented', label: 'مستأجر'),
          (value: 'owned', label: 'ملك'),
        ],
      ),
      BalaghField(name: 'landlordName', label: 'اسم المالك', required$: false),
      BalaghField(
        name: 'startedAt',
        label: 'تاريخ الانتقال',
        kind: BalaghFieldKind.date,
      ),
    ],
  ),

  BalaghType(
    code: 'FR-205',
    title: 'إخطار نقل ملكية عقار',
    description:
        'بيانات العقار والمالك الجديد. يتبع البلاغ نزول ميداني ثم قرار موافقة أو رفض.',
    fieldVisit: true,
    fields: [
      BalaghField(name: 'propertyType', label: 'نوع العقار'),
      BalaghField(name: 'district', label: 'المديرية'),
      BalaghField(name: 'neighborhood', label: 'الحي', required$: false),
      BalaghField(name: 'rentalStatus', label: 'حالة الإيجار', hint: 'مؤجَّر أو شاغر'),
      BalaghField(name: 'priorOwnerName', label: 'اسم المالك السابق'),
      BalaghField(name: 'newOwnerName', label: 'اسم المالك الجديد'),
      BalaghField(name: 'newOwnerPhone', label: 'هاتف المالك الجديد'),
      BalaghField(name: 'newOwnerAddress', label: 'عنوان المالك الجديد'),
      BalaghField(
        name: 'newOwnerNationalId',
        label: 'رقم هوية المالك الجديد',
        required$: false,
      ),
      BalaghField(
        name: 'newOwnerTaxNumber',
        label: 'الرقم الضريبي للمالك الجديد',
        required$: false,
      ),
      BalaghField(
        name: 'transferType',
        label: 'نوع النقل',
        kind: BalaghFieldKind.choice,
        choices: [
          (value: 'بيع', label: 'بيع'),
          (value: 'هبة', label: 'هبة'),
          (value: 'إرث', label: 'إرث'),
          (value: 'أخرى', label: 'أخرى'),
        ],
      ),
      BalaghField(
        name: 'relationshipCode',
        label: 'صفتك في المعاملة',
        kind: BalaghFieldKind.choice,
        choices: [
          (value: 'seller', label: 'البائع'),
          (value: 'buyer', label: 'المشتري'),
          (value: 'agent', label: 'وكيل'),
        ],
      ),
      BalaghField(
        name: 'transferDate',
        label: 'تاريخ النقل',
        kind: BalaghFieldKind.date,
      ),
      BalaghField(
        name: 'unitCount',
        label: 'عدد الوحدات',
        kind: BalaghFieldKind.number,
        required$: false,
      ),
      BalaghField(name: 'documentNumber', label: 'رقم الوثيقة', required$: false),
      BalaghField(
        name: 'issuingAuthority',
        label: 'الجهة المُصدِرة',
        required$: false,
      ),
      BalaghField(name: 'description', label: 'وصف العقار', kind: BalaghFieldKind.multiline, required$: false),
    ],
  ),

  BalaghType(
    code: 'FR-206',
    title: 'إخطار تفعيل نشاط موقوف',
    description:
        'يُعالَج هذا البلاغ داخل المكتب بلا نزول ميداني، ويصلك قرار الموافقة أو الرفض.',
    fieldVisit: false,
    fields: [
      BalaghField(
        name: 'activityIds',
        label: 'الأنشطة المراد تفعيلها',
        kind: BalaghFieldKind.activities,
      ),
      BalaghField(
        name: 'startedAt',
        label: 'تاريخ استئناف النشاط',
        kind: BalaghFieldKind.date,
      ),
      BalaghField(
        name: 'priorStopReferenceNumber',
        label: 'مرجع بلاغ الإيقاف السابق',
        required$: false,
      ),
      BalaghField(name: 'reason', label: 'سبب التفعيل', kind: BalaghFieldKind.multiline, required$: false),
      BalaghField(
        name: 'infoConfirmed',
        label: 'أقرّ بصحة البيانات المذكورة أعلاه',
        kind: BalaghFieldKind.confirm,
      ),
    ],
  ),
];

/// خطوة واحدة في نموذج البلاغ.
class BalaghStep {
  const BalaghStep({required this.title, required this.fields});

  final String title;
  final List<BalaghField> fields;
}

/// يقسّم حقول البلاغ إلى خطوات: البيانات الأساسية، ثم التفاصيل، ثم التأكيد.
///
/// التقسيم مشتقّ من طبيعة الحقول لا مكتوب لكل بلاغ على حدة: إضافة حقل
/// إلى المخطط تجد مكانها تلقائياً بدل أن تُنسى خارج الخطوات.
List<BalaghStep> stepsOf(BalaghType type) {
  final basics = <BalaghField>[];
  final details = <BalaghField>[];
  final confirmations = <BalaghField>[];

  for (final field in type.fields) {
    if (field.kind == BalaghFieldKind.confirm) {
      confirmations.add(field);
    } else if (field.kind == BalaghFieldKind.activities ||
        field.kind == BalaghFieldKind.choice ||
        (field.required$ && field.kind != BalaghFieldKind.multiline)) {
      basics.add(field);
    } else {
      details.add(field);
    }
  }

  return [
    if (basics.isNotEmpty) BalaghStep(title: 'البيانات', fields: basics),
    if (details.isNotEmpty) BalaghStep(title: 'التفاصيل', fields: details),
    // خطوة التأكيد قائمة دائماً ولو خلت من حقول إقرار: المراجعة قبل
    // الإرسال جزء من النموذج لا زينة.
    BalaghStep(title: 'التأكيد', fields: confirmations),
  ];
}

BalaghType? balaghTypeOf(String code) {
  for (final type in balaghTypes) {
    if (type.code == code) return type;
  }
  return null;
}

/// يحوّل قيم الحقول إلى الأنواع التي يتوقعها الخادم.
///
/// الحقول الاختيارية الفارغة تُرسل `null` لا سلسلة فارغة: مخطط الخادم يرفض
/// السلسلة الفارغة ويقبل `null`.
Map<String, dynamic> buildBalaghPayload(
  BalaghType type,
  Map<String, String> values,
  List<String> selectedActivityIds,
) {
  final payload = <String, dynamic>{};

  for (final field in type.fields) {
    switch (field.kind) {
      case BalaghFieldKind.activities:
        if (field.name.endsWith('Ids')) {
          payload[field.name] = selectedActivityIds;
        } else if (selectedActivityIds.isNotEmpty) {
          payload[field.name] = selectedActivityIds.first;
        }
        continue;

      case BalaghFieldKind.confirm:
        // الخادم يشترط `true` صراحةً لهذه الحقول.
        payload[field.name] = values[field.name] == 'true';
        continue;

      default:
        break;
    }

    final raw = (values[field.name] ?? '').trim();
    final target = field.group == null
        ? payload
        : (payload[field.group!] ??= <String, dynamic>{}) as Map<String, dynamic>;

    if (raw.isEmpty) {
      if (!field.required$) target[field.name] = null;
      continue;
    }

    target[field.name] = switch (field.kind) {
      BalaghFieldKind.number => int.tryParse(raw),
      BalaghFieldKind.date => _toIsoInstant(raw),
      _ => raw,
    };
  }

  return payload;
}

String _toIsoInstant(String raw) {
  final parsed = DateTime.tryParse(raw);
  return (parsed ?? DateTime.now()).toUtc().toIso8601String();
}
