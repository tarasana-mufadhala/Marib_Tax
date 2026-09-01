import { TaxTopicPage } from '@/components/TaxTopicPage';
import { publicApi } from '@/lib/api-client';

export const metadata = {
  title: 'ضريبة المبيعات — مكتب الضرائب بمحافظة مأرب',
  description:
    'القوانين والقرارات والنماذج والأدلة المتعلقة بالضريبة العامة على المبيعات.',
};

export default async function SalesTaxPage() {
  const documents = await publicApi.getLibraryDocuments(undefined, 'sales_tax');

  return (
    <TaxTopicPage
      title="ضريبة المبيعات"
      subtitle="كل ما يخص الضريبة العامة على المبيعات: النصوص القانونية، القرارات والتعاميم، النماذج المعتمدة، وأدلة التسجيل والدفاتر والفواتير."
      documents={documents}
    />
  );
}
