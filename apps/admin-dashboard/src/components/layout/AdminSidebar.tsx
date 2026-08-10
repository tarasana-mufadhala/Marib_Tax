'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChartIcon,
  InboxIcon,
  BuildingIcon,
  CarIcon,
  ScaleIcon,
  DollarIcon,
  MegaphoneIcon,
  RefreshIcon,
  FileTextIcon,
  UsersIcon,
  GoldRule,
} from '@marib-tax/web-ui';

export function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'نظرة عامة ومؤشرات', icon: BarChartIcon },
    { href: '/requests', label: 'إدارة الطلبات والبلاغات', icon: InboxIcon },
    { href: '/taxpayers', label: 'سجل المكلفين والمنشآت', icon: BuildingIcon },
    { href: '/field-visits', label: 'النزول الميداني والفحص', icon: CarIcon },
    { href: '/decisions', label: 'القرارات والربط الضريبي', icon: ScaleIcon },
    { href: '/dues', label: 'المستحقات والمتأخرات', icon: DollarIcon },
    { href: '/content', label: 'إدارة المحتوى والإعلانات', icon: MegaphoneIcon },
    { href: '/imports', label: 'استيراد البيانات وترحيلها', icon: RefreshIcon },
    { href: '/services', label: 'إدارة الخدمات والكيانات', icon: ScaleIcon },
    { href: '/reports', label: 'التقارير الرقابية (29)', icon: FileTextIcon },
    { href: '/users', label: 'إدارة المستخدمين والصلاحيات', icon: UsersIcon },
  ];

  return (
    <aside className="w-64 bg-[var(--usr-primary-deeper)] text-white min-h-screen flex flex-col border-l border-[var(--usr-primary-dark)] shrink-0 select-none shadow-xl">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-[var(--usr-primary-dark)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--usr-gold)] to-amber-500 text-[var(--usr-primary-deeper)] flex items-center justify-center font-bold text-xl shadow-md border border-amber-300">
            مـ
          </div>
          <div>
            <h2 className="font-bold text-base font-display text-[var(--usr-gold-soft)]">ضرائب مأرب</h2>
            <p className="text-xs text-slate-300">لوحة الإدارة والرقابة</p>
          </div>
        </div>
      </div>

      <GoldRule />

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-[var(--usr-primary)] text-white font-bold shadow-md border-r-4 border-[var(--usr-gold)] translate-x-1'
                  : 'text-slate-300 hover:bg-[var(--usr-primary-dark)] hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[var(--usr-gold)]' : 'text-slate-400'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-[var(--usr-primary-dark)] text-xs text-slate-400 text-center bg-black/10">
        <p className="font-semibold">نظام مكتب ضرائب مأرب v1.0</p>
      </div>
    </aside>
  );
}
