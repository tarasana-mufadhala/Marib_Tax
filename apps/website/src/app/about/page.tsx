import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  BuildingIcon,
  Building2Icon,
  LaptopIcon,
  HandshakeIcon,
  TrendingUpIcon,
  TargetIcon,
  ScrollTextIcon,
} from '@marib-tax/web-ui';
import { publicApi } from '@/lib/api-client';

const DEFAULT_ABOUT = [
  'يعد مكتب الضرائب بمحافظة مأرب الجهاز الإداري المالي والرقابي الأول المعني بإدارة وتحصيل الضرائب القانونية وتنظيم العلاقات الضريبية مع الأنشطة التجارية والشركات الاستثمارية والخدمية في نطاق المحافظة.',
  'شهد المكتب خلال السنوات الأخيرة تطوراً نوعياً في التحول الرقمي وحوسبة المعاملات وتسهيل إجراءات القيد والربط والتحصيل لدعم الاقتصاد المحلي وتعزيز التنمية المستدامة في محافظة مأرب.',
  'يعمل المكتب بالتعاون مع السلطة المحلية ومصلحة الضرائب على إرساء مبادئ العدالة الضريبية وبناء جسور الثقة والشراكة مع مجتمع الأعمال والمكلفين.',
];

const STRATEGIC_GOALS = [
  {
    title: 'التحول الرقمي الشامل والأتمتة',
    desc: 'حوسبة كافة المعاملات الضريبية من القيد والربط إلى التحصيل وإصدار الشهادات وبراءات الذمة إلكترونياً.',
    icon: LaptopIcon,
  },
  {
    title: 'تعزيز الامتثال الطوعي والشفافية',
    desc: 'توفير التوعية القانونية والإرشادية المستمرة وتبسيط الإجراءات لتمكين المكلفين من أداء واجباتهم بسهولة.',
    icon: HandshakeIcon,
  },
  {
    title: 'تنمية الموارد ودعم التنمية المحلية',
    desc: 'رفع كفاءة التحصيل الضريبي وتوسيع الوعاء الضريبي بعدالة لدعم المشاريع والخدمات العامة بالمحافظة.',
    icon: TrendingUpIcon,
  },
  {
    title: 'تطوير الكوادر والرقابة الإدارية',
    desc: 'تأهيل موظفي المكتب ولجان الفحص الميداني وفق أحدث المعايير المهنية لضمان النزاهة وجودة الأداء.',
    icon: Building2Icon,
  },
];

export default async function AboutPage() {
  const aboutPage = await publicApi.getContentPage('about');
  const paragraphs = aboutPage?.body?.trim()
    ? aboutPage.body.split('\n').filter((line) => line.trim())
    : DEFAULT_ABOUT;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--usr-bg)] selection:bg-[var(--usr-gold)] selection:text-white">
      <PublicHeader />

      {/* Page Hero Header */}
      <section className="usr-page-header text-center py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-3">
          <Badge variant="gold" className="px-3 py-1 font-bold text-xs">الهوية والرسالة</Badge>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-display text-white">
            عن مكتب الضرائب بمحافظة مأرب
          </h1>
          <p className="text-xs sm:text-base text-slate-200 font-light max-w-2xl mx-auto">
            الرؤية والرسالة والأهداف الاستراتيجية ومسيرة التحول الرقمي لدعم الاستقرار المالي والاقتصادي في المحافظة
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10 sm:space-y-12 w-full">
        {/* Overview Section */}
        <Card className="usr-institutional-card p-5 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <CardHeader className="p-0 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[var(--usr-primary-soft)] text-[var(--usr-primary)] flex items-center justify-center font-bold shrink-0">
                <BuildingIcon size={24} />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-display text-[var(--usr-primary-dark)]">
                  {aboutPage?.title || 'نبذة تأسيسية ونظرة عامة'}
                </CardTitle>
                <p className="text-xs text-[var(--usr-muted)] mt-0.5">مصلحة الضرائب — الجمهورية اليمنية</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-5 space-y-3.5 text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed font-light">
            {paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </CardContent>
        </Card>

        {/* Vision & Mission Split Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
          <div className="usr-feature-card-lite p-6 sm:p-8 space-y-3.5 rounded-3xl bg-white border border-slate-200 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] flex items-center justify-center font-bold shrink-0 shadow-xs">
                <TargetIcon size={24} className="text-[var(--usr-primary)]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-[var(--usr-primary-dark)]">
                الرؤية الإستراتيجية
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light">
              أن نكون الإدارة الضريبية النموذجية الرائدة في استخدام التقنيات الحديثة، وتحقيق أعلى معدلات الامتثال الطوعي، وبناء بيئة استثمارية واعدة ومستدامة بمحافظة مأرب.
            </p>
          </div>

          <div className="usr-feature-card-lite p-6 sm:p-8 space-y-3.5 rounded-3xl bg-white border border-slate-200 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] flex items-center justify-center font-bold shrink-0 shadow-xs">
                <ScrollTextIcon size={24} className="text-[var(--usr-gold-dark)]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-[var(--usr-primary-dark)]">
                الرسالة المؤسسية
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light">
              تحصيل الموارد الضريبية العامة بكفاءة وشفافية وعدالة وفقاً للقوانين واللوائح النافذة، وتقديم خدمات ذكية ومبسطة للمكلفين تسهم في تعزيز الثقة وتحفيز الاقتصاد الوطني.
            </p>
          </div>
        </div>

        {/* Strategic Goals Grid */}
        <section className="space-y-6">
          <div className="border-r-4 border-[var(--usr-gold)] pr-3 sm:pr-4">
            <h2 className="text-xl sm:text-3xl font-bold font-display text-[var(--usr-primary-dark)]">
              الأهداف الاستراتيجية للمكتب
            </h2>
            <p className="text-xs sm:text-sm text-[var(--usr-muted)] mt-1">
              الركائز الأساسية التي نعمل وفقها لتطوير المنظومة الضريبية في محافظة مأرب
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STRATEGIC_GOALS.map((goal, idx) => {
              const GoalIcon = goal.icon;
              return (
                <Card key={idx} className="usr-institutional-card p-5 sm:p-6 space-y-3 rounded-2xl bg-white border border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] flex items-center justify-center font-bold shadow-xs">
                    <GoalIcon size={20} className="text-[var(--usr-primary)]" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[var(--usr-primary-dark)] font-display">{goal.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-light">{goal.desc}</p>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
