'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, LoadingState, InboxIcon, Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@marib-tax/web-ui';
import { api } from '@/lib/api-client';

interface DecisionRow {
  id: string;
  outcome: string;
  summary: string;
  decidedAt: string;
  requestRef: string;
  taxpayerName: string;
}

export default function AdminDecisionsPage() {
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api.admin.getDecisions();
        setDecisions(data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'تعذر جلب القرارات');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState message="جاري الاتصال بالسيرفر وجلب القرارات..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-r-4 border-[var(--usr-gold)] pr-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--usr-primary-dark)]">القرارات وإعادة الربط الضريبي</h2>
          <p className="text-xs text-[var(--usr-muted)]">قرارات المعاملات الصادرة عن الموظف المختص (موافقة / رفض) مرتبطة بطلباتها</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {decisions.length > 0 ? (
        <Card className="usr-institutional-card p-6">
          <CardHeader>
            <CardTitle className="text-lg">سجل القرارات الصادرة</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>المكلف</TableHead>
                  <TableHead>النتيجة</TableHead>
                  <TableHead>ملخص القرار</TableHead>
                  <TableHead>تاريخ القرار</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisions.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-bold text-[var(--usr-primary-dark)]">{d.requestRef}</TableCell>
                    <TableCell>{d.taxpayerName}</TableCell>
                    <TableCell>
                      <Badge variant={d.outcome === 'approved' || d.outcome === 'موافقة' ? 'success' : 'destructive'}>
                        {d.outcome === 'approved' ? 'موافقة' : d.outcome === 'rejected' ? 'رفض' : d.outcome}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{d.summary}</TableCell>
                    <TableCell className="text-xs text-[var(--usr-muted)]">{d.decidedAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--usr-border)] bg-white py-16 text-center">
          <InboxIcon className="h-10 w-10 text-[var(--usr-muted)]" />
          <p className="font-semibold text-[var(--usr-primary-dark)]">لا توجد قرارات صادرة بعد</p>
          <p className="max-w-md text-xs text-[var(--usr-muted)]">
            تُسجَّل قرارات الموافقة أو الرفض على المعاملات من صفحة إدارة الطلبات بعد استكمال المراجعة اليدوية، وتظهر هنا مع رقم الطلب وملخص القرار.
          </p>
        </div>
      )}
    </div>
  );
}
