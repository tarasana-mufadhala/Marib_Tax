import 'package:flutter/material.dart';

import '../domain/masterdata_models.dart';

class MasterdataMockPage extends StatelessWidget {
  MasterdataMockPage({super.key, OwnedMasterdataBundleMock? bundle})
    : bundle = bundle ?? OwnedMasterdataBundleMock.demo();

  final OwnedMasterdataBundleMock bundle;

  @override
  Widget build(BuildContext context) {
    final activity = bundle.activities.first;
    final property = bundle.properties.first;
    final ownership = bundle.ownershipRecords.first;
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text('الأنشطة والعقارات (عرض تجريبي)')),
        body: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              activity.name,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text('حالة النشاط: ${activity.statusCode}'),
            Text('مرجع النشاط: ${activity.publicRef ?? '—'}'),
            Text('العقار: ${property.description ?? '—'}'),
            Text(
              'الملكية الحالية: ${ownership.isCurrent ? 'نعم' : 'لا'} (${ownership.partyRoleCode})',
            ),
            const SizedBox(height: 16),
            Text(
              'بيانات وهمية فقط. لا اتصال بالإنتاج ولا تخزين محلي دائم.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}
