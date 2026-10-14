import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  Badge,
  DownloadIcon,
  FileTextIcon,
  ShieldCheckIcon,
} from '@marib-tax/web-ui';
import { publicApi } from '@/lib/api-client';
import type { PublicLibraryDocument } from '@/lib/api-client';

const FALLBACK_FORMS: PublicLibraryDocument[] = [
  {
    id: 'form-1',
    title: 'استمارة طلب القيد والتسجيل وإصدار البطاقة الضريبية (نموذج 1)',
    category: 'form',
    version: 'الإصدار 2025/2026',
    sizeKb: 345,
    mimeType: 'application/pdf',
    publishedAt: '2026/01/10',
    fileUrl: '#',
  },
  {
    id: 'form-2',
    title: 'إقرار ضريبة الأرباح التجارية والصناعية — الحسابات والوثائق المنتظمة (نموذج 2)',
    category: 'form',
    version: 'الإصدار المعتمد 2025',
    sizeKb: 520,
    mimeType: 'application/pdf',
    publishedAt: '2026/01/15',
    fileUrl: '#',
  },
  {
    id: 'form-3',
    title: 'إقرار ضريبة الأرباح التقديرية لصغار المكلفين والمنشآت الفردية (نموذج 3)',
    category: 'form',
    version: 'الإصدار المعتمد 2025',
    sizeKb: 280,
    mimeType: 'application/pdf',
    publishedAt: '2026/01/15',
    fileUrl: '#',
  },
  {
    id: 'form-4',
    title: 'كشف استقطاع وتوريد ضريبة المرتبات والأجور الشهرية (نموذج 4)',
    category: 'form',
    version: 'الإصدار 2025',
    sizeKb: 410,
    mimeType: 'application/pdf',
    publishedAt: '2026/01/05',
    fileUrl: '#',
  },
  {
    id: 'form-5',
    title: 'طلب استخراج شهادة إبراء ذمة وموقف ضريبي رسمي (نموذج 7)',
    category: 'form',
    version: 'الإصدار 2025',
    sizeKb: 195,
    mimeType: 'application/pdf',
    publishedAt: '2026/01/12',
    fileUrl: '#',
  },
  {
    id: 'form-6',
    title: 'استمارة تقديم طعن واعتراض أمام لجنة الطعون الضريبية (نموذج 11)',
    category: 'form',
    version: 'الإصدار 2025',
    sizeKb: 310,
    mimeType: 'application/pdf',
    publishedAt: '2026/01/20',
    fileUrl: '#',
  },
];

export default async function FormsPage() {
  const apiForms = await publicApi.getLibraryDocuments('form');
  const forms = apiForms.length > 0 ? apiForms : FALLBACK_FORMS;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--usr-bg)] selection:bg-[var(--usr-gold)] selection:text-white">
      <PublicHeader />

      {/* Hero Header */}
      <section className="usr-page-header text-center py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-3">
          <Badge variant="gold" className="px-3 py-1 font-bold text-xs">المكتبة الرقمية</Badge>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-display text-white">
            النماذج والإقرارات الضريبية الرسمية
          </h1>
          <p className="text-xs sm:text-base text-slate-200 font-light max-w-2xl mx-auto">
            تحميل وتنزيل كافة الاستمارات والإقرارات المعتمدة بصيغة PDF القابلة للتعبئة والطباعة المباشرة
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 sm:space-y-10 w-full">
        {/* Info Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4 border-r-4 border-r-[var(--usr-gold)]">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon size={24} className="text-[var(--usr-gold-dark)] shrink-0" />
            <p className="text-xs sm:text-sm text-slate-700 font-medium">
              يرجى التأكد من تعبئة كافة الحقول الإلزامية وإرفاق المستندات المؤيدة قبل تقديم النموذج إلى صالة خدمة المكلفين.
            </p>
          </div>
        </div>

        {/* 1. Mobile Cards View (sm and down) */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-base font-display text-[var(--usr-primary-dark)]">
              النماذج والإقرارات المعتمدة ({forms.length})
            </h3>
            <Badge variant="gold" className="text-[10px]">معتمد رسمياً</Badge>
          </div>

          <div className="space-y-3.5">
            {forms.map((f) => (
              <div
                key={f.id}
                className="usr-feature-card-lite p-5 space-y-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--usr-primary-soft)] text-[var(--usr-primary)] flex items-center justify-center font-bold shrink-0">
                      <FileTextIcon size={18} />
                    </div>
                    <span className="font-mono text-xs font-bold text-[var(--usr-primary-dark)]">
                      {f.version || 'نموذج رسمي'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--usr-muted)] bg-slate-100 px-2 py-0.5 rounded-md">
                    {f.sizeKb} KB
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                  {f.title}
                </h4>

                <div className="pt-2 border-t border-slate-100">
                  <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button variant="gold" size="sm" className="w-full gap-2 font-bold justify-center rounded-xl text-xs py-2.5 shadow-xs">
                      <DownloadIcon size={14} />
                      <span>تحميل النموذج PDF</span>
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Desktop/Tablet Table View */}
        <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg font-display text-[var(--usr-primary-dark)]">
              قائمة النماذج والإقرارات المعتمدة
            </h3>
            <Badge variant="outline" className="font-mono">{forms.length} نماذج رسمية</Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-bold text-slate-700 py-4">رقم وإصدار النموذج</TableHead>
                  <TableHead className="font-bold text-slate-700">اسم الاستمارة / الإقرار</TableHead>
                  <TableHead className="font-bold text-slate-700">التصنيف</TableHead>
                  <TableHead className="font-bold text-slate-700">الحجم</TableHead>
                  <TableHead className="font-bold text-slate-700 text-center">التحميل المباشر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((f) => (
                  <TableRow key={f.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="font-bold text-[var(--usr-primary-dark)] flex items-center gap-2.5 py-4">
                      <div className="w-8 h-8 rounded-lg bg-[var(--usr-primary-soft)] text-[var(--usr-primary)] flex items-center justify-center font-bold shrink-0">
                        <FileTextIcon size={16} />
                      </div>
                      <span className="font-mono text-xs">{f.version || 'نموذج معتمد'}</span>
                    </TableCell>
                    <TableCell className="font-semibold text-sm text-slate-800">
                      {f.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="gold" className="text-[11px]">معتمد رسمياً</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--usr-muted)] font-mono">
                      {f.sizeKb} KB
                    </TableCell>
                    <TableCell className="text-center">
                      <a href={f.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="gold" size="sm" className="gap-1.5 font-bold rounded-xl text-xs py-1.5 px-3.5 shadow-sm">
                          <DownloadIcon size={14} />
                          <span>تحميل PDF</span>
                        </Button>
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
