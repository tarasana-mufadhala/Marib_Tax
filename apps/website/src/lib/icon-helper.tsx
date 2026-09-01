import React from 'react';
import {
  CreditCard,
  FileSpreadsheet,
  Award,
  Building2,
  Scale,
  FileText,
  FileCheck,
} from 'lucide-react';

/**
 * يرجع أيكونة فيكتور مناسبة ومطابقة للتصميم حسب تصنيف أو عنوان الخدمة.
 */
export function getServiceVectorIcon(
  category?: string | null,
  title?: string | null,
  size = 20,
) {
  const cat = (category || '').toLowerCase();
  const t = (title || '').toLowerCase();

  if (
    cat.includes('بطاقات') ||
    cat.includes('تسجيل') ||
    t.includes('بطاقة') ||
    t.includes('قيد')
  ) {
    return <CreditCard size={size} className="text-emerald-600 shrink-0" />;
  }
  if (
    cat.includes('إقرارات') ||
    cat.includes('أرباح') ||
    t.includes('إقرار') ||
    t.includes('مرتبات') ||
    t.includes('كسب')
  ) {
    return <FileSpreadsheet size={size} className="text-sky-700 shrink-0" />;
  }
  if (
    cat.includes('شهادات') ||
    cat.includes('براءة') ||
    t.includes('شهادة') ||
    t.includes('إبراء')
  ) {
    return <Award size={size} className="text-amber-600 shrink-0" />;
  }
  if (
    cat.includes('عقارات') ||
    cat.includes('إيجار') ||
    t.includes('عقار') ||
    t.includes('ريع')
  ) {
    return <Building2 size={size} className="text-indigo-600 shrink-0" />;
  }
  if (
    cat.includes('اعتراضات') ||
    cat.includes('شكاوى') ||
    t.includes('طعن') ||
    t.includes('اعتراض')
  ) {
    return <Scale size={size} className="text-red-600 shrink-0" />;
  }
  if (t.includes('تدقيق') || t.includes('فحص')) {
    return <FileCheck size={size} className="text-teal-600 shrink-0" />;
  }

  return <FileText size={size} className="text-sky-800 shrink-0" />;
}
