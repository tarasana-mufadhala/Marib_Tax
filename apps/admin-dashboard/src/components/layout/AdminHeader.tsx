'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, GlobeIcon, LogOutIcon, ShieldCheckIcon } from '@marib-tax/web-ui';
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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--usr-border)] shadow-xs px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <OfficeLogo size={36} priority />
        <div>
          <h1 className="text-lg font-bold font-display text-[var(--usr-primary-dark)] tracking-tight leading-none">
            مكتب الضرائب بمحافظة مأرب
          </h1>
          <p className="text-[11px] text-[var(--usr-muted)] mt-0.5">
            المنظومة الرقمية الشاملة لإدارة العمليات والرقابة والخدمات
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        {/* User Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--usr-primary-soft)] border border-[var(--usr-border)]">
          <ShieldCheckIcon size={16} className="text-[var(--usr-primary)] shrink-0" />
          <span className="font-bold text-[var(--usr-primary-dark)]">{badge}</span>
        </div>

        {/* Public Website Button */}
        <a href="http://localhost:3002" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5 font-bold shadow-xs">
            <GlobeIcon size={15} />
            <span>الموقع العام 🌐</span>
          </Button>
        </a>

        {/* Logout Button */}
        <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-1.5 font-bold shadow-xs">
          <LogOutIcon size={15} />
          <span>خروج</span>
        </Button>
      </div>
    </header>
  );
}
