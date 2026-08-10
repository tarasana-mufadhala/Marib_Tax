'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, GlobeIcon, LogOutIcon, ShieldCheckIcon } from '@marib-tax/web-ui';
import { fetchCurrentUser, logout, type CurrentUser } from '@/lib/auth';

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
    <header className="usr-dashboard-header sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--usr-border)] shadow-xs px-6 py-3">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold font-display text-[var(--usr-primary-dark)] tracking-tight">
          الإدارة العامة والرقابة الضريبية - مأرب
        </h1>
      </div>

      <div className="flex items-center gap-3 text-xs">
        {/* Quick User Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--usr-primary-soft)] border border-blue-200">
          <ShieldCheckIcon size={16} className="text-[var(--usr-primary)]" />
          <span className="font-bold text-[var(--usr-primary-dark)]">{badge}</span>
        </div>

        {/* Public Website Link */}
        <a href="http://localhost:3002" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5">
            <GlobeIcon size={15} />
            <span>الموقع العام</span>
          </Button>
        </a>

        {/* Logout Button */}
        <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-1.5 font-bold">
          <LogOutIcon size={15} />
          <span>خروج</span>
        </Button>
      </div>
    </header>
  );
}
