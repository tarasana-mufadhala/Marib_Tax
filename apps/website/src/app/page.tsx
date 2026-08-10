'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  BarChartIcon,
  UsersIcon,
  InboxIcon,
  SearchIcon,
  CalendarIcon,
  HelpCircleIcon,
  BuildingIcon,
  ScaleIcon,
  SmartphoneIcon,
  SparklesIcon,
  TrendingUpIcon,
  ChevronDownIcon,
  LightbulbIcon,
  ScrollTextIcon,
  SendIcon,
  AwardIcon,
} from '@marib-tax/web-ui';
import { publicApi } from '@/lib/api-client';
import type { Announcement, TaxService, PublicFaq, PublicStats } from '@/lib/api-client';

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

// Fallback seed services if none are configured yet in admin
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

// Fallback seed announcements
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

// Fallback seed FAQs
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

// Tax Deadlines Calendar
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

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--usr-bg)] overflow-x-hidden selection:bg-[var(--usr-gold)] selection:text-white">
      <PublicHeader />

      {/* ─── Hero Section with Royal Teal & Gold Geometric Accents ─── */}
      <section className="usr-hero-deep relative py-12 sm:py-20 lg:py-24 text-right overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#d99a17_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* Left Column (7 cols) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springTransition}
            className="lg:col-span-7 space-y-4 sm:space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[var(--usr-gold-soft)] text-xs font-bold border border-[var(--usr-gold)]/40 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[var(--usr-gold)] animate-ping shrink-0"></span>
              <span className="truncate">الجمهورية اليمنية • مصلحة الضرائب بمحافظة مأرب</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black font-display leading-[1.2] text-white tracking-tight">
              بوابة الخدمات الرقمية <br />
              <span className="text-[var(--usr-gold)] drop-shadow-sm">والامتثال الضريبي الموحد</span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed max-w-2xl font-light">
              نقدم للمكلفين في محافظة مأرب منظومة متطورة تتيح متابعة المعاملات، استخراج البطاقات والشهادات الضريبية، والاطلاع على القوانين واللوائح الرسمية بكل يسر وشفافية.
            </p>

            {/* Quick Search Bar (Mobile Optimized) */}
            <div className="pt-1">
              <div className="relative w-full max-w-xl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن خدمة ضريبية، نموذج، أو قرار..."
                  className="w-full py-3 sm:py-3.5 pr-11 pl-24 sm:pl-28 rounded-2xl bg-white text-slate-800 placeholder-slate-400 text-xs sm:text-sm font-medium border-2 border-[var(--usr-gold)] shadow-xl focus:outline-none focus:ring-4 focus:ring-[var(--usr-gold)]/30 transition-all min-h-[48px]"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--usr-primary-dark)]">
                  <SearchIcon size={18} />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-16 sm:left-20 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1.5 py-1 cursor-pointer"
                  >
                    مسح
                  </button>
                )}
                <Link
                  href="/services"
                  className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2"
                >
                  <Button variant="gold" size="sm" className="font-bold rounded-xl py-1.5 px-2.5 sm:px-3.5 text-xs shadow-xs">
                    بحث
                  </Button>
                </Link>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/services" className="w-full sm:w-auto">
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full sm:w-auto font-bold shadow-xl gap-2 active:scale-95 transition-all text-xs sm:text-sm px-5 py-3 rounded-xl justify-center"
                >
                  <span>استكشف دليل الخدمات الكامل</span>
                  <ArrowLeftIcon size={16} />
                </Button>
              </Link>
              <Link href="/forms" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/10 text-white border-white/30 hover:bg-white/20 gap-2 active:scale-95 transition-all text-xs sm:text-sm px-5 py-3 rounded-xl backdrop-blur-sm justify-center"
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
            <div className="usr-auth-card p-5 sm:p-7 bg-white text-[var(--usr-text)] space-y-4 sm:space-y-5 border-2 border-[var(--usr-gold)] shadow-2xl rounded-3xl relative overflow-hidden">
              <div className="border-b border-[var(--usr-border)] pb-3.5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base sm:text-lg font-display text-[var(--usr-primary-dark)]">
                    الخدمات السريعة للمكلفين
                  </h3>
                  <p className="text-xs text-[var(--usr-muted)] mt-0.5">
                    الوصول الفوري للإجراءات الأكثر طلباً
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] flex items-center justify-center font-bold shadow-xs shrink-0">
                  <ShieldCheckIcon size={22} />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <Link
                  href="/services"
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--usr-bg)] hover:bg-[var(--usr-primary-soft)] transition-all border border-[var(--usr-border)] group min-h-[46px]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] flex items-center justify-center font-bold group-hover:bg-[var(--usr-primary)] group-hover:text-white transition-colors shrink-0">
                      <FileTextIcon size={14} />
                    </div>
                    <span className="font-bold text-slate-800 group-hover:text-[var(--usr-primary-dark)] line-clamp-1">
                      إصدار وتجديد البطاقة الضريبية
                    </span>
                  </div>
                  <span className="text-[var(--usr-gold-dark)] font-bold flex items-center gap-1 shrink-0">
                    ابدأ <ArrowLeftIcon size={13} />
                  </span>
                </Link>

                <Link
                  href="/forms"
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--usr-bg)] hover:bg-[var(--usr-primary-soft)] transition-all border border-[var(--usr-border)] group min-h-[46px]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] flex items-center justify-center font-bold shrink-0">
                      <CalendarIcon size={14} />
                    </div>
                    <span className="font-bold text-slate-800 group-hover:text-[var(--usr-primary-dark)] line-clamp-1">
                      تقديم الإقرار السنوي 2025/2026
                    </span>
                  </div>
                  <span className="text-[var(--usr-gold-dark)] font-bold flex items-center gap-1 shrink-0">
                    النماذج <ArrowLeftIcon size={13} />
                  </span>
                </Link>

                <Link
                  href="/laws"
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--usr-bg)] hover:bg-[var(--usr-primary-soft)] transition-all border border-[var(--usr-border)] group min-h-[46px]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] flex items-center justify-center font-bold shrink-0">
                      <ScaleIcon size={14} />
                    </div>
                    <span className="font-bold text-slate-800 group-hover:text-[var(--usr-primary-dark)] line-clamp-1">
                      قانون ضريبة الدخل واللوائح التنفيذية
                    </span>
                  </div>
                  <span className="text-[var(--usr-gold-dark)] font-bold flex items-center gap-1 shrink-0">
                    اطلاع <ArrowLeftIcon size={13} />
                  </span>
                </Link>

                <Link
                  href="/contact"
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--usr-bg)] hover:bg-[var(--usr-primary-soft)] transition-all border border-[var(--usr-border)] group min-h-[46px]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                      <CheckCircleIcon size={14} />
                    </div>
                    <span className="font-bold text-slate-800 group-hover:text-[var(--usr-primary-dark)] line-clamp-1">
                      تقديم استفسار أو بلاغ محمي للفرع
                    </span>
                  </div>
                  <span className="text-[var(--usr-gold-dark)] font-bold flex items-center gap-1 shrink-0">
                    تواصل <ArrowLeftIcon size={13} />
                  </span>
                </Link>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[var(--usr-primary-deeper)] to-[var(--usr-primary-dark)] text-white text-xs flex items-center justify-between gap-2 shadow-sm">
                <div>
                  <p className="font-bold text-[var(--usr-gold-soft)]">بوابة إدارة الضرائب</p>
                  <p className="text-[11px] text-slate-300">تسجيل الدخول لموظفي ولجان المكتب</p>
                </div>
                <a
                  href="http://localhost:3001/login"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="gold" size="sm" className="font-bold py-1.5 px-3 text-xs rounded-lg shadow-sm">
                    دخول
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Impact Metrics Bento Grid (Responsive on Mobile) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="usr-institutional-card p-4 sm:p-6 text-center space-y-1.5 sm:space-y-2 rounded-2xl bg-white border border-slate-200/90 shadow-md hover:border-[var(--usr-gold)] transition-all">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--usr-primary-soft)] text-[var(--usr-primary)] mx-auto flex items-center justify-center">
              <UsersIcon size={20} />
            </div>
            <p className="text-xl sm:text-3xl font-black text-[var(--usr-primary-dark)] font-display">
              {stats.taxpayersCount > 0 ? `${stats.taxpayersCount}+` : '100%'}
            </p>
            <p className="text-[11px] sm:text-xs font-bold text-[var(--usr-muted)]">
              {stats.taxpayersCount > 0 ? 'مكلف مسجل' : 'جاهزية رقمية'}
            </p>
          </div>

          <div className="usr-institutional-card p-4 sm:p-6 text-center space-y-1.5 sm:space-y-2 rounded-2xl bg-white border border-slate-200/90 shadow-md hover:border-[var(--usr-gold)] transition-all">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] mx-auto flex items-center justify-center">
              <CheckCircleIcon size={20} />
            </div>
            <p className="text-xl sm:text-3xl font-black text-[var(--usr-gold-dark)] font-display">
              {stats.documentsCount > 0 ? `${stats.documentsCount}+` : '29+'}
            </p>
            <p className="text-[11px] sm:text-xs font-bold text-[var(--usr-muted)]">وثيقة ونموذج منشور</p>
          </div>

          <div className="usr-institutional-card p-4 sm:p-6 text-center space-y-1.5 sm:space-y-2 rounded-2xl bg-white border border-slate-200/90 shadow-md hover:border-[var(--usr-gold)] transition-all">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--usr-primary-soft)] text-[var(--usr-primary)] mx-auto flex items-center justify-center">
              <BarChartIcon size={20} />
            </div>
            <p className="text-xl sm:text-3xl font-black text-[var(--usr-primary-dark)] font-display">
              {stats.servicesCount > 0 ? `${stats.servicesCount}` : 'مباشر'}
            </p>
            <p className="text-[11px] sm:text-xs font-bold text-[var(--usr-muted)]">خدمة معتمدة</p>
          </div>

          <div className="usr-institutional-card p-4 sm:p-6 text-center space-y-1.5 sm:space-y-2 rounded-2xl bg-white border border-slate-200/90 shadow-md hover:border-[var(--usr-gold)] transition-all">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] mx-auto flex items-center justify-center">
              <ShieldCheckIcon size={20} />
            </div>
            <p className="text-xl sm:text-3xl font-black text-[var(--usr-gold-dark)] font-display">24/7</p>
            <p className="text-[11px] sm:text-xs font-bold text-[var(--usr-muted)]">خدمة للمكلفين</p>
          </div>
        </div>
      </section>

      {/* ─── Main Content Area ─── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="space-y-14 sm:space-y-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
      >
        {/* ─── Featured Tax Services Section ─── */}
        <motion.section variants={itemVariants} className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-r-4 border-[var(--usr-gold)] pr-3 sm:pr-4">
            <div>
              <span className="text-xs font-bold text-[var(--usr-gold-dark)]">دليل الإجراءات والمعاملات</span>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold font-display text-[var(--usr-primary-dark)] mt-1">
                الخدمات الضريبية الرئيسية
              </h2>
              <p className="text-xs sm:text-sm text-[var(--usr-muted)] mt-1">
                تعرف على الشروط والمستندات المطلوبة لكل معاملة ضريبية ومدة الإنجاز المقررة
              </p>
            </div>
            <Link href="/services">
              <Button variant="outline" size="sm" className="font-bold gap-1.5 self-start sm:self-auto rounded-xl text-xs py-2">
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
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[var(--usr-primary)] text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {filteredServices.map((srv) => (
                <div
                  key={srv.id}
                  className="usr-feature-card-lite flex flex-col justify-between rounded-2xl p-5 sm:p-6 border border-slate-200/90"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] flex items-center justify-center font-bold shadow-xs">
                        <FileTextIcon size={20} className="text-[var(--usr-primary)]" />
                      </div>
                      <Badge variant="gold" className="text-[11px]">{srv.category}</Badge>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-[var(--usr-primary-dark)] font-display leading-snug">
                      {srv.title}
                    </h3>

                    <p className="text-xs text-[var(--usr-muted)] leading-relaxed line-clamp-3 font-light">
                      {srv.description}
                    </p>

                    <div className="text-xs space-y-1.5 p-3 rounded-xl bg-[var(--usr-bg)] border border-[var(--usr-border)]/60">
                      <div className="text-slate-600 font-medium flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-500">
                          <ClockIcon size={13} />
                          <span>مدة الإنجاز:</span>
                        </span>
                        <span className="text-[var(--usr-primary)] font-bold">
                          {srv.processingDays > 0 ? `${srv.processingDays} أيام عمل` : 'فوري'}
                        </span>
                      </div>
                      <div className="text-slate-600 font-medium flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-500">
                          <DollarIcon size={13} />
                          <span>الرسوم:</span>
                        </span>
                        <span className="text-[var(--usr-gold-dark)] font-bold">
                          {srv.fees || 'محددة باللائحة'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 mt-4 border-t border-slate-100">
                    <Link href="/services" className="w-full block">
                      <Button variant="outline" size="sm" className="w-full font-bold justify-center rounded-xl text-xs py-2">
                        التفاصيل والمستندات
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="usr-institutional-card p-8 sm:p-12 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <InboxIcon size={40} className="mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">لم يتم العثور على خدمات مطابقة للبحث</p>
              <p className="text-xs text-[var(--usr-muted)]">جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً</p>
            </div>
          )}
        </motion.section>

        {/* ─── Tax Deadlines Calendar Section ─── */}
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="gold" className="px-3 py-1 text-xs">تقويم الامتثال القانوني</Badge>
            <h2 className="text-xl sm:text-3xl font-bold font-display text-[var(--usr-primary-dark)]">
              المواعيد والالتزامات الضريبية لسنة 2025/2026
            </h2>
            <p className="text-xs sm:text-sm text-[var(--usr-muted)]">
              احرص على تقديم إقراراتك وسداد مستحقاتك في المواعيد المحددة قانوناً لتفادي الغرامات التراكمية
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {TAX_DEADLINES.map((dl, idx) => (
              <Card key={idx} className="usr-institutional-card p-5 space-y-3 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] flex items-center justify-center font-bold">
                    <CalendarIcon size={16} />
                  </div>
                  <Badge variant={dl.badgeVariant} className="text-[11px]">{dl.status}</Badge>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--usr-primary-dark)]">{dl.title}</h4>
                  <p className="text-xs text-[var(--usr-muted)] mt-1">{dl.type}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs font-mono text-[var(--usr-primary)] font-bold">
                  {dl.period}
                </div>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* ─── Announcements Section ─── */}
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-r-4 border-[var(--usr-gold)] pr-3 sm:pr-4">
            <div>
              <h2 className="text-xl sm:text-3xl font-bold font-display text-[var(--usr-primary-dark)]">
                الإعلانات والقرارات والتعاميم الرسمية
              </h2>
              <p className="text-xs sm:text-sm text-[var(--usr-muted)] mt-1">
                أحدث التوجيهات الرسمية الصادرة والمنشورة من لوحة الإدارة بفرع محافظة مأرب
              </p>
            </div>
            <Link href="/decisions">
              <Button variant="outline" size="sm" className="font-bold rounded-xl text-xs self-start sm:self-auto">
                كافة القرارات
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {announcements.map((ann) => (
              <Card
                key={ann.id}
                className="usr-institutional-card hover:border-[var(--usr-gold)] flex flex-col justify-between rounded-2xl p-5 sm:p-6 border border-slate-200 bg-white"
              >
                <CardHeader className="p-0 pb-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <Badge variant={ann.isImportant ? 'gold' : 'default'} className="text-[11px]">{ann.category}</Badge>
                    <span className="text-xs text-[var(--usr-muted)] font-mono">{ann.date}</span>
                  </div>
                  <CardTitle className="text-sm sm:text-base leading-snug font-bold text-[var(--usr-primary-dark)]">
                    {ann.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 text-xs text-[var(--usr-muted)] leading-relaxed font-light">
                  {ann.summary}
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* ─── Interactive FAQ Section (Replaced text marker with rotating ChevronDownIcon) ─── */}
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="outline" className="px-3 py-1 text-xs">مركز مساعدة المكلفين</Badge>
            <h2 className="text-xl sm:text-3xl font-bold font-display text-[var(--usr-primary-dark)]">
              الأسئلة الأكثر شيوعاً
            </h2>
            <p className="text-xs sm:text-sm text-[var(--usr-muted)]">
              إجابات مباشرة ومبسطة لأهم الاستفسارات التي تهم أصحاب الأنشطة التجارية والمهنية
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={faq.id || idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[var(--usr-primary-dark)] hover:bg-slate-50 transition-colors cursor-pointer min-h-[48px]"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircleIcon size={18} className="text-[var(--usr-gold-dark)] shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDownIcon
                    size={18}
                    className={`text-[var(--usr-muted)] shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-[var(--usr-primary)]' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-[var(--usr-muted)] leading-relaxed border-t border-slate-100 pt-3 font-light"
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
          <div className="rounded-3xl bg-gradient-to-r from-[var(--usr-primary-deeper)] via-[var(--usr-primary-dark)] to-[var(--usr-primary)] p-6 sm:p-10 lg:p-12 text-white relative overflow-hidden shadow-2xl border-2 border-[var(--usr-gold)]/40">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[radial-gradient(circle,rgba(217,154,23,0.15)_0%,transparent_70%)] pointer-events-none"></div>

            <div className="max-w-3xl space-y-3 sm:space-y-4 relative z-10">
              <Badge variant="gold" className="px-3 py-1 font-bold text-xs">تطبيق الهواتف الذكية</Badge>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold font-display text-white">
                حمل تطبيق المكلفين لمحافظة مأرب
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-slate-200 leading-relaxed font-light max-w-2xl">
                تابع مستحقاتك الضريبية واستلم الإشعارات فور صدورها واستعلم عن صحة شهاداتك من خلال هاتفك الذكي في أي وقت.
              </p>
              <div className="pt-2 flex flex-wrap gap-3 items-center">
                <Link href="/download" className="w-full sm:w-auto">
                  <Button variant="gold" size="lg" className="w-full sm:w-auto font-bold shadow-xl gap-2 rounded-xl text-xs sm:text-sm px-5 py-3 justify-center">
                    <SmartphoneIcon size={17} />
                    <span>تنزيل التطبيق APK مباشر</span>
                  </Button>
                </Link>
                <Link href="/guides" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 text-white border-white/30 hover:bg-white/20 gap-2 rounded-xl text-xs sm:text-sm px-5 py-3 justify-center">
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
