'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  Building2,
  MapPin,
  Scale,
  Receipt,
  Megaphone,
  Layers,
  FileSpreadsheet,
  Database,
  Users,
  Globe,
  LogOut,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { OfficeLogo } from '@/components/OfficeLogo';
import { fetchCurrentUser, logout } from '@/lib/auth';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    fetchCurrentUser().then((user) => {
      if (alive) setPermissions(user?.permissions ?? []);
    });

    const savedState = localStorage.getItem('admin_sidebar_collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }

    return () => {
      alive = false;
    };
  }, [pathname]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const allSections = [
    {
      title: 'العمليات والرقابة اليومية',
      items: [
        { href: '/', label: 'نظرة عامة ومؤشرات', icon: LayoutDashboard, needs: [] },
        {
          href: '/requests',
          label: 'إدارة الطلبات والبلاغات',
          icon: Inbox,
          needs: ['request.read', 'balagh.read'],
        },
        {
          href: '/taxpayers',
          label: 'سجل المكلفين والمنشآت',
          icon: Building2,
          needs: ['taxpayer.admin.read'],
        },
        {
          href: '/field-visits',
          label: 'النزول الميداني والفحص',
          icon: MapPin,
          needs: ['field_visit.schedule', 'field_visit.result.record'],
        },
        {
          href: '/decisions',
          label: 'القرارات والربط الضريبي',
          icon: Scale,
          needs: [
            'request.decision.recommend',
            'request.decision.final',
            'balagh.decision.recommend',
            'balagh.decision.final',
          ],
        },
        {
          href: '/dues',
          label: 'المستحقات والمتأخرات',
          icon: Receipt,
          needs: ['due.register', 'due.correct', 'payment.confirm'],
        },
      ],
    },
    {
      title: 'البوابة الرقمية والإدارة',
      items: [
        {
          href: '/content',
          label: 'إدارة المحتوى والإعلانات',
          icon: Megaphone,
          needs: ['content.publish', 'content.withdraw'],
        },
        {
          href: '/services',
          label: 'إدارة الخدمات والكيانات',
          icon: Layers,
          needs: ['masterdata.manage'],
        },
        {
          href: '/reports',
          label: 'التقارير الرقابية (29)',
          icon: FileSpreadsheet,
          needs: ['report.view'],
        },
        {
          href: '/imports',
          label: 'استيراد وترحيل البيانات',
          icon: Database,
          needs: ['import.preview', 'import.commit'],
        },
        {
          href: '/users',
          label: 'المستخدمون والصلاحيات',
          icon: Users,
          needs: ['user.read', 'user.manage', 'role.read'],
        },
      ],
    },
  ];

  const navSections = allSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.needs.length === 0 ||
          (permissions ?? []).some((code) => item.needs.includes(code)),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className={`h-screen sticky top-0 bg-white text-slate-900 flex flex-col border-l border-slate-200/90 shrink-0 select-none shadow-2xs relative z-40 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Sidebar Header with Official Crest & Toggle */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <OfficeLogo
            size={isCollapsed ? 34 : 38}
            className="border border-emerald-600/20 shadow-2xs shrink-0 rounded-lg bg-white p-0.5"
            priority
          />
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="font-bold text-xs font-display text-slate-900 truncate">
                مكتب الضرائب — مأرب
              </h2>
              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span>لوحة الإدارة</span>
              </p>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          onClick={toggleCollapse}
          type="button"
          title={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
          className="p-1.5 rounded-md hover:bg-slate-200/60 text-slate-500 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Decorative Supabase Accent Line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 shrink-0" />

      {/* Navigation Sections (Scrollable Only Here) */}
      <nav className="flex-1 p-2.5 space-y-5 overflow-y-auto min-h-0">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 px-2 pt-3 pb-1.5">
                <span className="w-1.5 h-3.5 bg-emerald-600 rounded-full shrink-0"></span>
                <span className="text-xs font-bold text-slate-800 tracking-wide font-display">
                  {section.title}
                </span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>
            ) : (
              <div className="h-0.5 bg-slate-200/80 my-3 mx-2 rounded-full" />
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={`group flex items-center ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
                    } rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        size={19}
                        className={
                          isActive
                            ? 'text-emerald-600 shrink-0'
                            : 'text-slate-400 group-hover:text-slate-600 shrink-0 transition-colors'
                        }
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isCollapsed && isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Fixed Bottom Actions & Logout Section (Pinned at Bottom) */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/80 backdrop-blur-xs space-y-2 shrink-0 mt-auto">
        {/* Public Website Preview Link */}
        <a
          href="http://localhost:3002"
          target="_blank"
          rel="noopener noreferrer"
          title={isCollapsed ? 'معاينة الموقع العام' : undefined}
          className={`flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2'
          } rounded-lg bg-white hover:bg-slate-100 text-xs text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs transition-colors font-semibold`}
        >
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-emerald-600 shrink-0" />
            {!isCollapsed && <span>معاينة الموقع العام</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] text-emerald-600 font-mono font-bold">↗</span>
          )}
        </a>

        {/* Prominent Logout Button */}
        <button
          onClick={handleLogout}
          type="button"
          title={isCollapsed ? 'تسجيل الخروج' : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-center gap-2 px-3 py-2.5'
          } rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all shadow-2xs active:scale-98 cursor-pointer border border-red-200`}
        >
          <LogOut size={16} className="shrink-0" />
          {!isCollapsed && <span>تسجيل الخروج</span>}
        </button>

        {!isCollapsed && (
          <p className="text-[10px] text-slate-400 text-center pt-0.5 font-mono">
            نظام الضرائب — مأرب v1.0
          </p>
        )}
      </div>
    </aside>
  );
}
