import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  ScaleIcon,
  FileTextIcon,
  DownloadIcon,
  ShieldCheckIcon,
} from '@marib-tax/web-ui';
import { publicApi } from '@/lib/api-client';
import type { PublicLibraryDocument } from '@/lib/api-client';

const FALLBACK_LAWS: PublicLibraryDocument[] = [
  {
    id: 'law-1',
    title: 'قانون ضريبة الدخل وتعديلاته بالجمهورية اليمنية',
    category: 'law',
    version: 'القانون رقم (17) لسنة 2010',
    sizeKb: 1250,
    mimeType: 'application/pdf',
    publishedAt: '2010',
    fileUrl: '#',
  },
  {
    id: 'law-2',
    title: 'اللائحة التنفيذية لقانون ضريبة الدخل',
    category: 'law',
    version: 'قرار رئيس مجلس الوزراء رقم (411)',
    sizeKb: 980,
    mimeType: 'application/pdf',
    publishedAt: '2011',
    fileUrl: '#',
  },
  {
    id: 'law-3',
    title: 'قانون الضريبة العامة على المبيعات ولائحته التنفيذية',
    category: 'law',
    version: 'القانون رقم (19) لسنة 2001',
    sizeKb: 1420,
    mimeType: 'application/pdf',
    publishedAt: '2001',
    fileUrl: '#',
  },
  {
    id: 'law-4',
    title: 'قانون ضريبة ريع العقارات والأراضي الفضاء',
    category: 'law',
    version: 'القانون رقم (12) لسنة 1999',
    sizeKb: 650,
    mimeType: 'application/pdf',
    publishedAt: '1999',
    fileUrl: '#',
  },
  {
    id: 'law-5',
    title: 'قانون تحصيل الأموال العامة وإجراءات الحجز الإداري',
    category: 'law',
    version: 'القانون رقم (13) لسنة 1990',
    sizeKb: 820,
    mimeType: 'application/pdf',
    publishedAt: '1990',
    fileUrl: '#',
  },
];

export default async function LawsPage() {
  const apiLaws = await publicApi.getLibraryDocuments('law');
  const laws = apiLaws.length > 0 ? apiLaws : FALLBACK_LAWS;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--usr-bg)] selection:bg-[var(--usr-gold)] selection:text-white">
      <PublicHeader />

      {/* Hero Header */}
      <section className="usr-page-header text-center py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-3">
          <Badge variant="gold" className="px-3 py-1 font-bold text-xs">التشريع والرقابة</Badge>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-display text-white">
            القوانين واللوائح الضريبية النافذة
          </h1>
          <p className="text-xs sm:text-base text-slate-200 font-light max-w-2xl mx-auto">
            المرجع التشريعي والقانوني الكامل للضرائب المباشرة وغير المباشرة واللوائح التنفيذية بالجمهورية اليمنية
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 sm:space-y-10 w-full">
        {/* Info Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4 border-r-4 border-r-[var(--usr-gold)]">
          <div className="flex items-center gap-3">
            <ScaleIcon size={24} className="text-[var(--usr-gold-dark)] shrink-0" />
            <p className="text-xs sm:text-sm text-slate-700 font-medium">
              تلتزم كافة إجراءات الربط والتحصيل والتقدير في مكتب ضرائب مأرب بنصوص القوانين واللوائح الرسمية الصادرة عن الدولة.
            </p>
          </div>
        </div>

        {/* Laws Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {laws.map((law) => (
            <div
              key={law.id}
              className="usr-feature-card-lite flex flex-col justify-between rounded-3xl p-5 sm:p-7 border border-slate-200/90 bg-white"
            >
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[var(--usr-primary-soft)] text-[var(--usr-primary)] flex items-center justify-center shrink-0">
                    <ScaleIcon size={22} />
                  </div>
                  <Badge variant="gold" className="text-[11px]">{law.publishedAt ? `سنة ${law.publishedAt}` : 'تشريع نافذ'}</Badge>
                </div>

                <div>
                  <span className="text-xs font-mono font-bold text-[var(--usr-primary)]">{law.version}</span>
                  <h3 className="font-bold text-base sm:text-lg font-display text-[var(--usr-primary-dark)] mt-1 leading-snug">
                    {law.title}
                  </h3>
                </div>

                <p className="text-xs text-[var(--usr-muted)] leading-relaxed font-light">
                  النص التشريعي الكامل واللوائح التفسيرية الصادرة وفق القوانين والقرارات الجمهورية النافذة.
                </p>

                <div className="p-3 rounded-2xl bg-[var(--usr-bg)] border border-[var(--usr-border)]/60 text-xs flex items-center justify-between text-slate-600 font-mono">
                  <span>حجم الوثيقة:</span>
                  <strong className="text-[var(--usr-primary)]">{law.sizeKb} KB</strong>
                </div>
              </div>

              <div className="pt-4 mt-5 border-t border-slate-100">
                <a href={law.fileUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                  <Button variant="outline" size="sm" className="w-full gap-2 font-bold justify-center rounded-xl text-xs py-2">
                    <DownloadIcon size={14} />
                    <span>تحميل النص الكامل PDF</span>
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
