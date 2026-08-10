'use client';

import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Badge, Input, LoadingState, formatCurrency, BuildingIcon } from '@marib-tax/web-ui';
import { api, Taxpayer } from '@/lib/api-client';

export default function TaxpayersPage() {
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.admin.getTaxpayers();
        setTaxpayers(data || []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = taxpayers.filter(
    (t) =>
      t.tradeName.includes(searchQuery) ||
      t.tin.includes(searchQuery) ||
      t.ownerName.includes(searchQuery)
  );

  if (loading) return <LoadingState message="جاري الاتصال بالسيرفر وجلب سجل المكلفين..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-r-4 border-[var(--usr-gold)] pr-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--usr-primary-dark)]">سجل المكلفين والمنشآت الضريبية</h2>
          <p className="text-xs text-[var(--usr-muted)]">إدارة بيانات المنشآت والشركات المسجلة في نطاق محافظة مأرب</p>
        </div>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="ابحث بالاسم التجاري أو الرقم الضريبي أو اسم المالك..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filtered.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الرقم الضريبي (TIN)</TableHead>
              <TableHead>الاسم التجاري للمنشأة</TableHead>
              <TableHead>اسم المالك / المسؤول</TableHead>
              <TableHead>المديرية والنشاط</TableHead>
              <TableHead>تاريخ التسجيل</TableHead>
              <TableHead>المستحقات الحالية</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-bold text-[var(--usr-primary-dark)]">{t.tin}</TableCell>
                <TableCell className="font-semibold">{t.tradeName}</TableCell>
                <TableCell>{t.ownerName}</TableCell>
                <TableCell className="text-xs">{t.directorate} - {t.activityType}</TableCell>
                <TableCell className="text-xs text-[var(--usr-muted)]">{t.registrationDate}</TableCell>
                <TableCell className="font-bold text-amber-700">{formatCurrency(t.totalDues)}</TableCell>
                <TableCell>
                  <Badge variant={t.status === 'نشط' ? 'success' : 'warning'}>{t.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="usr-institutional-card p-12 text-center space-y-3 bg-white">
          <BuildingIcon size={40} className="mx-auto text-slate-300" />
          <p className="font-bold text-slate-700 text-sm">لا يوجد مكلفون مسجلون في قاعدة البيانات حالياً</p>
          <p className="text-xs text-[var(--usr-muted)]">يتم تسجيل المكلفين والمنشآت وتوليد الأرقام الضريبية عبر خادم السجل الفعلي</p>
        </div>
      )}
    </div>
  );
}
