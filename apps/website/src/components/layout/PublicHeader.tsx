'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Button,
  PhoneIcon,
  GlobeIcon,
  GoldRule,
  ShieldCheckIcon,
  MenuIcon,
  XIcon,
  BuildingIcon,
  FileTextIcon,
  SmartphoneIcon,
  ScaleIcon,
  HelpCircleIcon,
  ScrollTextIcon,
  MapPinIcon,
  ExternalLinkIcon,
} from '@marib-tax/web-ui';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'الرئيسية', icon: BuildingIcon },
    { href: '/about', label: 'عن المكتب', icon: ShieldCheckIcon },
    { href: '/services', label: 'الخدمات الضريبية', icon: FileTextIcon },
    { href: '/forms', label: 'النماذج والإقرارات', icon: FileTextIcon },
    { href: '/laws', label: 'القوانين واللوائح', icon: ScaleIcon },
    { href: '/decisions', label: 'القرارات والتعليمات', icon: ScrollTextIcon },
    { href: '/guides', label: 'الإرشادات والتوعية', icon: HelpCircleIcon },
    { href: '/contact', label: 'التواصل والمقر', icon: MapPinIcon },
    { href: '/download', label: 'تطبيق المحمول', icon: SmartphoneIcon },
  ];

  return (
    <header className="usr-site-header sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Top Banner (hidden on smallest screens to save space, but clean on mobile/tablet) */}
      <div className="usr-topbar flex items-center justify-between px-3 sm:px-8 py-2 text-[11px] sm:text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--usr-gold)] animate-pulse shrink-0"></span>
          <span className="font-medium text-white/95 truncate">الجمهورية اليمنية • مصلحة الضرائب بمحافظة مأرب</span>
        </div>
        <div className="hidden md:flex items-center gap-5 text-xs text-white/85">
          <span className="flex items-center gap-1.5 font-sans">
            <PhoneIcon size={13} className="text-[var(--usr-gold)]" /> 
            <span dir="ltr">06-302155</span>
          </span>
          <span>•</span>
          <span className="hover:text-[var(--usr-gold)] transition-colors">info@marib-tax.gov.ye</span>
          <span>•</span>
          <span className="text-[var(--usr-gold-soft)] font-medium">أوقات الدوام: 8:00 ص - 2:00 م</span>
        </div>
      </div>

      <GoldRule />

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between py-2.5 sm:py-3.5 px-3 sm:px-8">
        {/* Brand / Crest Logo */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group min-h-[44px]">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[var(--usr-primary-deeper)] via-[var(--usr-primary-dark)] to-[var(--usr-primary)] border-2 border-[var(--usr-gold)] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
            <ShieldCheckIcon size={24} className="text-[var(--usr-gold)]" />
          </div>
          <div className="usr-nav-brand-text">
            <div className="flex items-center gap-2">
              <h1 className="usr-nav-university text-sm sm:text-base lg:text-lg font-bold font-display text-[var(--usr-primary-dark)] leading-tight">
                مكتب الضرائب بمحافظة مأرب
              </h1>
              <span className="hidden xl:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] border border-[var(--usr-gold)]/30">
                البوابة الموحدة
              </span>
            </div>
            <p className="usr-nav-platform text-[10px] sm:text-xs text-[var(--usr-muted)] font-medium line-clamp-1">
              المنظومة الرقمية للخدمات والامتثال الضريبي
            </p>
          </div>
        </Link>

        {/* Navigation items (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all relative ${
                  isActive
                    ? 'bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] font-bold shadow-xs'
                    : 'text-[var(--usr-text)] hover:bg-slate-100 hover:text-[var(--usr-primary)]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 right-3 left-3 h-[2px] bg-[var(--usr-gold)] rounded-full"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons & Mobile Toggle */}
        <div className="flex items-center gap-2">
          <a
            href="http://localhost:3001/login"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex"
          >
            <Button
              variant="gold"
              size="sm"
              className="gap-2 font-bold shadow-md hover:shadow-lg transition-all rounded-xl px-4 py-2 text-xs"
            >
              <GlobeIcon size={15} />
              <span>دخول المنظومة</span>
            </Button>
          </a>

          {/* Mobile Menu Toggle Button (Min 44x44 for touch) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 text-[var(--usr-primary-dark)] hover:bg-slate-100 transition-colors focus:outline-none shrink-0 cursor-pointer active:scale-95"
            aria-label="تبديل القائمة الرئيسية"
          >
            {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--usr-border)] bg-white px-4 py-5 space-y-4 shadow-2xl animate-in slide-in-from-top-2 max-h-[calc(100vh-80px)] overflow-y-auto">
          <nav className="grid grid-cols-1 gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const IconComp = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all min-h-[46px] ${
                    isActive
                      ? 'bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] font-bold border-r-4 border-[var(--usr-gold)] shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)]' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <IconComp size={17} />
                  </div>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <a
              href="http://localhost:3001/login"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button variant="gold" size="lg" className="w-full gap-2 font-bold justify-center shadow-md rounded-xl text-sm py-3">
                <GlobeIcon size={18} />
                <span>دخول بوابة الإدارة الضريبية</span>
                <ExternalLinkIcon size={14} className="opacity-70" />
              </Button>
            </a>
            <div className="text-center text-xs text-[var(--usr-muted)] pt-1 flex items-center justify-center gap-2 font-mono">
              <PhoneIcon size={12} className="text-[var(--usr-gold-dark)]" />
              <span>هاتف الاستفسارات: 06-302155</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
