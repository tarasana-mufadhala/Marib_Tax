'use client';

import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Badge, Button, LoadingState, InboxIcon, formatCurrency } from '@marib-tax/web-ui';
import { api, TaxDue } from '@/lib/api-client';

const statusVariant = (status: TaxDue['status']) => {
  switch (status) {
    case 'مسدد بالكامل':
      return 'success' as const;
    case 'مسدد جزئياً':
      return 'warning' as const;
    case 'متأخر':
      return 'destructive' as const;
    default:
      return 'gold' as const;
  }
};

export default function DuesPage() {
  const [dues, setDues] = useState<TaxDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchDues = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.admin.getDues();
      setDues(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر جلب المستحقات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, []);

  const handleRegisterPayment = async (due: TaxDue) => {
    try {
      setPayingId(due.id);
      await api.admin.updateDueStatus(due.id, 'paid');
      setDues(dues.map((d) => (d.id === due.id ? { ...d, status: 'مسدد بالكامل' } : d)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر تسجيل السداد');
    } finally {
      setPayingId(null);
    }
  };

  const pending = dues.filter((d) => d.status === 'غير مسدد' || d.status === 'متأخر');
  const paid = dues.filter((d) => d.status === 'مسدد بالكامل');
  const sum = (list: TaxDue[]) => list.reduce((acc, d) => acc + d.amount, 0);

  if (loading) return <LoadingState message="جاري الاتصال بالسيرفر وجلب المستحقات..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-r-4 border-[var(--usr-gold)] pr-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--usr-primary-dark)]">إدارة المستحقات والمتأخرات الضريبية</h2>
          <p className="text-xs text-[var(--usr-muted)]">متابعة المبالغ المطلوبة وتحصيلات الربط الضريبي السنوي — تُسجَّل المبالغ والسداد يدوياً من الموظف المختص</p>
        </div>
        <Button variant="outline" onClick={fetchDues}>تحديث</Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--usr-border)] bg-white p-4 shadow-sm">
          <p className="text-xs text-[var(--usr-muted)]">بانتظار السداد</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{pending.length}</p>
          <p className="text-xs text-[var(--usr-muted)]">{formatCurrency(sum(pending))}</p>
        </div>
        <div className="rounded-xl border border-[var(--usr-border)] bg-white p-4 shadow-sm">
          <p className="text-xs text-[var(--usr-muted)]">تم تحصيلها</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{paid.length}</p>
          <p className="text-xs text-[var(--usr-muted)]">{formatCurrency(sum(paid))}</p>
        </div>
        <div className="rounded-xl border border-[var(--usr-border)] bg-white p-4 shadow-sm">
          <p className="text-xs text-[var(--usr-muted)]">إجمالي المبالغ المسجلة</p>
          <p className="mt-1 text-2xl font-bold text-[var(--usr-primary-dark)]">{formatCurrency(sum(dues))}</p>
          <p className="text-xs text-[var(--usr-muted)]">{dues.length} مستحق</p>
        </div>
      </div>

      {dues.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الرقم الضريبي</TableHead>
              <TableHead>اسم المكلف</TableHead>
              <TableHead>رقم الطلب</TableHead>
              <TableHead>السنة الضريبية</TableHead>
              <TableHead>المبلغ المستحق</TableHead>
              <TableHead>تاريخ إشعار السداد</TableHead>
              <TableHead>حالة السداد</TableHead>
              <TableHead>إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dues.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-bold text-[var(--usr-primary-dark)]">{d.tin}</TableCell>
                <TableCell className="font-semibold">{d.taxpayerName}</TableCell>
                <TableCell className="text-xs text-[var(--usr-muted)]">{(d as any).requestRef ?? '—'}</TableCell>
                <TableCell>{d.taxYear}</TableCell>
                <TableCell className="font-bold text-amber-700">{formatCurrency(d.amount)}</TableCell>
                <TableCell className="text-xs text-[var(--usr-muted)]">
                  {d.dueDate ? new Date(d.dueDate).toLocaleDateString('ar-YE') : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
                </TableCell>
                <TableCell>
                  {d.status !== 'مسدد بالكامل' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={payingId === d.id}
                      onClick={() => handleRegisterPayment(d)}
                    >
                      {payingId === d.id ? 'جاري التسجيل...' : 'تسجيل سداد'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--usr-border)] bg-white py-16 text-center">
          <InboxIcon className="h-10 w-10 text-[var(--usr-muted)]" />
          <p className="font-semibold text-[var(--usr-primary-dark)]">لا توجد مستحقات مسجلة حالياً</p>
          <p className="max-w-md text-xs text-[var(--usr-muted)]">
            تُسجَّل المبالغ المستحقة على المكلفين من قبل الموظف المختص بعد مراجعة الموقف الضريبي، ويُشعَر المكلف بالسداد عبر SMS / واتساب.
          </p>
        </div>
      )}
    </div>
  );
}
