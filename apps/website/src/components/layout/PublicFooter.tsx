import Link from 'next/link';
import {
  MapPinIcon,
  PhoneIcon,
  MessageSquareIcon,
  ClockIcon,
  SmartphoneIcon,
  ShieldCheckIcon,
} from '@marib-tax/web-ui';

export function PublicFooter() {
  return (
    <footer className="bg-[var(--usr-primary-deeper)] text-white mt-auto border-t-4 border-[var(--usr-gold)] relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,154,23,0.08)_0%,transparent_60%)] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 relative z-10">
        {/* Column 1: About & Institutional Crest */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[var(--usr-gold)] text-[var(--usr-primary-deeper)] flex items-center justify-center font-bold text-xl shadow-lg border border-amber-300 shrink-0">
              <ShieldCheckIcon size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg font-display text-[var(--usr-gold-soft)]">
                مكتب الضرائب بمحافظة مأرب
              </h3>
              <p className="text-[11px] text-slate-300">الجمهورية اليمنية • مصلحة الضرائب</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            البوابة الرقمية الرسمية لتقديم الخدمات للمكلفين، وحوسبة الإجراءات الضريبية، وتعزيز الشفافية والامتثال الطوعي لدعم مسيرة التنمية الاقتصادية في محافظة مأرب.
          </p>
          <div className="pt-1 flex items-center gap-2 text-xs text-[var(--usr-gold-soft)]">
            <span className="w-2 h-2 rounded-full bg-[var(--usr-gold)] animate-ping shrink-0"></span>
            <span>نظام إلكتروني موحد يعمل على مدار الساعة</span>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="font-bold text-sm sm:text-base font-display text-[var(--usr-gold)] mb-3 sm:mb-4 border-r-3 border-[var(--usr-gold)] pr-2.5">
            الخدمات والمعاملات
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li>
              <Link href="/services" className="hover:text-[var(--usr-gold)] transition-colors flex items-center gap-1.5 py-1">
                <span className="text-[var(--usr-gold)]">›</span>
                <span>دليل الخدمات والشروط</span>
              </Link>
            </li>
            <li>
              <Link href="/forms" className="hover:text-[var(--usr-gold)] transition-colors flex items-center gap-1.5 py-1">
                <span className="text-[var(--usr-gold)]">›</span>
                <span>تحميل النماذج والإقرارات</span>
              </Link>
            </li>
            <li>
              <Link href="/laws" className="hover:text-[var(--usr-gold)] transition-colors flex items-center gap-1.5 py-1">
                <span className="text-[var(--usr-gold)]">›</span>
                <span>القوانين والتشريعات الضريبية</span>
              </Link>
            </li>
            <li>
              <Link href="/decisions" className="hover:text-[var(--usr-gold)] transition-colors flex items-center gap-1.5 py-1">
                <span className="text-[var(--usr-gold)]">›</span>
                <span>القرارات الإدارية والتعاميم</span>
              </Link>
            </li>
            <li>
              <Link href="/guides" className="hover:text-[var(--usr-gold)] transition-colors flex items-center gap-1.5 py-1">
                <span className="text-[var(--usr-gold)]">›</span>
                <span>دليل التوعية والامتثال الضريبي</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact Info & Address */}
        <div>
          <h4 className="font-bold text-sm sm:text-base font-display text-[var(--usr-gold)] mb-3 sm:mb-4 border-r-3 border-[var(--usr-gold)] pr-2.5">
            المقر والتواصل المباشر
          </h4>
          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <MapPinIcon size={16} className="text-[var(--usr-gold)] shrink-0 mt-0.5" />
              <span>مأرب المدينة — الشارع العام — المجمع الحكومي لمكاتب الوزارات</span>
            </li>
            <li className="flex items-center gap-2.5">
              <PhoneIcon size={16} className="text-[var(--usr-gold)] shrink-0" />
              <span>الهاتف الثابت: <strong dir="ltr" className="text-white font-mono">06-302155</strong></span>
            </li>
            <li className="flex items-center gap-2.5">
              <MessageSquareIcon size={16} className="text-[var(--usr-gold)] shrink-0" />
              <span>واتساب البلاغات: <strong dir="ltr" className="text-white font-mono">+967 777 000 111</strong></span>
            </li>
            <li className="flex items-center gap-2.5">
              <ClockIcon size={16} className="text-[var(--usr-gold)] shrink-0" />
              <span>أوقات الاستقبال: الأحد - الخميس (8:00 ص - 2:00 م)</span>
            </li>
          </ul>
        </div>

        {/* Column 4: Mobile App & Digital Systems */}
        <div className="space-y-3.5">
          <h4 className="font-bold text-sm sm:text-base font-display text-[var(--usr-gold)] mb-3 sm:mb-4 border-r-3 border-[var(--usr-gold)] pr-2.5">
            تطبيق الهاتف المحمول
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            استعلم عن مستحقاتك وتابع حالة طلباتك واستلم الإشعارات الرسمية مباشرة عبر تطبيق الهاتف الذكي.
          </p>
          <Link
            href="/download"
            className="inline-flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-gradient-to-r from-[var(--usr-gold)] to-[var(--usr-gold-dark)] text-[var(--usr-primary-deeper)] rounded-xl font-bold text-xs hover:brightness-110 transition-all shadow-md border border-amber-300/50"
          >
            <SmartphoneIcon size={17} />
            <span>تنزيل تطبيق المكلفين APK</span>
          </Link>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 flex items-center gap-2">
            <span className="text-[var(--usr-gold)] font-bold">ملاحظة:</span>
            <span>متوافق مع أندرويد 8.0 فما فوق</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar with Gold Accents */}
      <div className="bg-[var(--usr-primary-dark)] py-3.5 px-4 sm:px-6 text-center text-xs text-slate-400 border-t border-slate-700/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} مكتب الضرائب بمحافظة مأرب — جميع الحقوق محفوظة | مصلحة الضرائب</p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/laws" className="hover:text-[var(--usr-gold)] transition-colors">اللوائح القانونية</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-[var(--usr-gold)] transition-colors">تقديم بلاغ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
