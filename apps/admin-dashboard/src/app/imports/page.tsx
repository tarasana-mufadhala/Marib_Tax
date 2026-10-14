'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Badge, Card, CardHeader, CardTitle, CardContent, LoadingState, InboxIcon } from '@marib-tax/web-ui';
import { api } from '@/lib/api-client';

interface ImportJobRow {
  id: string;
  ref: string;
  source: string;
  status: string;
  createdAt: string;
  totalRows: number;
  validRows: number;
  rejectedRows: number;
}

interface ImportJobDetails {
  id: string;
  ref: string;
  source: string;
  status: string;
  createdAt: string;
  importType: string | null;
  total: number;
  valid: number;
  rejected: number;
  errors: { id: string; row: number; field: string; message: string }[];
}

const STATUS_AR: Record<string, string> = {
  pending_review: 'بانتظار الاعتماد',
  imported: 'تم الترحيل',
  rejected: 'مرفوضة',
};

const statusAr = (code: string) => STATUS_AR[code] ?? code;

const statusVariant = (code: string): 'gold' | 'success' | 'destructive' | 'outline' => {
  if (code === 'imported') return 'success';
  if (code === 'rejected') return 'destructive';
  if (code === 'pending_review') return 'gold';
  return 'outline';
};

export default function ImportsPage() {
  const [jobs, setJobs] = useState<ImportJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [importType, setImportType] = useState<'taxpayers' | 'activities' | 'dues'>('taxpayers');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [details, setDetails] = useState<ImportJobDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      const data = await api.admin.getImportJobs();
      setJobs((data || []) as ImportJobRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر جلب عمليات الاستيراد');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const openDetails = useCallback(async (id: string) => {
    setDetailsLoading(true);
    try {
      const d = await api.admin.getImportJobDetails(id);
      setDetails(d);
    } catch {
      setError('تعذر جلب تفاصيل عملية الاستيراد');
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError('اختر ملف Excel أو CSV أولاً');
      return;
    }
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.admin.uploadImportFile(file, importType);
      setNotice(
        `تمت المعاينة: ${result.total} صف — صحيحة: ${result.valid}، مرفوضة: ${result.rejected}. راجع النتائج ثم اعتمد الترحيل.`,
      );
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadJobs();
      await openDetails(result.jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('سيتم ترحيل كل الصفوف الصحيحة إلى قاعدة البيانات نهائياً. هل أنت متأكد؟')) return;
    setActionBusy(true);
    setError(null);
    try {
      const result = await api.admin.approveImport(id);
      setNotice(`تم الاعتماد والترحيل: أُدرج ${result.inserted} سجلاً${result.skipped > 0 ? ` وتُخطي ${result.skipped} (تكرار لحظة الترحيل)` : ''}.`);
      setDetails(null);
      await loadJobs();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر اعتماد الترحيل');
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('سيتم رفض عملية الاستيراد هذه ولن يُرحَّل أي صف منها. متابعة؟')) return;
    setActionBusy(true);
    setError(null);
    try {
      await api.admin.rejectImport(id);
      setNotice('تم رفض عملية الاستيراد.');
      setDetails(null);
      await loadJobs();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر رفض العملية');
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) return <LoadingState message="جاري الاتصال بالسيرفر..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-r-4 border-[var(--usr-gold)] pr-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--usr-primary-dark)]">استيراد البيانات وترحيل الأنظمة القديمة</h2>
          <p className="text-xs text-[var(--usr-muted)]">الاستيراد على مرحلتين وفق المواصفة: معاينة وتحقق، ثم اعتماد وترحيل</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>
      )}

      <Card className="usr-institutional-card p-6">
        <CardHeader>
          <CardTitle className="text-lg">رفع ملف استيراد جديد (Excel / CSV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold text-slate-700">نوع البيانات المستوردة</label>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value as 'taxpayers' | 'activities' | 'dues')}
                className="w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-sm"
              >
                <option value="taxpayers">مكلفون (الاسم، الهاتف، الرقم الضريبي، العنوان)</option>
                <option value="activities">أنشطة تجارية (هاتف/رقم المكلف، اسم النشاط)</option>
                <option value="dues">مستحقات (مرجع الطلب أو هاتف/رقم المكلف، المبلغ، العملة اختياري)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">الملف (.xlsx / .xls / .csv — حتى 5MB و5000 صف)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="rounded-lg bg-[var(--usr-primary-dark)] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {uploading ? 'جاري الرفع والتحقق...' : 'رفع ومعاينة ⬆️'}
            </button>
            {file && <span className="text-[var(--usr-muted)]">{file.name} ({Math.ceil(file.size / 1024)} KB)</span>}
          </div>
          <p className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sky-800">
            المرحلة الأولى: يفحص النظام الحقول الإلزامية ويمنع تكرار الهاتف والرقم الضريبي (داخل الملف ومقابل القاعدة) ويوحّد صيغ الأرقام،
            ثم يعرض عدد الصفوف الصحيحة والمرفوضة وأسباب الرفض. لا يُرحَّل أي صف إلا بعد ضغط «اعتماد وترحيل».
          </p>
        </CardContent>
      </Card>

      {detailsLoading && <LoadingState message="جاري جلب تفاصيل العملية..." />}

      {details && (
        <Card className="usr-institutional-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>نتيجة المعاينة — {details.ref}</span>
              <span className="flex items-center gap-3">
                <a
                  href={api.admin.importFileUrl(details.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-[var(--usr-primary-dark)] hover:underline"
                >
                  تحميل الملف الأصلي ⬇️
                </a>
                <button onClick={() => setDetails(null)} className="text-sm text-[var(--usr-muted)] hover:text-red-600">إغلاق ✕</button>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4">
              <div className="rounded-xl border border-[var(--usr-border)] bg-slate-50 p-3">
                <p className="text-2xl font-bold text-[var(--usr-primary-dark)]">{details.total}</p>
                <p className="text-xs text-[var(--usr-muted)]">إجمالي الصفوف</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-2xl font-bold text-emerald-700">{details.valid}</p>
                <p className="text-xs text-emerald-700">صفوف صحيحة</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-2xl font-bold text-red-700">{details.rejected}</p>
                <p className="text-xs text-red-700">صفوف مرفوضة</p>
              </div>
              <div className="rounded-xl border border-[var(--usr-border)] bg-slate-50 p-3">
                <Badge variant={statusVariant(details.status)}>{statusAr(details.status)}</Badge>
                <p className="mt-1 text-xs text-[var(--usr-muted)]">حالة العملية</p>
              </div>
            </div>

            {details.errors.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-bold text-red-700">أسباب الرفض ({details.errors.length}{details.errors.length >= 200 ? ' — أول 200' : ''}):</p>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-red-100">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الصف</TableHead>
                        <TableHead>الحقل</TableHead>
                        <TableHead>سبب الرفض</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.errors.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-bold">{e.row}</TableCell>
                          <TableCell>{e.field || '—'}</TableCell>
                          <TableCell className="text-red-700">{e.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {details.status === 'pending_review' && (
              <div className="flex items-center gap-3 border-t border-[var(--usr-border)] pt-4">
                <button
                  onClick={() => handleApprove(details.id)}
                  disabled={actionBusy || details.valid === 0}
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  اعتماد وترحيل {details.valid} صفاً ✔️
                </button>
                <button
                  onClick={() => handleReject(details.id)}
                  disabled={actionBusy}
                  className="rounded-lg border border-red-300 px-5 py-2 text-sm font-bold text-red-700 disabled:opacity-50"
                >
                  رفض العملية
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {jobs.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المرجع</TableHead>
              <TableHead>النوع والملف</TableHead>
              <TableHead>الصفوف</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((j) => (
              <TableRow key={j.id}>
                <TableCell className="font-bold text-[var(--usr-primary-dark)]">{j.ref}</TableCell>
                <TableCell><Badge variant="outline">{j.source}</Badge></TableCell>
                <TableCell className="text-xs">
                  {j.totalRows} / <span className="text-emerald-700">{j.validRows} صحيحة</span> / <span className="text-red-700">{j.rejectedRows} مرفوضة</span>
                </TableCell>
                <TableCell className="text-xs text-[var(--usr-muted)]">{j.createdAt}</TableCell>
                <TableCell><Badge variant={statusVariant(j.status)}>{statusAr(j.status)}</Badge></TableCell>
                <TableCell>
                  <button
                    onClick={() => openDetails(j.id)}
                    className="rounded-lg border border-[var(--usr-border)] px-3 py-1 text-xs font-bold text-[var(--usr-primary-dark)] hover:bg-slate-50"
                  >
                    التفاصيل 📄
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--usr-border)] bg-white py-16 text-center">
          <InboxIcon className="h-10 w-10 text-[var(--usr-muted)]" />
          <p className="font-semibold text-[var(--usr-primary-dark)]">لا توجد عمليات استيراد سابقة</p>
          <p className="max-w-md text-xs text-[var(--usr-muted)]">
            ارفع ملف مكلفين أو أنشطة تجارية أو مستحقات (Excel/CSV) لبدء أول عملية استيراد — ستظهر هنا النتائج وحالة كل عملية.
          </p>
        </div>
      )}
    </div>
  );
}
