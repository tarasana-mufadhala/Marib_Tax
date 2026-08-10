'use client';

import { usePathname } from 'next/navigation';
import { Cairo, Tajawal } from 'next/font/google';
import './globals.css';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body className="min-h-screen bg-[var(--usr-bg)] text-[var(--usr-text)] font-sans antialiased flex flex-col selection:bg-[var(--usr-gold)] selection:text-white">
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
      </body>
    </html>
  );
}
