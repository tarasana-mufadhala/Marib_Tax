/// قواعد رقم الهاتف اليمني كما يقبلها الـ API.
/// الخادم يُطبّع الأرقام إلى صيغة E.164، ونطبّق القاعدة نفسها هنا
/// حتى نرفض المدخلات الخاطئة قبل استهلاك نداء شبكي ورسالة SMS.
class YemeniPhone {
  const YemeniPhone._(this.e164);

  /// الرقم بصيغة ‎+9677XXXXXXXX.
  final String e164;

  /// الصيغة المحلية للعرض: 7XXXXXXXX.
  String get local => e164.replaceFirst('+967', '');

  /// يعيد null إن كان المُدخل غير صالح.
  static YemeniPhone? tryParse(String? input) {
    if (input == null) return null;
    // نحذف المسافات والأقواس والشرطات وكذلك الأرقام العربية الشرقية.
    final cleaned = _toWesternDigits(input).replaceAll(RegExp(r'[\s()\-]'), '');

    if (RegExp(r'^\+9677\d{8}$').hasMatch(cleaned)) {
      return YemeniPhone._(cleaned);
    }
    if (RegExp(r'^9677\d{8}$').hasMatch(cleaned)) {
      return YemeniPhone._('+$cleaned');
    }
    if (RegExp(r'^009677\d{8}$').hasMatch(cleaned)) {
      return YemeniPhone._('+${cleaned.substring(2)}');
    }
    if (RegExp(r'^7\d{8}$').hasMatch(cleaned)) {
      return YemeniPhone._('+967$cleaned');
    }
    return null;
  }

  /// رسالة خطأ عربية للحقل، أو null إن كان صالحاً.
  static String? validate(String? input) {
    if (input == null || input.trim().isEmpty) return 'رقم الهاتف مطلوب';
    return tryParse(input) == null
        ? 'أدخل رقم هاتف يمني صحيح يبدأ بـ 7 ويتكون من 9 أرقام'
        : null;
  }

  static String _toWesternDigits(String input) {
    const arabicIndic = '٠١٢٣٤٥٦٧٨٩';
    final buffer = StringBuffer();
    for (final rune in input.runes) {
      final char = String.fromCharCode(rune);
      final index = arabicIndic.indexOf(char);
      buffer.write(index >= 0 ? '$index' : char);
    }
    return buffer.toString();
  }

  @override
  String toString() => e164;

  @override
  bool operator ==(Object other) => other is YemeniPhone && other.e164 == e164;

  @override
  int get hashCode => e164.hashCode;
}
