'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Calculator } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  FileTextIcon,
  ClockIcon,
  DollarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  BarChartIcon,
  UsersIcon,
  InboxIcon,
  SearchIcon,
  CalendarIcon,
  HelpCircleIcon,
  ScaleIcon,
  SmartphoneIcon,
  ChevronDownIcon,
} from '@marib-tax/web-ui';
import { publicApi } from '@/lib/api-client';
import type { Announcement, TaxService, PublicFaq, PublicStats } from '@/lib/api-client';
import { getServiceVectorIcon } from '@/lib/icon-helper';

const springTransition = { type: 'spring' as const, stiffness: 120, damping: 18 };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: springTransition },
};

const SEED_SERVICES: TaxService[] = [
  {
    id: 'srv-1',
    title: 'إصدار وتجديد البطاقة الضريبية',
    description: 'تسجيل المكلف الجديد وإصدار الرقم الضريبي الموحد وتجديد البطاقة السنوية لمزاولة النشاط.',
    category: 'تسجيل وقيد',
    requiredDocuments: ['صورة السجل التجاري', 'عقد الإيجار أو الملكية', 'الهوية الوطنية', 'استمارة القيد (نموذج 1)'],
    processingDays: 2,
    fees: 'رسوم قانونية محددة',
    icon: 'card',
  },
  {
    id: 'srv-2',
    title: 'تقديم الإقرار الضريبي السنوي للأرباح',
    description: 'استلام وفحص الإقرارات السنوية لضريبة الأرباح التجارية والصناعية للمنشآت والشركات.',
    category: 'إقرارات وربط',
    requiredDocuments: ['القوائم المالية المدققة', 'كشف حركة المبيعات', 'استمارة الإقرار الضريبي'],
    processingDays: 3,
    fees: 'مجانية لتقديم الإقرار',
    icon: 'declaration',
  },
  {
    id: 'srv-3',
    title: 'شهادة إبراء الذمة وبراءة الذمة الضريبية',
    description: 'إصدار شهادات الموقف الضريبي للمنشآت والشركات للتقديم على المناقصات وتجديد التراخيص.',
    category: 'شهادات وبراءات',
    requiredDocuments: ['سداد المستحقات حتى تاريخ الطلب', 'آخر بطاقة ضريبية سارية', 'طلب خطي رسمي'],
    processingDays: 1,
    fees: 'رسوم الشهادة الرسمية',
    icon: 'clearance',
  },
  {
    id: 'srv-4',
    title: 'ضريبة العقارات المبنية وريع الإيجارات',
    description: 'حصر وتقييم العقارات المستغلة بالإيجار وتحديد ضريبة ريع العقارات للمؤجرين والمستثمرين.',
    category: 'إقرارات وربط',
    requiredDocuments: ['صك الملكية أو البصيرة', 'عقود الإيجار المبرمة', 'صورة هوية المالك'],
    processingDays: 4,
    fees: 'نسبة قانونية محددة',
    icon: 'real-estate',
  },
];

const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'بدء موسم تقديم الإقرارات الضريبية السنوية لعام 2025 للمكلفين بمحافظة مأرب',
    summary: 'يهيب مكتب الضرائب بكافة المكلفين من أصحاب المنشآت والشركات سرعة تقديم إقراراتهم الضريبية تجنباً للغرامات التأخيرية وفق القانون النافذ.',
    category: 'إعلان مهم',
    date: '2026/02/01',
    isImportant: true,
  },
  {
    id: 'ann-2',
    title: 'تعميم بشأن تفعيل الدفع الإلكتروني واستخراج براءات الذمة الفورية',
    summary: 'إطلاق خدمة الربط البنكي المباشر لسداد الضرائب المستحقة وتسهيل استلام الإشعارات المعتمدة عبر المنظومة الرقمية.',
    category: 'تعميم ضريبي',
    date: '2026/01/15',
    isImportant: false,
  },
  {
    id: 'ann-3',
    title: 'جدول مواعيد النزول الميداني للجان الحصر الضريبي في مديريات مأرب',
    summary: 'إعلان خطة المسح الميداني والحصر الشامل للأنشطة التجارية في المربع التجاري الأول والشارع العام.',
    category: 'تنبيه امتثال',
    date: '2026/01/05',
    isImportant: false,
  },
];

const SEED_FAQS: PublicFaq[] = [
  {
    id: 'faq-1',
    question: 'كيف يمكنني استخراج بطاقة ضريبية جديدة لأول مرة في مأرب؟',
    answer: 'يمكنك استخراج البطاقة الضريبية بتقديم صورة السجل التجاري وعقد الإيجار/الملكية للمنشأة وصورة البطاقة الشخصية، وتعبئة استمارة طلب القيد (نموذج 1) لدى صالة خدمة المكلفين بالمكتب أو عبر البوابة.',
    category: 'عام',
    displayOrder: 1,
  },
  {
    id: 'faq-2',
    question: 'ما هي مواعيد تقديم الإقرارات الضريبية السنوية؟',
    answer: 'تُقدم الإقرارات السنوية لضريبة الدخل والأرباح خلال الأشهر الأربعة الأولى من السنة المالية (من 1 يناير وحتى 30 أبريل) لكل سنة ضريبية وفقاً لأحكام قانون ضريبة الدخل.',
    category: 'إقرارات',
    displayOrder: 2,
  },
  {
    id: 'faq-3',
    question: 'هل يمكنني التحقق من صحة البطاقة أو الشهادة الضريبية إلكترونياً؟',
    answer: 'نعم، تحتوي كافة الشهادات والبطاقات الصادرة حديثاً على رمز QR مشفر يمكن مسحه للتأكد من سريان الوثيقة وحالتها المعتمدة لدى السجلات الرسمية.',
    category: 'شهادات',
    displayOrder: 3,
  },
  {
    id: 'faq-4',
    question: 'كيف يتم احتساب ضريبة المهن الحرة وغير التجارية؟',
    answer: 'تُحتسب ضريبة المهن الحرة وفقاً لصافي الإيراد السنوي المحقق بعد خصم النفقات والتكاليف والتنزيلات الشخصية المنصوص عليها قانوناً.',
    category: 'مهن حرة',
    displayOrder: 4,
  },
];

const TAX_DEADLINES = [
  {
    period: 'الربع الأول — حتى 30 أبريل',
    title: 'إقرارات ضريبة الأرباح التجارية والصناعية',
    type: 'شركات وأفراد',
    status: 'مفتوح للتقديم',
    badgeVariant: 'gold' as const,
  },
  {
    period: 'شهرياً — خلال 15 يوماً',
    title: 'توريد ضريبة المرتبات والأجور (كسب العمل)',
    type: 'جهات العمل والمؤسسات',
    status: 'دوري ومستمر',
    badgeVariant: 'default' as const,
  },
  {
    period: 'نهاية كل شهر ميلادي',
    title: 'إقرار وتوريد ضريبة المبيعات العامة',
    type: 'المكلفون المسجلون بالمبيعات',
    status: 'التزام شهري',
    badgeVariant: 'default' as const,
  },
  {
    period: 'خلال 30 يوماً من التبليغ',
    title: 'حق تقديم الطعن أو الاعتراض على الربط',
    type: 'لجنة الطعون الضريبية',
    status: 'مهلة قانونية',
    badgeVariant: 'outline' as const,
  },
];

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(SEED_ANNOUNCEMENTS);
  const [services, setServices] = useState<TaxService[]>(SEED_SERVICES);
  const [faqs, setFaqs] = useState<PublicFaq[]>(SEED_FAQS);
  const [stats, setStats] = useState<PublicStats>({ taxpayersCount: 0, servicesCount: 0, documentsCount: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Interactive Tax Estimator Widget State
  const [calcCategory, setCalcCategory] = useState<'commercial' | 'professional' | 'rental'>('commercial');
  const [calcRevenue, setCalcRevenue] = useState<string>('5000000');

  useEffect(() => {
    publicApi.getAnnouncements().then((rows) => {
      if (rows && rows.length > 0) setAnnouncements(rows);
    });

    publicApi.getServices().then((rows) => {
      if (rows && rows.length > 0) {
        const enriched = rows.map((r, idx) => ({
          ...r,
          requiredDocuments: r.requiredDocuments?.length ? r.requiredDocuments : SEED_SERVICES[idx % SEED_SERVICES.length].requiredDocuments,
          processingDays: r.processingDays > 0 ? r.processingDays : (idx + 2),
          fees: r.fees || 'وفق اللائحة المنظمة',
        }));
        setServices(enriched);
      }
    });

    publicApi.getFaqs().then((rows) => {
      if (rows && rows.length > 0) setFaqs(rows);
    });

    publicApi.getStats().then((data) => {
      if (data) setStats(data);
    });
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        srv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = activeCategory === 'الكل' || srv.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [services, searchQuery, activeCategory]);

  // Tax Calculation Result Logic
  const calcResult = useMemo(() => {
    const rev = parseFloat(calcRevenue) || 0;
    if (calcCategory === 'commercial') {
      const estimatedProfit = rev * 0.15; // 15% estimated profit margin
      const taxAmount = estimatedProfit * 0.17; // 17% tax rate on profit
      return {
        taxType: 'ضريبة الأرباح التجارية والصناعية',
        rateText: '17% من صافي الأرباح المقدرة',
        estimatedTax: Math.round(taxAmount),
        deadline: '30 أبريل من كل عام',
      };
    } else if (calcCategory === 'professional') {
      const taxAmount = rev * 0.10; // 10% tax rate on professional income
      return {
        taxType: 'ضريبة المهن الحرة غير التجارية',
        rateText: '10% من الإيراد السنوي الصافي',
        estimatedTax: Math.round(taxAmount),
        deadline: '30 أبريل من كل عام',
      };
    } else {
      const taxAmount = rev * 0.10; // 10% rental tax
      return {
        taxType: 'ضريبة ريع العقارات المؤجرة',
        rateText: '10% من إجمالي بدل الإيجار السنوي',
        estimatedTax: Math.round(taxAmount),
        deadline: 'شهرية / سنوية حسب العقد',
      };
    }
  }, [calcCategory, calcRevenue]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 overflow-x-hidden selection:bg-amber-500 selection:text-white">
      <PublicHeader />

      {/* ─── Hero Section with Deep Institutional Navy & Gold Accent Geometry ─── */}
      <section className="usr-hero-deep relative py-14 sm:py-20 lg:py-24 text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* Left Column (7 cols) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springTransition}
            className="lg:col-span-7 space-y-5 sm:space-y-6"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-sky-950 text-amber-300 text-xs font-bold border border-amber-500 shadow-md">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0"></span>
              <span className="truncate">الجمهورية اليمنية • مصلحة الضرائب بمحافظة مأرب</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-display leading-[1.2] text-white tracking-tight">
              البوابة الرقمية للخدمات والامتثال <br className="hidden sm:inline" />{' '}
              <span className="text-amber-400 drop-shadow-md whitespace-nowrap inline-block">
                الضريبي بمحافظة مأرب
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed max-w-2xl font-light">
              نضع بين يديك منظومة حكومية متكاملة لتقديم الإقرارات، استخراج براءات الذمة والبطاقات الضريبية، ومتابعة المعاملات بكل يسر وشفافية وفق القانون النافذ.
            </p>

            {/* Real-Time Search Bar */}
            <div className="pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative w-full max-w-xl"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="ابحث عن خدمة ضريبية، نموذج، أو قرار..."
                  aria-label="حقل البحث عن الخدمات والقرارات الضريبية"
                  className="w-full py-3.5 pr-11 pl-28 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium border-2 border-amber-500/80 shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-500/30 transition-all min-h-[50px]"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-900 pointer-events-none">
                  <SearchIcon size={20} />
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="مسح نص البحث"
                    className="absolute left-20 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1.5 py-1 cursor-pointer font-bold"
                  >
                    مسح
                  </button>
                )}
                <button
                  type="submit"
                  aria-label="تنفيذ البحث والمناداة"
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 font-bold rounded-xl py-2 px-4 text-xs shadow-xs bg-amber-600 text-white hover:bg-amber-700 cursor-pointer border border-amber-500"
                >
                  بحث
                </button>
              </form>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/services" className="w-full sm:w-auto">
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full sm:w-auto font-bold shadow-xl gap-2 active:scale-95 transition-all text-xs sm:text-sm px-6 py-3.5 rounded-xl justify-center bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <span>استكشف دليل الخدمات الكامل</span>
                  <ArrowLeftIcon size={16} />
                </Button>
              </Link>
              <Link href="/forms" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-slate-100 text-sky-950 font-bold gap-2 active:scale-95 transition-all text-xs sm:text-sm px-6 py-3.5 rounded-xl justify-center border border-white shadow-lg"
                >
                  <FileTextIcon size={16} />
                  <span>تحميل النماذج والإقرارات</span>
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right Column (5 cols): Quick Actions Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springTransition, delay: 0.12 }}
            className="lg:col-span-5"
          >
            <div className="usr-auth-card p-6 sm:p-7 bg-white text-slate-900 space-y-4 border-2 border-amber-500/50 shadow-2xl rounded-3xl relative overflow-hidden">
              <div className="border-b border-slate-100 pb-3.5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base sm:text-lg font-display text-sky-950">
                    الخدمات السريعة للمكلفين
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    الوصول الفوري للإجراءات والمعاملات الأكثر طلباً
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold shadow-xs shrink-0 border border-amber-200">
                  <ShieldCheckIcon size={22} />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <Link
                  href="/services"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-sky-50 transition-all border border-slate-200/80 group min-h-[48px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-900 flex items-center justify-center font-bold group-hover:bg-sky-900 group-hover:text-white transition-colors shrink-0">
                      <FileTextIcon size={16} />
                    </div>
                    <span className="font-bold text-slate-800 group-hover:text-sky-950 line-clamp-1">
                      إصدار وتجديد البطاقة الضريبية
                    </span>
                  </div>
                  <span className="text-amber-700 font-bold flex items-center gap-1 shrink-0">
                    ابدأ <ArrowLeftIcon size={13} />
                  </span>
                </Link>

                <Link
                  href="/forms"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-sky-50 transition-all border border-slate-200/80 group min-h-[48px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
                      <CalendarIcon size={16} />
                    </div>
                    <span className="font-bold text-slate-800 group-hover:text-sky-950 line-clamp-1">
                      تقديم الإقرار السنوي 2025/2026
                    </span>
                  </div>
                  <span className="text-amber-700 font-bold flex items-center gap-1 shrink-0">
                    النماذج <ArrowLeftIcon size={13} />
                  </span>
                </Link>

                <Link
                  href="/laws"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-sky-50 transition-all border border-slate-200/80 group min-h-[48px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-900 flex items-center justify-center font-bold shrink-0">
                      <ScaleIcon size={16} />
                    </div>
                    <span className="font-bold text-slate-800 group-hover:text-sky-950 line-clamp-1">
                      قانون ضريبة الدخل واللوائح التنفيذية
                    </span>
                  </div>
                  <span className="text-amber-700 font-bold flex items-center gap-1 shrink-0">
                    اطلاع <ArrowLeftIcon size={13} />
                  </span>
                </Link>

                <Link
                  href="/contact"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-sky-50 transition-all border border-slate-200/80 group min-h-[48px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold shrink-0">
                      <CheckCircleIcon size={16} />
                    </div>
                    <span className="font-bold text-slate-800 group-hover:text-sky-950 line-clamp-1">
                      تقديم استفسار أو بلاغ محمي للفرع
                    </span>
                  </div>
                  <span className="text-amber-700 font-bold flex items-center gap-1 shrink-0">
                    تواصل <ArrowLeftIcon size={13} />
                  </span>
                </Link>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950 to-sky-900 text-white text-xs flex items-center justify-between gap-2 shadow-sm border border-sky-800">
                <div>
                  <p className="font-bold text-amber-300">بوابة إدارة الضرائب</p>
                  <p className="text-[11px] text-slate-300">تسجيل الدخول لموظفي ولجان المكتب</p>
                </div>
                <a
                  href="http://localhost:3001/login"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="gold" size="sm" className="font-bold py-1.5 px-3.5 text-xs rounded-xl shadow-sm bg-amber-600 text-white hover:bg-amber-700">
                    دخول
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Impact Metrics Bento Grid ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="usr-institutional-card p-4 sm:p-6 text-center space-y-2 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-amber-500 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-900 mx-auto flex items-center justify-center border border-sky-100">
              <UsersIcon size={20} />
            </div>
            <p className="text-xl sm:text-3xl font-black text-sky-950 font-display">
              {stats.taxpayersCount > 0 ? `${stats.taxpayersCount}+` : '100%'}
            </p>
            <p className="text-[11px] sm:text-xs font-bold text-slate-500">
              {stats.taxpayersCount > 0 ? 'مكلف مسجل' : 'جاهزية رقمية كاملة'}
            </p>
          </div>

          <div className="usr-institutional-card p-4 sm:p-6 text-center space-y-2 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-amber-500 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 mx-auto flex items-center justify-center border border-amber-100">
              <CheckCircleIcon size={20} />
            </div>
            <p className="text-xl sm:text-3xl font-black text-amber-700 font-display">
              {stats.documentsCount > 0 ? `${stats.documentsCount}+` : '29+'}
            </p>
            <p className="text-[11px] sm:text-xs font-bold text-slate-500">وثيقة ونموذج منشور</p>
          </div>

          <div className="usr-institutional-card p-4 sm:p-6 text-center space-y-2 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-amber-500 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-900 mx-auto flex items-center justify-center border border-sky-100">
              <BarChartIcon size={20} />
            </div>
            <p className="text-xl sm:text-3xl font-black text-sky-950 font-display">
              {stats.servicesCount > 0 ? `${stats.servicesCount}` : 'مباشر'}
            </p>
            <p className="text-[11px] sm:text-xs font-bold text-slate-500">خدمة معتمدة للمكلفين</p>
          </div>

          <div className="usr-institutional-card p-4 sm:p-6 text-center space-y-2 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-amber-500 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 mx-auto flex items-center justify-center border border-amber-100">
              <ShieldCheckIcon size={20} />
            </div>
            <p className="text-xl sm:text-3xl font-black text-amber-700 font-display">24/7</p>
            <p className="text-[11px] sm:text-xs font-bold text-slate-500">خدمة إلكترونية مستمرة</p>
          </div>
        </div>
      </section>

      {/* ─── Main Content Area ─── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="space-y-16 sm:space-y-24 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-14 sm:py-20"
      >
        {/* ─── Featured Tax Services Section ─── */}
        <motion.section variants={itemVariants} id="services-section" className="space-y-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-r-4 border-amber-500 pr-4">
            <div>
              <span className="text-xs font-bold text-amber-700">دليل الإجراءات والمعاملات الرسمية</span>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold font-display text-sky-950 mt-1">
                الخدمات الضريبية الرئيسية
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                تعرف على الشروط والمستندات المطلوبة لكل معاملة ضريبية ومدة الإنجاز المقررة
              </p>
            </div>
            <Link href="/services">
              <Button variant="outline" size="sm" className="font-bold gap-1.5 self-start sm:self-auto rounded-xl text-xs py-2 bg-white border-slate-300">
                <span>عرض الدليل الشامل</span>
                <ArrowLeftIcon size={14} />
              </Button>
            </Link>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {['الكل', 'تسجيل وقيد', 'إقرارات وربط', 'شهادات وبراءات'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-sky-900 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredServices.map((srv) => (
                <div
                  key={srv.id}
                  className="usr-feature-card-lite flex flex-col justify-between rounded-2xl p-6 border border-slate-200"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-100 shadow-2xs">
                        {getServiceVectorIcon(srv.category, srv.title, 20)}
                      </div>
                      <Badge variant="gold" className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200">{srv.category}</Badge>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-sky-950 font-display leading-snug">
                      {srv.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 font-light">
                      {srv.description}
                    </p>

                    <div className="text-xs space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-slate-600 font-medium flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <ClockIcon size={13} />
                          <span>مدة الإنجاز:</span>
                        </span>
                        <span className="text-sky-900 font-bold">
                          {srv.processingDays > 0 ? `${srv.processingDays} أيام عمل` : 'فوري'}
                        </span>
                      </div>
                      <div className="text-slate-600 font-medium flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <DollarIcon size={13} />
                          <span>الرسوم:</span>
                        </span>
                        <span className="text-amber-800 font-bold">
                          {srv.fees || 'محددة باللائحة'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <Link href="/services" className="w-full block">
                      <Button variant="outline" size="sm" className="w-full font-bold justify-center rounded-xl text-xs py-2 bg-white border-slate-200 text-slate-800 hover:bg-slate-50">
                        التفاصيل والمستندات
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="usr-institutional-card p-8 sm:p-12 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-xs">
              <InboxIcon size={40} className="mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">لم يتم العثور على خدمات مطابقة للبحث</p>
              <p className="text-xs text-slate-500">جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً</p>
            </div>
          )}
        </motion.section>

        {/* ─── Interactive Tax Estimator Widget (حاسبة تقدير الضريبة التقديرية) ─── */}
        <motion.section variants={itemVariants} className="rounded-3xl bg-white p-6 sm:p-10 border border-slate-200 shadow-md relative overflow-hidden">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                <Calculator size={15} className="text-amber-600" />
                <span>حاسبة التقدير التفاعلية</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold font-display text-sky-950">
                حاسبة التقدير الضريبي للمكلفين
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                احسب القيمة التقديرية لالتزامك الضريبي وفق الأحكام والقواعد القانونية النافذة
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
              {/* Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع النشاط الضريبي</label>
                  <select
                    value={calcCategory}
                    onChange={(e) => setCalcCategory(e.target.value as any)}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  >
                    <option value="commercial">أرباح تجارية وصناعية (منشآت ومحلات)</option>
                    <option value="professional">مهن حرة غير تجارية (عيادات، مكاتب، استشارات)</option>
                    <option value="rental">ريع عقارات ومبانٍ مؤجرة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الإيراد أو المبيعات السنوية التقديرية (ريال يمني)</label>
                  <input
                    type="number"
                    value={calcRevenue}
                    onChange={(e) => setCalcRevenue(e.target.value)}
                    placeholder="أدخل المبلغ بالريال..."
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Instant Output Card */}
              <div className="bg-sky-950 text-white p-5 rounded-2xl space-y-3 flex flex-col justify-between border border-sky-900">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-amber-300 font-mono uppercase">{calcResult.taxType}</span>
                  <div className="text-2xl font-black text-white font-mono dir-ltr text-right">
                    {calcResult.estimatedTax.toLocaleString('ar-YE')} <span className="text-xs font-sans text-amber-400">ر.ي تقريباً</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-light">
                    النسبة المقررة: <strong className="text-white">{calcResult.rateText}</strong>
                  </p>
                </div>
                <div className="pt-3 border-t border-sky-800/80 flex items-center justify-between text-[11px] text-slate-300 font-medium">
                  <span>موعد التقديم:</span>
                  <span className="text-amber-300 font-bold">{calcResult.deadline}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ─── Tax Deadlines Calendar Section ─── */}
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="gold" className="px-3 py-1 text-xs bg-amber-50 text-amber-900 border border-amber-200">تقويم الامتثال القانوني</Badge>
            <h2 className="text-xl sm:text-3xl font-bold font-display text-sky-950">
              المواعيد والالتزامات الضريبية لسنة 2025/2026
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              احرص على تقديم إقراراتك وسداد مستحقاتك في المواعيد المحددة قانوناً لتفادي الغرامات التراكمية
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {TAX_DEADLINES.map((dl, idx) => (
              <Card key={idx} className="usr-institutional-card p-5 space-y-3 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold border border-amber-100">
                    <CalendarIcon size={16} />
                  </div>
                  <Badge variant={dl.badgeVariant} className="text-[11px]">{dl.status}</Badge>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-sky-950">{dl.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{dl.type}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs font-mono text-sky-900 font-bold">
                  {dl.period}
                </div>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* ─── Announcements Section ─── */}
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-r-4 border-amber-500 pr-4">
            <div>
              <h2 className="text-xl sm:text-3xl font-bold font-display text-sky-950">
                الإعلانات والقرارات والتعاميم الرسمية
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                أحدث التوجيهات الرسمية الصادرة والمنشورة من لوحة الإدارة بفرع محافظة مأرب
              </p>
            </div>
            <Link href="/decisions">
              <Button variant="outline" size="sm" className="font-bold rounded-xl text-xs self-start sm:self-auto bg-white border-slate-300">
                كافة القرارات
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {announcements.map((ann) => (
              <Card
                key={ann.id}
                className="usr-institutional-card hover:border-amber-500 flex flex-col justify-between rounded-2xl p-6 border border-slate-200 bg-white"
              >
                <CardHeader className="p-0 pb-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <Badge variant={ann.isImportant ? 'gold' : 'default'} className="text-[11px]">{ann.category}</Badge>
                    <span className="text-xs text-slate-400 font-mono">{ann.date}</span>
                  </div>
                  <CardTitle className="text-sm sm:text-base leading-snug font-bold text-sky-950">
                    {ann.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 text-xs text-slate-600 leading-relaxed font-light">
                  {ann.summary}
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* ─── Interactive FAQ Section ─── */}
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="outline" className="px-3 py-1 text-xs bg-white border-slate-300">مركز مساعدة المكلفين</Badge>
            <h2 className="text-xl sm:text-3xl font-bold font-display text-sky-950">
              الأسئلة الأكثر شيوعاً
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              إجابات مباشرة ومبسطة لأهم الاستفسارات التي تهم أصحاب الأنشطة التجارية والمهنية
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={faq.id || idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-sky-950 hover:bg-slate-50 transition-colors cursor-pointer min-h-[48px]"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircleIcon size={18} className="text-amber-600 shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDownIcon
                    size={18}
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-sky-800' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 font-light"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ─── Mobile App Promotion Banner ─── */}
        <motion.section variants={itemVariants}>
          <div className="rounded-3xl bg-gradient-to-r from-sky-950 via-sky-900 to-sky-800 p-8 sm:p-12 text-white relative overflow-hidden shadow-xl border border-sky-900">
            <div className="max-w-3xl space-y-4 relative z-10">
              <Badge variant="gold" className="px-3 py-1 font-bold text-xs bg-amber-500 text-white">تطبيق الهواتف الذكية</Badge>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold font-display text-white">
                حمل تطبيق الجوال للمكلفين بمحافظة مأرب
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-slate-200 leading-relaxed font-light max-w-2xl">
                تابع مستحقاتك الضريبية واستلم الإشعارات فور صدورها واستعلم عن صحة شهاداتك من خلال هاتفك الذكي في أي وقت.
              </p>
              <div className="pt-2 flex flex-wrap gap-3 items-center">
                <Link href="/download" className="w-full sm:w-auto">
                  <Button variant="gold" size="lg" className="w-full sm:w-auto font-bold shadow-xl gap-2 rounded-xl text-xs sm:text-sm px-6 py-3.5 justify-center bg-amber-600 hover:bg-amber-700 text-white">
                    <SmartphoneIcon size={17} />
                    <span>تنزيل التطبيق APK مباشر</span>
                  </Button>
                </Link>
                <Link href="/guides" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white hover:bg-slate-100 text-sky-950 font-bold gap-2 rounded-xl text-xs sm:text-sm px-6 py-3.5 justify-center border border-white shadow-lg">
                    <span>دليل استخدام البوابة</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>

      <PublicFooter />
    </div>
  );
}
