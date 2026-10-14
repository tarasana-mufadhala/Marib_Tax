import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../domain/balagh_forms.dart';
import 'balagh_form_page.dart';

/// قائمة البلاغات الستة (القسم 4.4) — مدخل واحد من الرئيسية، على نسق
/// «تقديم طلب خدمة»، بدل ست بطاقات مبعثرة في الشاشة الأولى.
class BalaghsPage extends StatelessWidget {
  const BalaghsPage({super.key});

  static const String routeName = '/balaghs';

  static const Map<String, IconData> _icons = {
    'FR-201': Icons.pause_circle_outline,
    'FR-202': Icons.home_work_outlined,
    'FR-203': Icons.person_remove_outlined,
    'FR-204': Icons.location_on_outlined,
    'FR-205': Icons.swap_horiz,
    'FR-206': Icons.play_circle_outline,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('البلاغات')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'اختر نوع البلاغ الذي تريد تقديمه. بعد الإرسال يصلك إشعار بكل '
            'تغيّر في حالته حتى صدور القرار.',
            style: TextStyle(fontSize: 13.5, height: 1.8, color: AppTheme.secondary),
          ),
          const SizedBox(height: 16),
          for (final type in balaghTypes)
            Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => BalaghFormPage(type: type),
                  ),
                ),
                leading: Container(
                  height: 42,
                  width: 42,
                  decoration: BoxDecoration(
                    color: AppTheme.primarySoft,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _icons[type.code] ?? Icons.description_outlined,
                    size: 21,
                    color: AppTheme.primary,
                  ),
                ),
                title: Text(
                  type.title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                subtitle: Padding(
                  padding: const EdgeInsets.only(top: 3),
                  child: Text(
                    type.fieldVisit
                        ? 'يتبعه نزول ميداني للتحقق'
                        : 'يُعالَج داخل المكتب بلا نزول ميداني',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.secondary,
                    ),
                  ),
                ),
                trailing: const Icon(
                  Icons.chevron_left,
                  color: AppTheme.primary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
