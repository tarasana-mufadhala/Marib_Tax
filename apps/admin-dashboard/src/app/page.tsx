'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  LoadingState,
  ErrorState,
  Button,
  Badge,
  formatCurrency,
  InboxIcon,
  ShieldCheckIcon,
  BarChartIcon,
  UsersIcon,
  BuildingIcon,
  CarIcon,
  RefreshIcon,
  ArrowRightIcon,
} from '@marib-tax/web-ui';
import { api, RequestItem } from '@/lib/api-client';

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

export default function DashboardOverviewPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadData() {
    try {
      setIsRefreshing(true);
      const [metricsData, requestsData] = await Promise.all([
        api.reports.getExecutiveMetrics(),
        api.admin.getRequests(),
      ]);
      setMetrics(metricsData);
      setRecentRequests(requestsData || []);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل البيانات التنفيذية من السيرفر');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState message="جاري الاتصال بالسيرفر وجلب المؤشرات من قاعدة البيانات..." />;
  if (error) return <ErrorState message={error} onRetry={() => loadData()} />;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-[1400px] mx-auto min-h-[100dvh]"
    >
      {/* Top Header & Realtime Connection Pill */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-r-4 border-[var(--usr-gold)] pr-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-[var(--usr-primary-dark)] tracking-tight">
            نظرة عامة ومؤشرات الرقابة الضريبية
          </h2>
          <p className="text-xs sm:text-sm text-[var(--usr-muted)] mt-1">
            البوابة الرقمية الموحدة لإدارة الامتثال والسجلات لمحافظة مأرب
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Status Pill with Breathing Pulse */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>مزامن حي (Supabase Database)</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isRefreshing}
            className="gap-1.5 text-xs font-bold active:scale-95 transition-transform"
          >
            <RefreshIcon size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>تحديث</span>
          </Button>
        </div>
      </motion.div>

      {/* Bento Grid 2.0 — Metric Archetypes */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric Card 1 */}
        <motion.div
          whileHover={{ y: -3, transition: springTransition }}
          className="usr-institutional-card p-6 bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[var(--usr-muted)]">إجمالي التوريد للبنك المركزي</span>
            <div className="w-9 h-9 rounded-xl bg-[var(--usr-primary-soft)] text-[var(--usr-primary)] flex items-center justify-center font-bold">
              <BarChartIcon size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-[var(--usr-primary)] tracking-tight">
            {formatCurrency(metrics?.totalCollections || 0)}
          </p>
          <p className="text-xs text-slate-500 font-semibold mt-2 flex items-center gap-1">
            <span>حسابات توريد ضرائب مأرب</span>
          </p>
        </motion.div>

        {/* Metric Card 2 */}
        <motion.div
          whileHover={{ y: -3, transition: springTransition }}
          className="usr-institutional-card p-6 bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[var(--usr-muted)]">المكلفون المسجلون بالسجل</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[var(--usr-gold-dark)] flex items-center justify-center font-bold">
              <BuildingIcon size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-[var(--usr-primary-dark)] tracking-tight">
            {metrics?.registeredTaxpayers || 0}
            <span className="text-xs font-semibold text-slate-500 mr-1.5">منشأة</span>
          </p>
          <p className="text-xs text-slate-500 font-semibold mt-2">
            سجل مصلحة الضرائب الفعلي
          </p>
        </motion.div>

        {/* Metric Card 3 */}
        <motion.div
          whileHover={{ y: -3, transition: springTransition }}
          className="usr-institutional-card p-6 bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[var(--usr-muted)]">الطلبات قيد المراجعة والفحص</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <InboxIcon size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-blue-800 tracking-tight">
            {metrics?.pendingRequests || 0}
            <span className="text-xs font-semibold text-slate-500 mr-1.5">طلب</span>
          </p>
          <p className="text-xs text-slate-500 font-semibold mt-2">
            تتطلب فحص لجنة الربط
          </p>
        </motion.div>

        {/* Metric Card 4 */}
        <motion.div
          whileHover={{ y: -3, transition: springTransition }}
          className="usr-institutional-card p-6 bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[var(--usr-muted)]">نسبة الجاهزية والامتثال</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <ShieldCheckIcon size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-purple-800 tracking-tight">
            {metrics?.complianceRate || 100}%
          </p>
          <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <span>✓ متصل ومكتمل التشغيل</span>
          </p>
        </motion.div>
      </motion.div>

      {/* Main Asymmetric Bento Row (70/30 split) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Interactive Request Stream */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--usr-border)] mb-6">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--usr-primary-dark)]">
                  تدفق المعاملات والطلبات الإلكترونية
                </h3>
                <p className="text-xs text-[var(--usr-muted)] mt-0.5">
                  عرض آلي فوري للطلبات الواردة من البوابة إلكترونياً
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = '/requests')}
                className="gap-1 text-xs font-bold active:scale-95 transition-transform"
              >
                <span>إدارة الطلبات</span>
                <ArrowRightIcon size={14} />
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {recentRequests.slice(0, 5).map((req, idx) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-[var(--usr-bg)] border border-[var(--usr-border)] text-xs shadow-xs"
                    >
                      <div>
                        <p className="font-bold text-[var(--usr-primary-dark)] text-sm">{req.taxpayerName}</p>
                        <p className="text-[var(--usr-muted)] mt-0.5 font-mono">
                          {req.requestNumber} • {req.serviceType} • {req.submissionDate}
                        </p>
                      </div>
                      <Badge variant={req.status === 'مقدم' ? 'warning' : 'default'}>{req.status}</Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 text-center space-y-3 bg-[var(--usr-bg)] rounded-2xl border border-dashed border-slate-300"
                >
                  <InboxIcon size={44} className="mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700 text-sm">لا توجد طلبات مسجلة في قاعدة البيانات حالياً</p>
                  <p className="text-xs text-[var(--usr-muted)] max-w-md mx-auto">
                    عند تقديم المكلفين للإقرارات والطلبات عبر بوابة المواطنين ستظهر السجلات حياً وفي الوقت الفعلي هنا.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column (4 cols): System Status & Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] space-y-6">
            <div className="pb-3 border-b border-[var(--usr-border)] flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-[var(--usr-primary-dark)]">
                حالة الربط والعمليات
              </h3>
              <ShieldCheckIcon size={20} className="text-[var(--usr-gold)]" />
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-1">
                <p className="font-bold">✓ ربط الخادم الفعلي</p>
                <p className="text-blue-800 leading-relaxed text-[11px]">
                  السيرفر متصل بنجاح مع Supabase PostgreSQL لتقديم أقصى درجات الأمان وحفظ البيانات.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-1">
                <p className="font-bold">✓ تشفير وجاهزية المعاملات</p>
                <p className="text-emerald-800 leading-relaxed text-[11px]">
                  جاهزية تامة لاستقبال طلبات تجديد البطاقة الضريبية وحساب الإقرارات الرقمية.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="gold"
                size="md"
                className="w-full font-bold justify-center gap-2 active:scale-98 transition-transform shadow-md"
                onClick={() => (window.location.href = '/field-visits')}
              >
                <CarIcon size={16} />
                <span>الذهاب لإدارة النزول الميداني</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
