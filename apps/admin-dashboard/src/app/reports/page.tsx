'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Modal, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, LoadingState } from '@marib-tax/web-ui';
import { REPORTS_CATALOG, ReportDefinition, getReportData, ReportData } from '@/lib/reports-catalog';
import { exportToCsv, printPdfReport } from '@/lib/export-utils';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [currentData, setCurrentData] = useState<ReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const handleOpenReport = async (rep: ReportDefinition) => {
    setSelectedReport(rep);
    setReportModalOpen(true);
    setCurrentData(null);
    setLoadingReport(true);
    try {
      const data = await getReportData(rep.id);
      setCurrentData(data);
    } catch {
      setCurrentData(null);
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-r-4 border-[var(--usr-gold)] pr-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--usr-primary-dark)]">كتالوج التقارير الرقابية والإدارية (29 تقرير)</h2>
          <p className="text-xs text-[var(--usr-muted)]">إصدار وتصدير التقارير الرسمية بجميع الصيغ والمعايير المعتمدة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {REPORTS_CATALOG.map((rep) => (
          <Card key={rep.id} className="usr-institutional-card p-6 flex flex-col justify-between">
            <CardHeader className="p-0 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-[var(--usr-gold-dark)] bg-[var(--usr-gold-soft)] px-2 py-0.5 rounded border border-amber-200">
                  {rep.code}
                </span>
                <span className="text-xs text-[var(--usr-muted)]">{rep.category}</span>
              </div>
              <CardTitle className="text-base">{rep.title}</CardTitle>
              <CardDescription className="text-xs line-clamp-2 mt-1">{rep.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-3 border-t border-[var(--usr-border)]">
              <Button variant="primary" size="sm" className="w-full" onClick={() => handleOpenReport(rep)}>
                توليد وعرض التقرير 📊
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={selectedReport ? `${selectedReport.code} - ${selectedReport.title}` : 'معاينة التقرير'}
        description={selectedReport?.description}
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="gold"
                size="sm"
                disabled={!currentData || currentData.rows.length === 0}
                onClick={() => {
                  if (selectedReport && currentData) {
                    exportToCsv(selectedReport.code, currentData.headers, currentData.rows);
                  }
                }}
              >
                تصدير Excel / CSV 📊
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!currentData || currentData.rows.length === 0}
                onClick={() => {
                  if (selectedReport && currentData) {
                    printPdfReport(selectedReport.title, currentData.headers, currentData.rows);
                  }
                }}
              >
                طباعة PDF 🖨️
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setReportModalOpen(false)}>
              إغلاق
            </Button>
          </div>
        }
      >
        {loadingReport ? (
          <LoadingState message="جاري توليد التقرير من قاعدة البيانات..." />
        ) : currentData && currentData.rows.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                {currentData.headers.map((h, i) => (
                  <TableHead key={i}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.rows.map((row, rIdx) => (
                <TableRow key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <TableCell key={cIdx}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-10 text-center">
            <p className="font-semibold text-[var(--usr-primary-dark)]">
              {currentData ? 'لا توجد بيانات مطابقة لهذا التقرير حالياً' : 'هذا التقرير قيد التطوير'}
            </p>
            <p className="mt-2 text-xs text-[var(--usr-muted)]">
              {currentData
                ? 'ستظهر البيانات هنا فور توفرها في قاعدة البيانات.'
                : 'سيُربط هذا التقرير بمصدر بياناته الحقيقي تباعاً، ولن تُعرض أي أرقام غير حقيقية.'}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
