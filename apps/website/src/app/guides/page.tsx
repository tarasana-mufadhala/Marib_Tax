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
  FileTextIcon,
  DownloadIcon,
  HelpCircleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  BarChartIcon,
  ClockIcon,
  BuildingIcon,
  LightbulbIcon,
} from '@marib-tax/web-ui';
import { publicApi } from '@/lib/api-client';
import type { PublicLibraryDocument } from '@/lib/api-client';

const DEFAULT_GUIDES: PublicLibraryDocument[] = [
  {
    id: 'guide-1',
    title: 'دليل المكلف المبتدئ — خطوات تأسيس النشاط واستخراج البطاقة الضريبية',
    category: 'guide',
    version: 'دليل توعوي 2025',
    sizeKb: 450,
    mimeType: 'application/pdf',
    publishedAt: '2026/01/01',
    fileUrl: '#',
  },
  {
    id: 'guide-2',
    title: 'الدليل الإرشادي لكيفية تعبئة إقرار ضريبة الأرباح التجارية السنوي',
    category: 'guide',
    version: 'دليل رقم 02',
    sizeKb: 620,
    mimeType: 'application/pdf',
    publishedAt: '2026/01/10',
    fileUrl: '#',
  },
  {
    id: 'guide-3',
    title: 'حقوق وواجبات المكلف في النظام الضريبي اليمني — شرح مبسط',
    category: 'guide',
    version: 'سلسلة التوعية الضريبية',
    sizeKb: 380,
    mimeType: 'application/pdf',
    publishedAt: '2025/12/20',
    fileUrl: '#',
  },
];

const TAX_TIPS = [
  {
    title: 'الاحتفاظ بالسجلات المحاسبية والفواتير',
    desc: 'احرص على توثيق كافة فواتير المشتريات والمبيعات ومصروفات التشغيل المعتمدة، حيث تسهم في احتساب وعاء ضريبي عادل وتجنب التقدير الجزافي.',
    icon: BarChartIcon,
  },
  {
    title: 'الالتزام بمواعيد تقديم الإقرارات',
    desc: 'تقديم الإقرار في الموعد القانوني الممتد من 1 يناير إلى 30 أبريل يعفيك من غرامات التأخير ويمنحك أولوية في الحصول على التسهيلات وبراءات الذمة.',
    icon: ClockIcon,
  },
  {
    title: 'تحديث بيانات المنشأة أولاً بأول',
    desc: 'في حال تغيير موقع المنشأة، الشركاء، أو نوع النشاط التجاري، يرجى إخطار مكتب الضرائب لتعديل بياناتك الرسمية وتجنب الإشكاليات الرقابية.',
    icon: BuildingIcon,
  },
  {
    title: 'الاستفادة من القنوات الرقمية الرسمية',
    desc: 'تجنب التعامل مع الوسطاء غير المعتمدين واعتمد على البوابة الإلكترونية وتطبيق المكلفين أو صالة خدمة الجمهور بالفرع الرسمي.',
    icon: ShieldCheckIcon,
  },
];

export default async function GuidesPage() {
  const [guidelinesPage, infoCenterPage, apiGuides] = await Promise.all([
    publicApi.getContentPage('guidelines'),
    publicApi.getContentPage('info-center'),
    publicApi.getLibraryDocuments('guide'),
  ]);

  const guides = apiGuides.length > 0 ? apiGuides : DEFAULT_GUIDES;
  const contentPages = [guidelinesPage, infoCenterPage].filter((p) => p !== null && p.body?.trim());

  return (
    <div className="min-h-screen flex flex-col bg-[var(--usr-bg)] selection:bg-[var(--usr-gold)] selection:text-white">
      <PublicHeader />

      {/* Hero Header */}
      <section className="usr-page-header text-center py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-3">
          <Badge variant="gold" className="px-3 py-1 font-bold text-xs">التوعية والتثقيف</Badge>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-display text-white">
            الإرشادات التوعوية والتثقيف الضريبي
          </h1>
          <p className="text-xs sm:text-base text-slate-200 font-light max-w-2xl mx-auto">
            أدلة إرشادية مبسطة ومواد تثقيفية لمساعدة المكلفين على معرفة حقوقهم وواجباتهم ورفع مستوى الامتثال الطوعي
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10 sm:space-y-12 w-full">
        {/* Tax Tips Grid */}
        <section className="space-y-6">
          <div className="border-r-4 border-[var(--usr-gold)] pr-3 sm:pr-4">
            <h2 className="text-xl sm:text-3xl font-bold font-display text-[var(--usr-primary-dark)]">
              إرشادات هامة لتعزيز الامتثال الضريبي
            </h2>
            <p className="text-xs sm:text-sm text-[var(--usr-muted)] mt-1">
              نصائح وتوجيهات عملية لأصحاب المنشآت والأنشطة التجارية في محافظة مأرب
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {TAX_TIPS.map((tip, idx) => {
              const TipIcon = tip.icon;
              return (
                <Card key={idx} className="usr-institutional-card p-5 sm:p-6 space-y-3 rounded-2xl bg-white border border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] flex items-center justify-center font-bold shadow-xs">
                    <TipIcon size={20} className="text-[var(--usr-primary)]" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[var(--usr-primary-dark)] font-display">{tip.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-light">{tip.desc}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Content Pages (if available from API) */}
        {contentPages.map((page) => (
          <Card key={page!.key} className="usr-institutional-card p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl">
            <CardHeader className="p-0 pb-4 border-b border-slate-100">
              <CardTitle className="text-xl sm:text-2xl font-display text-[var(--usr-primary-dark)]">
                {page!.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-5 space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-light">
              {page!.body.split('\n').filter((line) => line.trim()).map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Downloadable Guides Grid */}
        <section className="space-y-6">
          <div className="border-r-4 border-[var(--usr-gold)] pr-3 sm:pr-4">
            <h2 className="text-xl sm:text-3xl font-bold font-display text-[var(--usr-primary-dark)]">
              الأدلة والمطبوعات التوعوية للتحميل
            </h2>
            <p className="text-xs sm:text-sm text-[var(--usr-muted)] mt-1">
              كتيبات إرشادية بصيغة PDF معدة من قبل إدارة التوعية والإعلام الضريبي
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            {guides.map((g) => (
              <div
                key={g.id}
                className="usr-feature-card-lite flex flex-col justify-between rounded-3xl p-5 sm:p-7 border border-slate-200/90 bg-white"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] flex items-center justify-center font-bold">
                      <LightbulbIcon size={22} className="text-[var(--usr-gold-dark)]" />
                    </div>
                    <Badge variant="gold" className="text-[11px]">{g.version || 'دليل إرشادي'}</Badge>
                  </div>

                  <h3 className="font-bold text-base sm:text-lg font-display text-[var(--usr-primary-dark)] leading-snug">
                    {g.title}
                  </h3>

                  <p className="text-xs text-[var(--usr-muted)] leading-relaxed font-light">
                    شرح وافٍ وتفصيلي بالإجراءات والخطوات العملية لخدمة المكلفين.
                  </p>

                  <div className="p-3 rounded-2xl bg-[var(--usr-bg)] border border-[var(--usr-border)]/60 text-xs flex items-center justify-between text-slate-600 font-mono">
                    <span>حجم الملف:</span>
                    <strong className="text-[var(--usr-primary)]">{g.sizeKb} KB</strong>
                  </div>
                </div>

                <div className="pt-4 mt-5 border-t border-slate-100">
                  <a href={g.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="w-full gap-2 font-bold justify-center rounded-xl text-xs py-2">
                      <DownloadIcon size={14} />
                      <span>تحميل الدليل PDF</span>
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
