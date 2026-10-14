import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { ContactForm } from '@/components/ContactForm';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  MapPinIcon,
  PhoneIcon,
  MessageSquareIcon,
  ClockIcon,
  ShieldCheckIcon,
} from '@marib-tax/web-ui';
import { publicApi } from '@/lib/api-client';

import { parseContactInfo, getWhatsAppLink } from '@/lib/contact-utils';

export default async function ContactPage() {
  const contactPage = await publicApi.getContentPage('contact');
  const contactInfo = parseContactInfo(contactPage?.body);
  const waUrl = getWhatsAppLink(contactInfo.whatsapp);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--usr-bg)] selection:bg-[var(--usr-gold)] selection:text-white">
      <PublicHeader />

      {/* Hero Header */}
      <section className="usr-page-header text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-3">
          <Badge variant="gold" className="px-3 py-1 font-bold">خدمة المكلفين</Badge>
          <h1 className="text-3xl sm:text-5xl font-bold font-display text-white">
            {contactPage?.title || 'التواصل والعنوان والموقع الجغرافي'}
          </h1>
          <p className="text-sm sm:text-base text-slate-200 font-light max-w-2xl mx-auto">
            يسعدنا استقبال استفساراتكم وملاحظاتكم وبلاغاتكم المحمية وتوفير الدعم المباشر لجميع المكلفين بمحافظة مأرب
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 w-full">
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="usr-institutional-card p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-md">
            <CardHeader className="p-0 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] flex items-center justify-center font-bold">
                  <MessageSquareIcon size={22} />
                </div>
                <div>
                  <CardTitle className="text-xl font-display text-[var(--usr-primary-dark)]">
                    إرسال استفسار أو تقديم بلاغ محمي
                  </CardTitle>
                  <p className="text-xs text-[var(--usr-muted)] mt-0.5">
                    تُعامل كافة المراسلات بسرية تامة وتُحال مباشرة للإدارة المعنية
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-6">
              <ContactForm />
            </CardContent>
          </Card>
        </div>

        {/* Info Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Official Location & Contact Card */}
          <div className="usr-feature-card-lite p-6 sm:p-7 space-y-6 rounded-3xl bg-white border border-slate-200 shadow-md">
            <h3 className="font-bold text-lg font-display text-[var(--usr-primary-dark)] border-r-3 border-[var(--usr-gold)] pr-2.5">
              بيانات المقر وأرقام التواصل المعتمدة
            </h3>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--usr-primary-soft)] text-[var(--usr-primary)] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPinIcon size={18} />
                </div>
                <div>
                  <strong className="block text-slate-900 font-bold mb-0.5">المقر الرئيس:</strong>
                  <span className="text-slate-600 font-light">
                    {contactInfo.address}
                  </span>
                </div>
              </li>

              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] flex items-center justify-center shrink-0">
                  <PhoneIcon size={18} />
                </div>
                <div>
                  <strong className="block text-slate-900 font-bold mb-0.5">الهاتف الثابت والسنترال:</strong>
                  <span dir="ltr" className="font-mono text-slate-800 font-bold">{contactInfo.phone}</span>
                </div>
              </li>

              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <MessageSquareIcon size={18} />
                </div>
                <div>
                  <strong className="block text-slate-900 font-bold mb-0.5">واتساب خدمة المكلفين والملاحظات:</strong>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-2 hover:underline transition-colors group/wa"
                    title="فتح محادثة واتساب مباشرة"
                  >
                    <span dir="ltr">{contactInfo.whatsapp}</span>
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-sans group-hover/wa:bg-emerald-700 transition-colors">فتح محادثة واتساب</span>
                  </a>
                </div>
              </li>

              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--usr-primary-soft)] text-[var(--usr-primary)] flex items-center justify-center shrink-0">
                  <ClockIcon size={18} />
                </div>
                <div>
                  <strong className="block text-slate-900 font-bold mb-0.5">ساعات العمل واستقبال المراجعين:</strong>
                  <span className="text-slate-600 font-light">{contactInfo.hours}</span>
                </div>
              </li>
            </ul>

            <div className="p-4 rounded-2xl bg-[var(--usr-bg)] border border-[var(--usr-border)] text-xs text-[var(--usr-muted)] flex items-center gap-2">
              <ShieldCheckIcon size={18} className="text-[var(--usr-gold-dark)] shrink-0" />
              <span>إدارة خدمة الجمهور جاهزة لتقديم الاستشارات والإجابة عن كافة التساؤلات.</span>
            </div>
          </div>

          {/* Dynamic Content Notes if available */}
          {contactInfo.notes?.trim() && (
            <Card className="usr-institutional-card p-6 bg-white border border-slate-200 rounded-3xl">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-base text-[var(--usr-primary-dark)]">
                  توجيهات وإرشادات إضافية
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-xs text-slate-600 space-y-2 font-light leading-relaxed">
                {contactInfo.notes.split('\n').filter((line) => line.trim()).map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
