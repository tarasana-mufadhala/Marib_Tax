import type { Metadata } from 'next';
import { Cairo, Tajawal } from 'next/font/google';
import { PageViewTracker } from '@/components/PageViewTracker';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
  preload: false,
});

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['500', '700'],
  variable: '--font-display',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: 'مكتب الضرائب بمحافظة مأرب | البوابة الإلكترونية الرسمية',
    template: '%s | مكتب الضرائب بمحافظة مأرب',
  },
  description: 'البوابة الإلكترونية لمكتب الضرائب بمحافظة مأرب - الجمهورية اليمنية. تقديم الخدمات الضريبية للمكلفين، الاستعلام عن المستحقات، الإقرارات الإلكترونية، والبلاغات والشكاوى.',
  keywords: ['ضرائب مأرب', 'مكتب الضرائب مأرب', 'الجمهورية اليمنية مأرب', 'الخدمات الضريبية مأرب', 'المكلفين مأرب', 'إقرار ضريبي'],
  authors: [{ name: 'مكتب الضرائب بمحافظة مأرب' }],
  openGraph: {
    title: 'مكتب الضرائب بمحافظة مأرب | البوابة الإلكترونية الرسمية',
    description: 'البوابة الإلكترونية الشاملة للخدمات واللوائح الإدارية والرقابية لمكتب الضرائب بمحافظة مأرب',
    locale: 'ar_YE',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body className="min-h-screen bg-[var(--usr-bg)] text-[var(--usr-text)] font-sans antialiased flex flex-col selection:bg-[var(--usr-gold)] selection:text-white">
        <PageViewTracker />
        {children}
      </body>
    </html>
  );
}
