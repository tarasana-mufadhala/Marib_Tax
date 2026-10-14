import 'package:flutter/material.dart';

/// شعار المكتب الرسمي.
///
/// الملف بخلفية بيضاء بلا شفافية، فيُعرض دائماً داخل حاوية بيضاء مستديرة
/// حتى يبقى مقروءاً على الخلفيات الداكنة ولا يظهر كمربع أبيض ناشز.
class OfficeLogo extends StatelessWidget {
  const OfficeLogo({super.key, this.size = 96, this.padding = 8});

  /// ضلع الحاوية.
  final double size;

  /// المسافة بين حافة الحاوية والشعار.
  final double padding;

  static const String assetPath = 'assets/brand/marib-tax-logo.png';

  @override
  Widget build(BuildContext context) {
    return Container(
      height: size,
      width: size,
      padding: EdgeInsets.all(padding),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(size * 0.25),
      ),
      child: Image.asset(
        assetPath,
        fit: BoxFit.contain,
        // تعذّر تحميل المورد لا يجوز أن يُسقط الشاشة كلها.
        errorBuilder: (context, error, stackTrace) => Center(
          child: Text(
            'مـ',
            style: TextStyle(
              fontSize: size * 0.45,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF0E4A38),
            ),
          ),
        ),
      ),
    );
  }
}
