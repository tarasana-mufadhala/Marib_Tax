'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  GlobeIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from '@marib-tax/web-ui';
import { OfficeLogo } from '@/components/OfficeLogo';
import { fetchCurrentUser, logout } from '@/lib/auth';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  /**
   * صلاحيات المستخدم من الخادم. تبقى `null` حتى تصل، فلا يُعرض قسم ثم
   * يختفي أمام عينيه. الإخفاء هنا تنظيمٌ للواجهة لا حماية: الحماية في
   * الـ API الذي يرفض ما لا يملكه المستخدم بصرف النظر عمّا تعرضه اللوحة.
   */
  const [permissions, setPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchCurrentUser().then((user) => {
      if (alive) setPermissions(user?.permissions ?? []);
    });
    return () => {
      alive = false;
    };
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  /**
   * الصلاحيات التي تفتح كل قسم. القسم يظهر لمن يملك واحدة منها على الأقل،
   * فموظف الفحص يرى النزول الميداني ولا يرى المستخدمين والصلاحيات.
   */
  const allSections = [
    {
      title: 'العمليات والرقابة اليومية',
      items: [
        { href: '/', label: 'نظرة عامة ومؤشرات', icon: BarChartIcon, needs: [] },
        {
          href: '/requests',
          label: 'إدارة الطلبات والبلاغات',
          icon: InboxIcon,
          needs: ['request.read', 'balagh.read'],
        },
        {
          href: '/taxpayers',
          label: 'سجل المكلفين والمنشآت',
          icon: BuildingIcon,
          needs: ['taxpayer.profile.read'],
        },
        {
          href: '/field-visits',
          label: 'النزول الميداني والفحص',
          icon: CarIcon,
          needs: ['field_visit.schedule', 'field_visit.result.record'],
        },
        {
          href: '/decisions',
          label: 'القرارات والربط الضريبي',
          icon: ScaleIcon,
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
          icon: DollarIcon,
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
          icon: MegaphoneIcon,
          needs: ['content.publish', 'content.withdraw'],
        },
        {
          href: '/services',
          label: 'إدارة الخدمات والكيانات',
          icon: ScaleIcon,
          needs: ['masterdata.manage'],
        },
        {
          href: '/reports',
          label: 'التقارير الرقابية (29)',
          icon: FileTextIcon,
          needs: ['report.view'],
        },
        {
          href: '/imports',
          label: 'استيراد وترحيل البيانات',
          icon: RefreshIcon,
          needs: ['import.preview', 'import.commit'],
        },
        {
          href: '/users',
          label: 'المستخدمون والصلاحيات',
          icon: UsersIcon,
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
    <aside className="w-68 bg-[var(--usr-primary-deeper)] text-white min-h-screen flex flex-col border-l border-slate-800 shrink-0 select-none shadow-2xl relative z-40">
      {/* Sidebar Header with Official Crest */}
      <div className="p-5 border-b border-white/10 bg-black/15">
        <div className="flex items-center gap-3">
          <OfficeLogo size={42} className="border border-[var(--usr-gold)] shadow-md shrink-0" priority />
          <div className="min-w-0">
            <h2 className="font-bold text-sm font-display text-[var(--usr-gold-soft)] truncate">
              مكتب الضرائب بمحافظة مأرب
            </h2>
            <p className="text-[11px] text-slate-300 truncate">الجمهورية اليمنية • لوحة الإدارة</p>
          </div>
        </div>
      </div>

      {/* Decorative Gold Line */}
      <div className="h-1 w-full bg-gradient-to-r from-[var(--usr-gold-dark)] via-[var(--usr-gold)] to-[var(--usr-gold-dark)]" />

      {/* Navigation Sections */}
      <nav className="flex-1 p-3.5 space-y-5 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--usr-gold)]">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-[var(--usr-primary)] text-white font-bold shadow-lg border-r-4 border-[var(--usr-gold)] translate-x-0.5'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? 'text-[var(--usr-gold)] shrink-0' : 'text-slate-300 shrink-0'}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions & Logout Section */}
      <div className="p-3.5 border-t border-white/10 bg-black/20 space-y-2">
        {/* Public Website Preview Link */}
        <a
          href="http://localhost:3002"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs text-slate-200 border border-white/10 transition-colors font-semibold"
        >
          <div className="flex items-center gap-2">
            <GlobeIcon size={16} className="text-[var(--usr-gold)]" />
            <span>معاينة الموقع العام</span>
          </div>
          <span className="text-[10px] text-[var(--usr-gold)] font-mono">↗</span>
        </a>

        {/* Prominent Logout Button */}
        <button
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer border border-red-500/50"
        >
          <LogOutIcon size={16} />
          <span>تسجيل الخروج</span>
        </button>

        <p className="text-[10px] text-slate-400 text-center pt-1 font-mono">
          نظام مصلحة الضرائب — مأرب v1.0
        </p>
      </div>
    </aside>
  );
}
