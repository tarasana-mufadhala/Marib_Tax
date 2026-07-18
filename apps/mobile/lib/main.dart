import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'features/activity_address_change/presentation/activity_address_change_page.dart';

void main() => runApp(const MaribTaxApp());

class MaribTaxApp extends StatelessWidget {
  const MaribTaxApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'مكتب الضرائب بمحافظة مأرب',
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF176B52)),
        useMaterial3: true,
      ),
      home: const ActivityAddressChangePage(),
    );
  }
}
