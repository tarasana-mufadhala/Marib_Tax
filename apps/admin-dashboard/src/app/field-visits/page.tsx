'use client';

import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Badge, LoadingState } from '@marib-tax/web-ui';
import { api, FieldVisit } from '@/lib/api-client';

export default function FieldVisitsPage() {
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.fieldVisits.getVisits();
        setVisits(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <LoadingState message="جاري جلب زيارات النزول الميداني..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-r-4 border-[var(--usr-gold)] pr-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--usr-primary-dark)]">إدارة النزول الميداني والفحص</h2>
          <p className="text-xs text-[var(--usr-muted)]">متابعة جدول زيارات المفتشين والنتائج الميدانية</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>رقم الزيارة</TableHead>
            <TableHead>اسم المنشأة / المكلف</TableHead>
            <TableHead>المفتش المكلف</TableHead>
            <TableHead>تاريخ الزيارة</TableHead>
            <TableHead>ملاحظات المعاينة الفنية</TableHead>
            <TableHead>الحالة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-bold text-[var(--usr-primary-dark)]">{v.visitNumber}</TableCell>
              <TableCell className="font-semibold">{v.taxpayerName}</TableCell>
              <TableCell>{v.inspectorName}</TableCell>
              <TableCell className="text-xs text-[var(--usr-muted)]">{v.scheduledDate}</TableCell>
              <TableCell className="text-xs max-w-xs">{v.findings || '-'}</TableCell>
              <TableCell>
                <Badge variant={v.status === 'مكتملة' ? 'success' : 'warning'}>{v.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
