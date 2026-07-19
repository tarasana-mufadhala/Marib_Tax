/// Local mock display models for owned taxpayer registry read data.
/// No network, database, or credential access.
class TaxpayerProfileMock {
  TaxpayerProfileMock({
    required this.id,
    required this.displayName,
    required this.statusCode,
    required this.hasTaxNumber,
    required this.activeLegalEntityCount,
    required this.openDuesFlag,
    this.publicRef,
  }) {
    if (id.trim().isEmpty) throw ArgumentError.value(id, 'id');
    if (displayName.trim().isEmpty) {
      throw ArgumentError.value(displayName, 'displayName');
    }
  }

  final String id;
  final String? publicRef;
  final String displayName;
  final String statusCode;
  final bool hasTaxNumber;
  final int activeLegalEntityCount;
  final bool openDuesFlag;

  Map<String, Object?> toJson() => {
    'id': id,
    'publicRef': publicRef,
    'displayName': displayName,
    'statusCode': statusCode,
    'hasTaxNumber': hasTaxNumber,
    'activeLegalEntityCount': activeLegalEntityCount,
    'openDuesFlag': openDuesFlag,
  };
}

class TaxNumberMock {
  TaxNumberMock({
    required this.id,
    required String taxNumberValue,
    required this.statusCode,
    required this.legalEntityId,
  }) : taxNumberValue = _digitsOnly(taxNumberValue),
       taxNumberValueMasked = _mask(_digitsOnly(taxNumberValue)) {
    if (id.trim().isEmpty) throw ArgumentError.value(id, 'id');
  }

  final String id;
  final String taxNumberValue;
  final String taxNumberValueMasked;
  final String statusCode;
  final String legalEntityId;

  /// Report matrix field key `tax_number_value` (clear value stays local/mock only).
  static const reportFieldTaxNumberValue = 'tax_number_value';

  Map<String, Object?> toJson() => {
    'id': id,
    'taxNumberValueMasked': taxNumberValueMasked,
    'statusCode': statusCode,
    'legalEntityId': legalEntityId,
  };

  static String _digitsOnly(String value) {
    final normalized = value.trim();
    if (!RegExp(r'^[0-9]+$').hasMatch(normalized)) {
      throw ArgumentError.value(value, 'taxNumberValue');
    }
    return normalized;
  }

  static String _mask(String value) {
    if (value.length <= 4) return '*' * value.length;
    return '${'*' * (value.length - 4)}${value.substring(value.length - 4)}';
  }
}

class OwnedTaxpayerBundleMock {
  OwnedTaxpayerBundleMock({
    required this.taxpayer,
    required List<TaxNumberMock> taxNumbers,
  }) : taxNumbers = List.unmodifiable(taxNumbers);

  final TaxpayerProfileMock taxpayer;
  final List<TaxNumberMock> taxNumbers;

  static OwnedTaxpayerBundleMock demo() => OwnedTaxpayerBundleMock(
    taxpayer: TaxpayerProfileMock(
      id: '11111111-1111-4111-8111-111111111111',
      publicRef: 'MOCK-T-1',
      displayName: 'مكلف تجريبي',
      statusCode: 'active',
      hasTaxNumber: true,
      activeLegalEntityCount: 1,
      openDuesFlag: false,
    ),
    taxNumbers: [
      TaxNumberMock(
        id: '33333333-3333-4333-8333-333333333333',
        taxNumberValue: '0123456789',
        statusCode: 'issued',
        legalEntityId: '22222222-2222-4222-8222-222222222222',
      ),
    ],
  );
}
