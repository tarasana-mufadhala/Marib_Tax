/// قواعد كلمة المرور، مطابِقة حرفياً لـ
/// `SecurityService.validatePasswordStrength` في الـ API:
/// 8 خانات فأكثر + حرف كبير + حرف صغير + رقم + رمز خاص.
///
/// تُطبَّق هنا أيضاً كي يرى المستخدم سبباً محدداً فوراً، بدل رفض عام
/// من الخادم بعد إرسال النموذج. الخادم يبقى المرجع النهائي.
class PasswordRules {
  const PasswordRules._();

  static const int minLength = 8;

  /// وصف الشروط لعرضه تحت الحقل.
  static const String hint =
      '8 خانات فأكثر، وتحتوي على حرف إنجليزي كبير وصغير ورقم ورمز خاص مثل @ أو #';

  /// رسالة خطأ عربية، أو null إن كانت مقبولة.
  static String? validate(String? value) {
    final password = value ?? '';
    if (password.isEmpty) return 'كلمة المرور مطلوبة';
    if (password.length < minLength) {
      return 'كلمة المرور يجب ألا تقل عن $minLength خانات';
    }
    if (!RegExp(r'[A-Z]').hasMatch(password)) {
      return 'يجب أن تحتوي على حرف إنجليزي كبير واحد على الأقل';
    }
    if (!RegExp(r'[a-z]').hasMatch(password)) {
      return 'يجب أن تحتوي على حرف إنجليزي صغير واحد على الأقل';
    }
    if (!RegExp(r'[0-9]').hasMatch(password)) {
      return 'يجب أن تحتوي على رقم واحد على الأقل';
    }
    if (!RegExp(r'[^A-Za-z0-9]').hasMatch(password)) {
      return 'يجب أن تحتوي على رمز خاص مثل @ أو # أو !';
    }
    return null;
  }

  /// تطابق كلمة المرور مع تأكيدها.
  static String? validateConfirmation(String? password, String? confirmation) {
    if ((confirmation ?? '').isEmpty) return 'تأكيد كلمة المرور مطلوب';
    return password != confirmation ? 'كلمتا المرور غير متطابقتين' : null;
  }
}
