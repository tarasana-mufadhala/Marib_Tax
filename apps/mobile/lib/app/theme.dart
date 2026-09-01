import 'package:flutter/material.dart';

/// الرموز التصميمية للتطبيق (Design Tokens).
///
/// كل لون ومقاس في التطبيق يُقرأ من هنا لا من قيمة مكتوبة في الشاشة:
/// تغيير الهوية يصير تعديل سطر لا مطاردة عبر عشرات الملفات.
class AppTheme {
  const AppTheme._();

  // ---------------------------------------------------------------- الألوان
  static const Color primary = Color(0xFF087A66);
  static const Color primaryDark = Color(0xFF056553);
  static const Color background = Color(0xFFF7F9F9);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color text = Color(0xFF172121);
  static const Color secondary = Color(0xFF697979);
  static const Color border = Color(0xFFE6ECEB);
  static const Color success = Color(0xFF2D9A68);
  static const Color warning = Color(0xFFE9A23B);
  static const Color danger = Color(0xFFD95757);

  /// خلفية فاتحة جداً للأيقونات داخل البطاقات.
  static const Color primarySoft = Color(0xFFE8F3F0);

  // --------------------------------------------------------------- المقاسات
  static const double screenPadding = 16;
  static const double cardRadius = 14;
  static const double controlHeight = 50;
  static const double sectionGap = 22;
  static const double cardGap = 11;

  /// أصغر مساحة لمس مقبولة.
  static const double minTouchTarget = 44;

  static ThemeData build() {
    final scheme = ColorScheme.fromSeed(
      seedColor: primary,
      primary: primary,
      surface: surface,
      error: danger,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: background,
      // خط يدعم العربية على كل المنصّات دون أصول إضافية.
      fontFamily: 'Tajawal',
      appBarTheme: const AppBarTheme(
        backgroundColor: surface,
        foregroundColor: text,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontFamily: 'Tajawal',
          fontSize: 17,
          fontWeight: FontWeight.w700,
          color: text,
        ),
      ),
      // 14 حدٌّ أدنى للنص الأساسي كما يقتضي وضوح القراءة للمكلفين.
      textTheme: const TextTheme(
        bodyLarge: TextStyle(fontSize: 15, color: text, height: 1.6),
        bodyMedium: TextStyle(fontSize: 14, color: text, height: 1.6),
        bodySmall: TextStyle(fontSize: 13, color: secondary, height: 1.5),
        titleMedium: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w700,
          color: text,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        border: _inputBorder(border),
        enabledBorder: _inputBorder(border),
        focusedBorder: _inputBorder(primary, width: 1.6),
        errorBorder: _inputBorder(danger),
        focusedErrorBorder: _inputBorder(danger, width: 1.6),
        labelStyle: const TextStyle(fontSize: 14, color: secondary),
        helperStyle: const TextStyle(fontSize: 12, color: secondary),
        errorStyle: const TextStyle(fontSize: 12, color: danger),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(controlHeight),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(cardRadius),
          ),
          textStyle: const TextStyle(
            fontFamily: 'Tajawal',
            fontSize: 15.5,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          minimumSize: const Size.fromHeight(controlHeight),
          side: const BorderSide(color: border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(cardRadius),
          ),
          textStyle: const TextStyle(
            fontFamily: 'Tajawal',
            fontSize: 14.5,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          textStyle: const TextStyle(
            fontFamily: 'Tajawal',
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: surface,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardRadius),
          side: const BorderSide(color: border),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: border,
        thickness: 1,
        space: 1,
      ),
      chipTheme: const ChipThemeData(
        side: BorderSide(color: border),
        labelStyle: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }

  static OutlineInputBorder _inputBorder(Color color, {double width = 1}) =>
      OutlineInputBorder(
        borderRadius: BorderRadius.circular(cardRadius),
        borderSide: BorderSide(color: color, width: width),
      );
}
