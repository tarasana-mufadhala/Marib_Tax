import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  FileTextIcon,
  DownloadIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ScrollTextIcon,
} from '@marib-tax/web-ui';
import { publicApi } from '@/lib/api-client';
import type { PublicLibraryDocument } from '@/lib/api-client';

const FALLBACK_DECISIONS: PublicLibraryDocument[] = [
  {
    id: 'dec-1',
    title: 'قرار إداري رقم (14) لسنة 2025 بشأن تمديد مهلة تقديم الإقرارات السنوية للمنشآت الفردية',
    category: 'decision',
    version: 'قرار إداري رقم 14',
    sizeKb: 210,
    mimeType: 'application/pdf',
    publishedAt: '2026/01/25',
    fileUrl: '#',
  },
  {
    id: 'dec-2',
    title: 'تعميم صادر عن مدير فرع مصلحة الضرائب بمحافظة مأرب بشأن ضوابط توريد ضريبة المرتبات عبر النظام الرقمي',
    category: 'decision',
    version: 'تعميم رسمي رقم 03',
    sizeKb: 180,
    mimeType: 'application/pdf',
    publishedAt: '2026/01/10',
    fileUrl: '#',
  },
  {
    id: 'dec-3',
    title: 'قرار بشأن تشكيل لجان الحصر الميداني للمنشآت والأنشطة التجارية في المربعات الحضرية بمدينة مأرب',
    category: 'decision',
    version: 'قرار رقم 08',
    sizeKb: 340,
    mimeType: 'application/pdf',
    publishedAt: '2025/12/28',
    fileUrl: '#',
  },
  {
    id: 'dec-4',
    title: 'تعليمات تنفيذية بشأن منح الحوافز والتسهيلات للمكلفين الملتزمين بالربط الذاتي في المحافظة',
    category: 'decision',
    version: 'تعليمات رقم 02',
    sizeKb: 290,
    mimeType: 'application/pdf',
    publishedAt: '2025/11/15',
    fileUrl: '#',
  },
];

export default async function DecisionsPage() {
  const apiDecisions = await publicApi.getLibraryDocuments('decision');
  const decisions = apiDecisions.length > 0 ? apiDecisions : FALLBACK_DECISIONS;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--usr-bg)] selection:bg-[var(--usr-gold)] selection:text-white">
      <PublicHeader />

      {/* Hero Header */}
      <section className="usr-page-header text-center py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-3">
          <Badge variant="gold" className="px-3 py-1 font-bold text-xs">التوثيق الإداري</Badge>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-display text-white">
            القرارات الإدارية والتعاميم الرسمية
          </h1>
          <p className="text-xs sm:text-base text-slate-200 font-light max-w-2xl mx-auto">
            السجل المعتمد لكافة القرارات التنظيمية والتعاميم والتعليمات الصادرة عن مكتب مصلحة الضرائب بمحافظة مأرب
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 sm:space-y-10 w-full">
        {/* Info notice */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4 border-r-4 border-r-[var(--usr-gold)]">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon size={24} className="text-[var(--usr-gold-dark)] shrink-0" />
            <p className="text-xs sm:text-sm text-slate-700 font-medium">
              تعتبر القرارات والتعاميم المنشورة في هذه البوابة رسمية ونافذة من تاريخ صدورها ونشرها للمكلفين.
            </p>
          </div>
        </div>

        {/* Decisions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
          {decisions.map((doc) => (
            <div
              key={doc.id}
              className="usr-feature-card-lite flex flex-col justify-between rounded-3xl p-5 sm:p-7 border border-slate-200/90 bg-white"
            >
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] flex items-center justify-center font-bold">
                      <ScrollTextIcon size={16} />
                    </div>
                    <Badge variant="gold" className="text-[11px]">{doc.version || 'قرار إداري'}</Badge>
                  </div>
                  <span className="text-xs text-[var(--usr-muted)] font-mono flex items-center gap-1">
                    <CalendarIcon size={13} />
                    <span>{doc.publishedAt}</span>
                  </span>
                </div>

                <h3 className="font-bold text-base sm:text-lg font-display text-[var(--usr-primary-dark)] leading-snug">
                  {doc.title}
                </h3>

                <p className="text-xs text-[var(--usr-muted)] leading-relaxed font-light">
                  صادر عن مكتب مصلحة الضرائب بمحافظة مأرب في إطار تنظيم الأعمال وتحسين جودة الخدمات المقدمة للمكلفين.
                </p>

                <div className="p-3 rounded-2xl bg-[var(--usr-bg)] border border-[var(--usr-border)]/60 text-xs flex items-center justify-between text-slate-600 font-mono">
                  <span>حجم الملف:</span>
                  <strong className="text-[var(--usr-primary)]">{doc.sizeKb} KB</strong>
                </div>
              </div>

              <div className="pt-4 mt-5 border-t border-slate-100">
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                  <Button variant="outline" size="sm" className="w-full gap-2 font-bold justify-center rounded-xl text-xs py-2">
                    <DownloadIcon size={14} />
                    <span>تحميل نص القرار PDF</span>
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
