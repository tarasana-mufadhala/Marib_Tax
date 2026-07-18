import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'مكتب الضرائب بمحافظة مأرب',
  description: 'البوابة العامة والإدارية لنظام مكتب الضرائب بمحافظة مأرب',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
