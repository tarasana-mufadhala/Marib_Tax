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
  ClockIcon,
  DollarIcon,
  ShieldCheckIcon,
  InboxIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@marib-tax/web-ui';
import { publicApi } from '@/lib/api-client';
import type { TaxService } from '@/lib/api-client';
import { getServiceVectorIcon } from '@/lib/icon-helper';
import { ADMIN_LOGIN_URL } from '@/lib/app-urls';

const FALLBACK_SERVICES: TaxService[] = [
  {
    id: 'srv-1',
    title: 'إصدار وتجديد البطاقة الضريبية',
    description: 'إجراءات منح الرقم الضريبي الموحد للمنشآت والشركات وإصدار وتجديد البطاقة الضريبية السنوية لمزاولة النشاط.',
    category: 'تسجيل وقيد',
    requiredDocuments: ['أصل وصورة السجل التجاري ساري المفعول', 'عقد الإيجار أو وثيقة ملكية العقار', 'الهوية الوطنية لصاحب المنشأة أو المفوض', 'استمارة طلب القيد والتسجيل (نموذج 1)'],
    processingDays: 2,
    fees: 'رسوم البطاقة الرسمية المقررة',
    icon: 'بطاقة ضريبية',
  },
  {
    id: 'srv-2',
    title: 'استلام وفحص الإقرارات السنوية للأرباح',
    description: 'استقبال الإقرارات الضريبية السنوية لضريبة الأرباح التجارية والصناعية وفق النظامين الدفتري والتقديري وتحديد الوعاء.',
    category: 'إقرارات وربط',
    requiredDocuments: ['استمارة الإقرار الضريبي المعتمدة', 'القوائم المالية والحسابات الختامية (لكبار ومتوسطي المكلفين)', 'كشف حركة المبيعات والمشتريات السنوية'],
    processingDays: 3,
    fees: 'مجانية تقديم الإقرار في الموعد المحدد',
    icon: 'إقرار سنوي',
  },
  {
    id: 'srv-3',
    title: 'إصدار شهادات الموقف الضريبي وبراءة الذمة',
    description: 'استخراج شهادة رسمية تثبت خلو طرف المكلف وسداده لكافة المستحقات والالتزامات الضريبية حتى تاريخه.',
    category: 'شهادات وبراءات',
    requiredDocuments: ['سداد كامل الضرائب المستحقة والغرامات إن وجدت', 'أصل البطاقة الضريبية السارية', 'طلب خطي موجه لمدير فرع الضرائب بمأرب'],
    processingDays: 1,
    fees: 'رسوم دمغة الشهادة الرسمية',
    icon: 'براءة ذمة',
  },
  {
    id: 'srv-4',
    title: 'ضريبة العقارات المبنية وريع الإيجارات',
    description: 'حصر وتقييم العقارات المستغلة بالإيجار وربط الضريبة المستحقة على ريع العقار وتوثيق السجلات.',
    category: 'إقرارات وربط',
    requiredDocuments: ['صك الملكية أو البصيرة الشرعية للعقار', 'عقود الإيجار المبرمة مع المستأجرين', 'صورة البطاقة الشخصية لمالك العقار'],
    processingDays: 4,
    fees: 'نسبة قانونية محددة وفق القانون',
    icon: 'ضرائب عقارية',
  },
  {
    id: 'srv-5',
    title: 'ضريبة المرتبات والأجور (كسب العمل)',
    description: 'استقطاع وتوريد الضريبة المستحقة على مرتبات ومكافآت العاملين والموظفين في القطاع الخاص والشركات.',
    category: 'إقرارات وربط',
    requiredDocuments: ['كشف المرتبات والأجور الشهري المعتمد', 'استمارة التوريد الشهري للضريبة', 'بيانات الكادر الوظيفي للمنشأة'],
    processingDays: 1,
    fees: 'نسب تصاعدية قانونية محددة',
    icon: 'ضريبة دخل',
  },
  {
    id: 'srv-6',
    title: 'الاعتراضات والطعون الضريبية',
    description: 'حق المكلف في تقديم طعن أو اعتراض مسبب على قرارات الربط التقديري وإعادة النظر عبر لجان الطعن المختصة.',
    category: 'اعتراضات وشكاوى',
    requiredDocuments: ['مذكرة الاعتراض المسببة مدعمة بالمستندات', 'صورة إشعار الربط المعترض عليه', 'سداد نسبة التأمين القانوني للطعن'],
    processingDays: 10,
    fees: 'مجانية النظر في الطعن مع استيفاء الشروط',
    icon: 'طعن ضريبي',
  },
];

export default async function ServicesPage() {
  const apiServices = await publicApi.getServices();
  const services = apiServices.length > 0 ? apiServices : FALLBACK_SERVICES;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--usr-bg)] selection:bg-[var(--usr-gold)] selection:text-white">
      <PublicHeader />

      {/* Hero Header */}
      <section className="usr-page-header text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-3">
          <Badge variant="gold" className="px-3 py-1 font-bold">دليل المكلفين</Badge>
          <h1 className="text-3xl sm:text-5xl font-bold font-display text-white">
            دليل الخدمات والمعاملات الضريبية
          </h1>
          <p className="text-sm sm:text-base text-slate-200 font-light max-w-2xl mx-auto">
            شرح تفصيلي لكافة المعاملات والشروط والمستندات المطلوبة والمدد الزمنية المحددة لإنجاز كل خدمة لدى مكتب مأرب
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-14 space-y-10 w-full">
        {/* Intro notice banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border-r-4 border-[var(--usr-gold)] border-y border-l border-slate-200 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon size={24} className="text-[var(--usr-gold-dark)] shrink-0" />
            <p className="text-xs sm:text-sm text-slate-700 font-medium">
              كافة المعاملات تدار وفق لوائح مصلحة الضرائب بالجمهورية اليمنية، ويمكن التقديم عليها مباشرة عبر صالة خدمة المكلفين بالفرع أو عبر المنظومة الرقمية.
            </p>
          </div>
          <a href={ADMIN_LOGIN_URL} target="_blank" rel="noopener noreferrer" className="shrink-0 hidden sm:inline-block">
            <Button variant="gold" size="sm" className="font-bold">
              دخول البوابة
            </Button>
          </a>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((srv, idx) => {
            const fallback = FALLBACK_SERVICES[idx % FALLBACK_SERVICES.length];
            const docs = srv.requiredDocuments?.length ? srv.requiredDocuments : fallback.requiredDocuments;
            const days = srv.processingDays > 0 ? srv.processingDays : fallback.processingDays;
            const fees = srv.fees || fallback.fees;

            return (
              <div
                key={srv.id}
                className="usr-feature-card-lite flex flex-col justify-between rounded-3xl p-6 sm:p-7 border border-slate-200/90 bg-white"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200 shadow-2xs">
                      {getServiceVectorIcon(srv.category, srv.title, 24)}
                    </div>
                    <Badge variant="gold">{srv.category || 'خدمة معتمدة'}</Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg font-display text-[var(--usr-primary-dark)] leading-snug">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-[var(--usr-muted)] mt-1.5 leading-relaxed font-light">
                      {srv.description}
                    </p>
                  </div>

                  {/* Requirements List */}
                  {docs && docs.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircleIcon size={14} className="text-emerald-600" />
                        <span>المستندات والشروط المطلوبة:</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-600 font-light pr-2">
                        {docs.map((doc, docIdx) => (
                          <li key={docIdx} className="flex items-start gap-1.5">
                            <span className="text-[var(--usr-gold)] font-bold">›</span>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Processing info box */}
                  <div className="text-xs space-y-1.5 p-3 rounded-2xl bg-[var(--usr-bg)] border border-[var(--usr-border)]/60">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <ClockIcon size={13} />
                        <span>مدة الإنجاز:</span>
                      </span>
                      <span className="text-[var(--usr-primary)] font-bold">{days} أيام عمل</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <DollarIcon size={13} />
                        <span>الرسوم المقررة:</span>
                      </span>
                      <span className="text-[var(--usr-gold-dark)] font-bold">{fees}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-slate-100 flex items-center gap-3">
                  <a
                    href={ADMIN_LOGIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="primary" size="sm" className="w-full font-bold justify-center rounded-xl text-xs gap-1.5">
                      <span>تقديم طلب عبر البوابة</span>
                      <ArrowLeftIcon size={14} />
                    </Button>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
