import 'package:flutter/material.dart';

import '../domain/taxpayer_registry_models.dart';

class TaxpayerRegistryMockPage extends StatelessWidget {
  TaxpayerRegistryMockPage({super.key, OwnedTaxpayerBundleMock? bundle})
    : bundle = bundle ?? OwnedTaxpayerBundleMock.demo();

  final OwnedTaxpayerBundleMock bundle;

  @override
  Widget build(BuildContext context) {
    final taxpayer = bundle.taxpayer;
    final taxNumber = bundle.taxNumbers.first;
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text('ملف المكلف (عرض تجريبي)')),
        body: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              taxpayer.displayName,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text('الحالة: ${taxpayer.statusCode}'),
            Text('مرجع عام: ${taxpayer.publicRef ?? '—'}'),
            Text(
              'الرقم الضريبي (مقنّع): ${taxNumber.taxNumberValueMasked}',
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
