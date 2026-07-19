import 'package:flutter_test/flutter_test.dart';
import 'package:marib_tax_mobile/features/taxpayer_registry/domain/taxpayer_registry_models.dart';

void main() {
  test('rejects non-digit tax numbers and masks issued values', () {
    expect(
      () => TaxNumberMock(
        id: '1',
        taxNumberValue: 'AB12',
        statusCode: 'issued',
        legalEntityId: '2',
      ),
      throwsArgumentError,
    );
    final number = TaxNumberMock(
      id: '1',
      taxNumberValue: '0123456789',
      statusCode: 'issued',
      legalEntityId: '2',
    );
    expect(number.taxNumberValue, '0123456789');
    expect(number.taxNumberValueMasked, '******6789');
    expect(TaxNumberMock.reportFieldTaxNumberValue, 'tax_number_value');
  });

  test('demo bundle exposes report-oriented taxpayer flags', () {
    final demo = OwnedTaxpayerBundleMock.demo();
    expect(demo.taxpayer.hasTaxNumber, isTrue);
    expect(demo.taxpayer.openDuesFlag, isFalse);
  });
}
