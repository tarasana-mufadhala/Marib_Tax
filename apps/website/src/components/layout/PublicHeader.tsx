'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Button,
  PhoneIcon,
  GlobeIcon,
  GoldRule,
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
  ChevronDownIcon,
  ShieldCheckIcon,
} from '@marib-tax/web-ui';
import { OfficeLogo } from '@/components/OfficeLogo';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdown, setServicesDropdown] = useState(false);
  const [lawsDropdown, setLawsDropdown] = useState(false);

  const isServicesActive = ['/services', '/income-tax', '/sales-tax'].includes(pathname);
  const isLawsActive = ['/forms', '/laws', '/decisions'].includes(pathname);

  return (
    <header className="usr-site-header sticky top-0 z-50 bg-white border-b border-slate-200 shadow-2xs">
      {/* Top Bar (Official Seal & Contact Info) */}
      <div className="usr-topbar flex items-center justify-between px-4 sm:px-8 py-1.5 text-xs bg-[#032338]">
        <div className="flex items-center gap-2.5">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
          <span className="font-semibold text-slate-100 truncate">
            الجمهورية اليمنية • مصلحة الضرائب • فرع محافظة مأرب
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-200 font-medium">
          <span className="flex items-center gap-1.5 font-mono dir-ltr">
            <PhoneIcon size={13} className="text-amber-400" />
            <span>06-302155</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="hover:text-amber-300 transition-colors">info@marib-tax.gov.ye</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-200 font-medium">أوقات الدوام: 8:00 ص - 2:00 م</span>
        </div>
      </div>

      <GoldRule />

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4 sm:px-8 bg-white">
        {/* Brand / Crest Logo */}
        <Link href="/" className="flex items-center gap-3.5 group min-h-[44px]">
          <OfficeLogo
            size={46}
            priority
            className="border-2 border-amber-600/60 rounded-2xl shadow-2xs group-hover:scale-102 transition-transform bg-white p-0.5"
          />
          <div className="usr-nav-brand-text">
            <div className="flex items-center gap-2">
              {/* Using span instead of h1 to maintain exact 1 H1 per page for SEO */}
              <span className="text-base sm:text-lg font-bold font-display text-sky-950 leading-tight block">
                مكتب الضرائب بمحافظة مأرب
              </span>
              <span className="hidden xl:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300/60">
                البوابة الإلكترونية الرسمية
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
              المنظومة الرقمية للخدمات والامتثال الضريبي
            </p>
          </div>
        </Link>

        {/* Navigation items (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="التنقل الرئيسي للموقع">
          <Link
            href="/"
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
              pathname === '/'
                ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200/80 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-sky-900'
            }`}
          >
            الرئيسية
          </Link>

          <Link
            href="/about"
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              pathname === '/about'
                ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200/80 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-sky-900'
            }`}
          >
            عن المكتب
          </Link>

          {/* Dropdown: الخدمات الضريبية */}
          <div
            className="relative"
            onMouseEnter={() => setServicesDropdown(true)}
            onMouseLeave={() => setServicesDropdown(false)}
          >
            <button
              type="button"
              aria-expanded={servicesDropdown}
              aria-label="قائمة الخدمات الضريبية"
              className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isServicesActive
                  ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200/80 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-sky-900'
              }`}
            >
              <span>الخدمات الضريبية</span>
              <ChevronDownIcon size={14} className={`transition-transform ${servicesDropdown ? 'rotate-180' : ''}`} />
            </button>

            {servicesDropdown && (
              <div className="absolute right-0 top-full pt-1.5 w-60 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-1">
                  <Link
                    href="/services"
                    className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-sky-50 hover:text-sky-900 transition-colors"
                  >
                    <FileTextIcon size={16} className="text-amber-600 shrink-0" />
                    <span>دليل الخدمات الضريبية الشامل</span>
                  </Link>
                  <Link
                    href="/income-tax"
                    className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-sky-50 hover:text-sky-900 transition-colors"
                  >
                    <ScaleIcon size={16} className="text-sky-600 shrink-0" />
                    <span>ضرائب الدخل والأرباح</span>
                  </Link>
                  <Link
                    href="/sales-tax"
                    className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-sky-50 hover:text-sky-900 transition-colors"
                  >
                    <ScrollTextIcon size={16} className="text-emerald-600 shrink-0" />
                    <span>ضريبة المبيعات العامة</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Dropdown: النماذج واللوائح */}
          <div
            className="relative"
            onMouseEnter={() => setLawsDropdown(true)}
            onMouseLeave={() => setLawsDropdown(false)}
          >
            <button
              type="button"
              aria-expanded={lawsDropdown}
              aria-label="قائمة النماذج والتشريعات"
              className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isLawsActive
                  ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200/80 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-sky-900'
              }`}
            >
              <span>النماذج والتشريعات</span>
              <ChevronDownIcon size={14} className={`transition-transform ${lawsDropdown ? 'rotate-180' : ''}`} />
            </button>

            {lawsDropdown && (
              <div className="absolute right-0 top-full pt-1.5 w-60 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-1">
                  <Link
                    href="/forms"
                    className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-sky-50 hover:text-sky-900 transition-colors"
                  >
                    <FileTextIcon size={16} className="text-amber-600 shrink-0" />
                    <span>تحميل النماذج والإقرارات</span>
                  </Link>
                  <Link
                    href="/laws"
                    className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-sky-50 hover:text-sky-900 transition-colors"
                  >
                    <ScaleIcon size={16} className="text-sky-600 shrink-0" />
                    <span>القوانين واللوائح النافذة</span>
                  </Link>
                  <Link
                    href="/decisions"
                    className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-sky-50 hover:text-sky-900 transition-colors"
                  >
                    <ScrollTextIcon size={16} className="text-emerald-600 shrink-0" />
                    <span>القرارات والتعليمات الرسمية</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/guides"
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              pathname === '/guides'
                ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200/80 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-sky-900'
            }`}
          >
            التوعية والإرشادات
          </Link>

          <Link
            href="/contact"
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              pathname === '/contact'
                ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200/80 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-sky-900'
            }`}
          >
            التواصل والعنوان
          </Link>

          <Link
            href="/download"
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              pathname === '/download'
                ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200/80 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-sky-900'
            }`}
          >
            تطبيق الجوال
          </Link>
        </nav>

        {/* Action Buttons & Mobile Toggle */}
        <div className="flex items-center gap-2.5">
          <a
            href="http://localhost:3001/login"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex"
          >
            <Button
              variant="gold"
              size="sm"
              className="gap-2 font-bold shadow-md hover:shadow-lg transition-all rounded-xl px-4 py-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              <GlobeIcon size={15} />
              <span>دخول بوابة الإدارة</span>
            </Button>
          </a>

          {/* Mobile Menu Toggle Button with explicit accessibility label */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'إغلاق القائمة الرئيسية' : 'فتح القائمة الرئيسية للتنقل'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-sky-950 hover:bg-slate-100 transition-colors focus:outline-none shrink-0 cursor-pointer active:scale-95 bg-white"
          >
            {mobileMenuOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-5 space-y-4 shadow-2xl animate-in slide-in-from-top-2 max-h-[calc(100vh-80px)] overflow-y-auto">
          <nav className="grid grid-cols-1 gap-1" aria-label="تنقل الجوال">
            {[
              { href: '/', label: 'الرئيسية', icon: BuildingIcon },
              { href: '/about', label: 'عن المكتب', icon: ShieldCheckIcon },
              { href: '/services', label: 'دليل الخدمات الضريبية', icon: FileTextIcon },
              { href: '/income-tax', label: 'ضرائب الدخل والأرباح', icon: ScaleIcon },
              { href: '/sales-tax', label: 'ضريبة المبيعات العامة', icon: ScrollTextIcon },
              { href: '/forms', label: 'النماذج والإقرارات', icon: FileTextIcon },
              { href: '/laws', label: 'القوانين واللوائح', icon: ScaleIcon },
              { href: '/decisions', label: 'القرارات الرسمية', icon: ScrollTextIcon },
              { href: '/guides', label: 'التوعية والإرشادات', icon: HelpCircleIcon },
              { href: '/contact', label: 'التواصل والعنوان', icon: MapPinIcon },
              { href: '/download', label: 'تطبيق الجوال', icon: SmartphoneIcon },
            ].map((link) => {
              const isActive = pathname === link.href;
              const IconComp = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-sky-50 text-sky-900 font-bold border-r-4 border-amber-500 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <IconComp size={16} />
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
              <Button variant="gold" size="lg" className="w-full gap-2 font-bold justify-center shadow-md rounded-xl text-xs py-3 bg-amber-600 text-white">
                <GlobeIcon size={18} />
                <span>دخول بوابة الإدارة الضريبية</span>
                <ExternalLinkIcon size={14} className="opacity-80" />
              </Button>
            </a>
            <div className="text-center text-xs text-slate-500 pt-1 flex items-center justify-center gap-2 font-mono">
              <PhoneIcon size={12} className="text-amber-600" />
              <span>هاتف الاستفسارات: 06-302155</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
