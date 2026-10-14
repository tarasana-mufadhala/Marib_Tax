import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../core/design/status_style.dart';
import '../../home/domain/home_models.dart';
import 'request_documents_page.dart';

/// مراحل المعاملة كما يراها المكلف — لا رموز حالات النظام.
///
/// الرفض والإلغاء ليسا مرحلة في المسار بل خروجاً منه، فيُعرضان لافتةً فوق
/// المسار بدل تلوين مراحل لم تقع.
enum _Stage {
  received('تم استلام الطلب'),
  underReview('قيد المراجعة'),
  fieldVisit('موعد نزول ميداني'),
  payment('انتظار السداد'),
  ready('جاهز للاستلام'),
  completed('مكتمل');

  const _Stage(this.label);

  final String label;
}

/// ترتيب المرحلة التي بلغتها المعاملة، أو null إن خرجت من المسار.
int? _reachedIndex(RequestStatus status) => switch (status) {
      RequestStatus.draft => 0,
      RequestStatus.submitted || RequestStatus.received => 0,
      RequestStatus.underReview || RequestStatus.needMoreInfo => 1,
      RequestStatus.fieldVisitScheduled || RequestStatus.fieldVisitDone => 2,
      RequestStatus.paymentRequired => 3,
      RequestStatus.readyForPickup => 4,
      RequestStatus.approved ||
      RequestStatus.completed ||
      RequestStatus.archived =>
        5,
      RequestStatus.rejected || RequestStatus.cancelled => null,
      RequestStatus.unknown => null,
    };

class RequestDetailsPage extends StatelessWidget {
  const RequestDetailsPage({
    super.key,
    required this.requestId,
    required this.title,
    required this.reference,
    required this.status,
    this.isBalagh = false,
  });

  final String requestId;
  final String title;
  final String reference;
  final RequestStatus status;
  final bool isBalagh;

  @override
  Widget build(BuildContext context) {
    final reached = _reachedIndex(status);
    final style = StatusStyle.of(status);

    return Scaffold(
      appBar: AppBar(title: Text(isBalagh ? 'تفاصيل البلاغ' : 'تفاصيل الطلب')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppTheme.screenPadding,
          14,
          AppTheme.screenPadding,
          24,
        ),
        children: [
          _HeaderCard(title: title, reference: reference, status: status),
          const SizedBox(height: AppTheme.sectionGap),
          if (reached == null)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: style.background,
                borderRadius: BorderRadius.circular(AppTheme.cardRadius),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: style.color, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      status == RequestStatus.rejected
                          ? 'صدر قرار برفض هذه المعاملة. راجع المكتب لمعرفة الأسباب.'
                          : 'أُلغيت هذه المعاملة.',
                      style: TextStyle(
                        fontSize: 13,
                        height: 1.6,
                        color: style.color,
                      ),
                    ),
                  ),
                ],
              ),
            )
          else ...[
            const Text(
              'مسار المعاملة',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppTheme.text,
              ),
            ),
            const SizedBox(height: 12),
            _Timeline(reached: reached),
          ],
          const SizedBox(height: AppTheme.sectionGap),
          if (!isBalagh) ...[
            OutlinedButton.icon(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => RequestDocumentsPage(requestId: requestId),
                ),
              ),
              icon: const Icon(Icons.folder_outlined, size: 19),
              label: const Text('المستندات المرفقة'),
            ),
            if (status == RequestStatus.needMoreInfo) ...[
              const SizedBox(height: AppTheme.cardGap),
              FilledButton.icon(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => RequestDocumentsPage(requestId: requestId),
                  ),
                ),
                icon: const Icon(Icons.upload_file_outlined, size: 19),
                label: const Text('استكمال البيانات'),
              ),
            ],
          ],
        ],
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({
    required this.title,
    required this.reference,
    required this.status,
  });

  final String title;
  final String reference;
  final RequestStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 44,
            width: 44,
            decoration: BoxDecoration(
              color: AppTheme.primarySoft,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.receipt_long_outlined,
              color: AppTheme.primary,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.text,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  reference,
                  textDirection: TextDirection.ltr,
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: AppTheme.secondary,
                  ),
                ),
                const SizedBox(height: 9),
                StatusChip(status: status),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Timeline extends StatelessWidget {
  const _Timeline({required this.reached});

  /// ترتيب المرحلة الحالية ضمن [_Stage.values].
  final int reached;

  @override
  Widget build(BuildContext context) {
    const stages = _Stage.values;
    return Column(
      children: [
        for (var i = 0; i < stages.length; i++)
          _TimelineRow(
            label: stages[i].label,
            isDone: i < reached,
            isCurrent: i == reached,
            isLast: i == stages.length - 1,
          ),
      ],
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    required this.label,
    required this.isDone,
    required this.isCurrent,
    required this.isLast,
  });

  final String label;
  final bool isDone;
  final bool isCurrent;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final color = isDone
        ? AppTheme.success
        : isCurrent
            ? AppTheme.primary
            : AppTheme.border;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Column(
            children: [
              Container(
                height: 22,
                width: 22,
                decoration: BoxDecoration(
                  color: isDone || isCurrent ? color : AppTheme.surface,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isDone || isCurrent ? color : AppTheme.border,
                    width: 1.6,
                  ),
                ),
                child: isDone
                    ? const Icon(Icons.check, size: 13, color: Colors.white)
                    : isCurrent
                        ? Center(
                            child: Container(
                              height: 7,
                              width: 7,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                            ),
                          )
                        : null,
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: isDone ? AppTheme.success : AppTheme.border,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 20, top: 1),
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight:
                      isCurrent ? FontWeight.w700 : FontWeight.w500,
                  color: isDone || isCurrent
                      ? AppTheme.text
                      : AppTheme.secondary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
