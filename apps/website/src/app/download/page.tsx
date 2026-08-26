import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  SmartphoneIcon,
  DownloadIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  SearchIcon,
  BellIcon,
  QrCodeIcon,
  MessageSquareIcon,
} from '@marib-tax/web-ui';

const APP_FEATURES = [
  {
    title: 'استعلام فوري عن المستحقات',
    desc: 'معرفة الموقف الضريبي وحالة الربط والتحصيل فورياً برقمك الضريبي الموحد.',
    icon: SearchIcon,
  },
  {
    title: 'إشعارات وتنبيهات مباشرة',
    desc: 'استلام تنبيهات بمواعيد تقديم الإقرارات السنوية وحالة المعاملات المقدمة.',
    icon: BellIcon,
  },
  {
    title: 'التحقق من صحة الشهادات QR',
    desc: 'مسح رموز الاستجابة السريعة (QR) للتحقق من مصداقية البطاقات وبراءات الذمة.',
    icon: QrCodeIcon,
  },
  {
    title: 'تواصل وبلاغات سريعة',
    desc: 'إرسال الاستفسارات والملاحظات وإرفاق الوثائق إلى إدارة خدمة المكلفين.',
    icon: MessageSquareIcon,
  },
];

const INSTALL_STEPS = [
  'قم بتحميل ملف التطبيق APK المعتمد من الزر أدناه.',
  'عند انتهاء التحميل، افتح الملف واضغط على "تثبيت" (قد يتطلب السماح بتثبيت التطبيقات من هذا المصدر).',
  'افتح التطبيق وسجل الدخول برقمك الضريبي ورقم الهاتف المسجل لدى مكتب ضرائب مأرب.',
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--usr-bg)] selection:bg-[var(--usr-gold)] selection:text-white">
      <PublicHeader />

      {/* Hero Header */}
      <section className="usr-page-header text-center py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-3">
          <Badge variant="gold" className="px-3 py-1 font-bold text-xs">الخدمات الذاتية للمكلفين</Badge>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-display text-white">
            تطبيق الجوال لضرائب مأرب للهواتف الذكية
          </h1>
          <p className="text-xs sm:text-base text-slate-200 font-light max-w-2xl mx-auto">
            منظومة المكلفين المحمولة لمتابعة كافة المعاملات واستلام الإشعارات الرسمية لحظة بلحظة
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10 sm:space-y-12 w-full">
        {/* Main App Showcase Card */}
        <div className="rounded-3xl bg-gradient-to-r from-[var(--usr-primary-deeper)] via-[var(--usr-primary-dark)] to-[var(--usr-primary)] p-6 sm:p-10 lg:p-12 text-white border-2 border-[var(--usr-gold)]/50 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl space-y-5 sm:space-y-6 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[var(--usr-gold)] text-[var(--usr-primary-deeper)] flex items-center justify-center font-bold shadow-lg border border-amber-300 shrink-0">
                <SmartphoneIcon size={28} />
              </div>
              <div>
                <h2 className="text-xl sm:text-3xl font-bold font-display text-white">
                  تطبيق الجوال للمكلفين — فرع مأرب (v1.0.4)
                </h2>
                <p className="text-xs text-[var(--usr-gold-soft)] font-mono">الإصدار الرسمي المعتمد • متوافق مع Android 8.0+</p>
              </div>
            </div>

            <p className="text-xs sm:text-base text-slate-200 leading-relaxed font-light">
              صُمم التطبيق ليوفر للمكلفين وأصحاب الأعمال منصة سهلة وآمنة لمتابعة كافة الالتزامات الضريبية والتحقق من صحة الوثائق واستلام الإشعارات المباشرة دون الحاجة لزيارة المكتب إلا للضرورة.
            </p>

            <div className="pt-2 flex flex-wrap gap-3 sm:gap-4 items-center">
              <a href="#" download className="w-full sm:w-auto inline-block">
                <Button variant="gold" size="lg" className="w-full sm:w-auto font-bold shadow-xl gap-2 rounded-xl text-xs sm:text-sm px-6 py-3 justify-center">
                  <DownloadIcon size={18} />
                  <span>تنزيل مباشر ملف APK (Android)</span>
                </Button>
              </a>
              <span className="text-xs text-slate-300 font-mono">الحجم: ~ 24 MB • مجاني</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <section className="space-y-6">
          <div className="border-r-4 border-[var(--usr-gold)] pr-3 sm:pr-4">
            <h3 className="text-xl sm:text-3xl font-bold font-display text-[var(--usr-primary-dark)]">
              أبرز مزايا تطبيق الجوال
            </h3>
            <p className="text-xs sm:text-sm text-[var(--usr-muted)] mt-1">
              خدمات وتسهيلات رقمية متكاملة في متناول يدك
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {APP_FEATURES.map((feat, idx) => {
              const FeatIcon = feat.icon;
              return (
                <Card key={idx} className="usr-institutional-card p-5 sm:p-6 space-y-3 rounded-2xl bg-white border border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] flex items-center justify-center font-bold shadow-xs">
                    <FeatIcon size={20} className="text-[var(--usr-primary)]" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[var(--usr-primary-dark)] font-display">{feat.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-light">{feat.desc}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Installation Guide */}
        <div className="usr-feature-card-lite p-6 sm:p-8 space-y-4 rounded-3xl bg-white border border-slate-200 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] flex items-center justify-center font-bold">
              <ShieldCheckIcon size={18} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-display text-[var(--usr-primary-dark)]">
              طريقة التثبيت والاستخدام
            </h3>
          </div>
          <ol className="space-y-3 text-xs sm:text-sm text-slate-700 font-light pr-1">
            {INSTALL_STEPS.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
