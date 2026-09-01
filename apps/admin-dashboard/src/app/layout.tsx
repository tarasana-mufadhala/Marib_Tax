'use client';

import { usePathname } from 'next/navigation';
import { Almarai, Tajawal, Cairo } from 'next/font/google';
import { AstryxThemeProvider } from '@/components/AstryxThemeProvider';
import './globals.css';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';

const almarai = Almarai({
  subsets: ['arabic'],
  weight: ['300', '400', '700', '800'],
  variable: '--font-almarai',
  display: 'swap',
  preload: false,
});

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
  display: 'swap',
  preload: false,
});

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
  preload: false,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="ar" dir="rtl" className={`${almarai.variable} ${tajawal.variable} ${cairo.variable}`}>
      <body className="min-h-screen bg-[var(--usr-bg)] text-[#102333] font-sans antialiased flex flex-col selection:bg-[var(--usr-gold)] selection:text-white">
        <AstryxThemeProvider>
          {isLoginPage ? (
            children
          ) : (
            <div className="flex min-h-screen bg-[var(--usr-bg)]">
              <AdminSidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader />
                <main className="p-6 flex-1 overflow-y-auto">{children}</main>
              </div>
            </div>
          )}
        </AstryxThemeProvider>
      </body>
    </html>
  );
}

