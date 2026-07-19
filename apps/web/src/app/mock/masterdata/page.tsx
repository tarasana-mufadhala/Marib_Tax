import { mockOwnedMasterdataBundle } from '../../../lib/masterdata-mock';

export default function MasterdataMockPage() {
  const { activities, properties, ownershipRecords, reportFieldKeys } =
    mockOwnedMasterdataBundle;
  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">عرض تجريبي · بدون اتصال إنتاجي</p>
        <h1>الأنشطة والعقارات</h1>
        <p className="lead">
          واجهة وهمية لعرض حقول الأنشطة والملكية وفق مصفوفة التقارير.
        </p>
      </header>
      <section className="notice" aria-labelledby="mock-masterdata-title">
        <h2 id="mock-masterdata-title">{activities[0]?.name}</h2>
        <p>حالة النشاط: {activities[0]?.statusCode}</p>
        <p>مرجع النشاط: {activities[0]?.publicRef ?? '—'}</p>
        <p>العقار: {properties[0]?.description ?? '—'}</p>
        <p>
          الملكية الحالية:{' '}
          {ownershipRecords[0]?.isCurrent ? 'نعم' : 'لا'} (
          {ownershipRecords[0]?.partyRoleCode})
        </p>
        <p>حقول التقارير المرتبطة: {reportFieldKeys.join(' · ')}</p>
      </section>
    </main>
  );
}
