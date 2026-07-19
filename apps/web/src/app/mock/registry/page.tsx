import { mockOwnedTaxpayerBundle } from '../../../lib/registry-mock';

export default function RegistryMockPage() {
  const { taxpayer, taxNumbers, reportFieldKeys } = mockOwnedTaxpayerBundle;
  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">عرض تجريبي · بدون اتصال إنتاجي</p>
        <h1>ملف المكلف</h1>
        <p className="lead">
          واجهة وهمية لعرض حقول السجل والرقم الضريبي المقنّع وفق مصفوفة التقارير.
        </p>
      </header>
      <section className="notice" aria-labelledby="mock-profile-title">
        <h2 id="mock-profile-title">{taxpayer.displayName}</h2>
        <p>الحالة: {taxpayer.statusCode}</p>
        <p>مرجع عام: {taxpayer.publicRef ?? '—'}</p>
        <p>الرقم الضريبي (مقنّع): {taxNumbers[0]?.taxNumberValueMasked}</p>
        <p>حقول التقارير المرتبطة: {reportFieldKeys.join(' · ')}</p>
      </section>
    </main>
  );
}
