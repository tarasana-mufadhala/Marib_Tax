import 'package:flutter/material.dart';

import '../../app/theme.dart';
import '../../features/home/domain/home_models.dart';

/// المظهر البصري لحالات المعاملات، موحّداً في مكان واحد.
///
/// لون الحالة يجب أن يعني الشيء ذاته في كل شاشة: أخضر منتهٍ، برتقالي
/// ينتظر، أحمر يستدعي إجراءً. تفريق ذلك على الشاشات يجعل اللون بلا معنى.
class StatusStyle {
  const StatusStyle({
    required this.label,
    required this.color,
    required this.background,
  });

  final String label;
  final Color color;
  final Color background;

  static const Color _blue = Color(0xFF2E7D9A);
  static const Color _grey = AppTheme.secondary;

  static StatusStyle of(RequestStatus status) => switch (status) {
        RequestStatus.completed ||
        RequestStatus.approved =>
          const StatusStyle(
            label: 'مكتمل',
            color: AppTheme.success,
            background: Color(0xFFE6F4ED),
          ),
        RequestStatus.readyForPickup => const StatusStyle(
            label: 'جاهز للاستلام',
            color: Color(0xFF3FA97A),
            background: Color(0xFFEAF7F0),
          ),
        RequestStatus.underReview ||
        RequestStatus.submitted ||
        RequestStatus.received =>
          const StatusStyle(
            label: 'قيد المراجعة',
            color: AppTheme.warning,
            background: Color(0xFFFDF3E3),
          ),
        RequestStatus.needMoreInfo => const StatusStyle(
            label: 'مطلوب استكمال',
            color: Color(0xFFC97F14),
            background: Color(0xFFFCEFDB),
          ),
        RequestStatus.fieldVisitScheduled ||
        RequestStatus.fieldVisitDone =>
          const StatusStyle(
            label: 'موعد نزول ميداني',
            color: _blue,
            background: Color(0xFFE7F1F5),
          ),
        RequestStatus.paymentRequired => const StatusStyle(
            label: 'مطلوب سداد',
            color: AppTheme.danger,
            background: Color(0xFFFBEBEB),
          ),
        RequestStatus.rejected => const StatusStyle(
            label: 'مرفوض',
            color: AppTheme.danger,
            background: Color(0xFFFBEBEB),
          ),
        RequestStatus.cancelled ||
        RequestStatus.archived =>
          const StatusStyle(
            label: 'ملغى',
            color: _grey,
            background: Color(0xFFF0F3F3),
          ),
        RequestStatus.draft => const StatusStyle(
            label: 'مسودة',
            color: _grey,
            background: Color(0xFFF0F3F3),
          ),
        RequestStatus.unknown => const StatusStyle(
            label: 'غير معروف',
            color: _grey,
            background: Color(0xFFF0F3F3),
          ),
      };
}

/// وسم الحالة كما يظهر على بطاقات الطلبات والبلاغات.
class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status, this.compact = false});

  final RequestStatus status;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final style = StatusStyle.of(status);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 10,
        vertical: compact ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: style.background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        style.label,
        style: TextStyle(
          fontSize: compact ? 11 : 12,
          fontWeight: FontWeight.w700,
          color: style.color,
        ),
      ),
    );
  }
}
