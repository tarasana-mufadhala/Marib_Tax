import { TaxTopicPage } from '@/components/TaxTopicPage';
import { publicApi } from '@/lib/api-client';

export const metadata = {
  title: 'ضرائب الدخل — مكتب الضرائب بمحافظة مأرب',
  description:
    'القوانين والقرارات والنماذج والأدلة المتعلقة بضريبة الدخل على الأرباح التجارية والصناعية والخدمية.',
};

export default async function IncomeTaxPage() {
  const documents = await publicApi.getLibraryDocuments(undefined, 'income_tax');

  return (
    <TaxTopicPage
      title="ضرائب الدخل"
      subtitle="كل ما يخص ضريبة الدخل على الأرباح التجارية والصناعية والخدمية: النصوص القانونية، القرارات والتعاميم، الإقرارات المعتمدة، والأدلة الإرشادية."
      documents={documents}
    />
  );
}
