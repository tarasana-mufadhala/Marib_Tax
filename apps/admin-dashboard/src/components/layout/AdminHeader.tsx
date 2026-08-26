'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@marib-tax/web-ui';
import { Globe, LogOut, ShieldCheck } from 'lucide-react';
import { fetchCurrentUser, logout, type CurrentUser } from '@/lib/auth';
import { OfficeLogo } from '@/components/OfficeLogo';

export function AdminHeader() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    void fetchCurrentUser().then(setUser);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const roleLabel = user?.roles?.[0]?.nameAr ?? user?.title ?? null;
  const badge = user
    ? `${user.displayName ?? 'مستخدم'}${roleLabel ? ` (${roleLabel})` : ''}`
    : '…';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <OfficeLogo size={36} priority />
        <div>
          <h1 className="text-lg font-bold font-display text-slate-900 tracking-tight leading-none">
            مكتب الضرائب بمحافظة مأرب
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            المنظومة الرقمية الشاملة لإدارة العمليات والرقابة والخدمات
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        {/* User Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/70 text-emerald-950 font-medium">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span className="font-bold text-emerald-950">{badge}</span>
        </div>

        {/* Public Website Button */}
        <a href="http://localhost:3002" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5 font-bold shadow-2xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
            <Globe size={15} className="text-emerald-600" />
            <span>الموقع العام 🌐</span>
          </Button>
        </a>

        {/* Logout Button */}
        <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-1.5 font-bold shadow-2xs bg-red-600 hover:bg-red-700 text-white">
          <LogOut size={15} />
          <span>خروج</span>
        </Button>
      </div>
    </header>
  );
}
