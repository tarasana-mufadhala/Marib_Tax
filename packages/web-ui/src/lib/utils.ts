export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0 ر.ي';
  }
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('ar-YE', {
    style: 'decimal',
    maximumFractionDigits: 2,
  }).format(numeric) + ' ر.ي';
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('ar-YE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('ar-YE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function getStatusBadgeClass(status: string): { label: string; bg: string; text: string } {
  switch (status?.toLowerCase()) {
    case 'submitted':
    case 'مقدم':
    case 'قيد_المراجعة':
      return { label: 'قيد المراجعة', bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-800 dark:text-amber-200' };
    case 'in_progress':
    case 'تحت_المعالجة':
    case 'قيد_النزول':
      return { label: 'تحت المعالجة', bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-800 dark:text-blue-200' };
    case 'completed':
    case 'مكتمل':
    case 'تم_الاعتماد':
    case 'مسدد':
      return { label: 'مكتمل / مسدد', bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-800 dark:text-emerald-200' };
    case 'rejected':
    case 'مرفوض':
    case 'ملغى':
      return { label: 'مرفوض / ملغى', bg: 'bg-rose-100 dark:bg-rose-950', text: 'text-rose-800 dark:text-rose-200' };
    case 'overdue':
    case 'متأخر':
      return { label: 'متأخر', bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-800 dark:text-red-200' };
    default:
      return { label: status || 'معلق', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200' };
  }
}
