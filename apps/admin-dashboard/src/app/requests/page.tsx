'use client';

import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Badge, Modal, Input, LoadingState, InboxIcon } from '@marib-tax/web-ui';
import { api, RequestItem } from '@/lib/api-client';

interface AttachmentItem {
  id: string;
  filename: string;
  mimeType: string;
  sizeKb: number;
  category: string;
  uploadedAt: string;
}

const ATTACHMENT_CATEGORY_AR: Record<string, string> = {
  attachment: 'مرفق عام',
  approval_form: 'نموذج موافقة',
  rejection_form: 'نموذج رفض',
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<RequestItem | null>(null);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [inspectorName, setInspectorName] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [details, setDetails] = useState<{ request: RequestItem; history: { id: string; from: string; to: string; reason: string; changedAt: string }[] } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachCategory, setAttachCategory] = useState('attachment');
  const [attachBusy, setAttachBusy] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  const loadAttachments = async (requestId: string) => {
    try {
      const rows = await api.admin.getRequestAttachments(requestId);
      setAttachments(rows as AttachmentItem[]);
    } catch {
      setAttachments([]);
    }
  };

  const handleOpenDetails = async (id: string) => {
    setDetailsOpen(true);
    setDetails(null);
    setAttachments([]);
    setAttachFile(null);
    setAttachError(null);
    setDetailsLoading(true);
    try {
      const data = await api.admin.getRequestDetails(id);
      setDetails(data);
      await loadAttachments(id);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUploadAttachment = async () => {
    if (!details || !attachFile) {
      setAttachError('اختر ملفاً أولاً');
      return;
    }
    setAttachBusy(true);
    setAttachError(null);
    try {
      await api.admin.uploadRequestAttachment(details.request.id, attachFile, attachCategory);
      setAttachFile(null);
      await loadAttachments(details.request.id);
    } catch (e) {
      setAttachError(e instanceof Error ? e.message : 'تعذر رفع المرفق');
    } finally {
      setAttachBusy(false);
    }
  };

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true);
        const data = await api.admin.getRequests();
        setRequests(data || []);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    await api.admin.updateRequestStatus(id, newStatus);
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: newStatus as any } : r)));
  };

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    await api.fieldVisits.create({
      requestId: selectedReq.id,
      taxpayerName: selectedReq.taxpayerName,
      inspectorName,
      scheduledDate: visitDate,
    });
    await handleUpdateStatus(selectedReq.id, 'قيد_النزول');
    setIsVisitModalOpen(false);
    setSelectedReq(null);
  };

  if (loading) return <LoadingState message="جاري الاتصال بالسيرفر وجلب الطلبات..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-r-4 border-[var(--usr-gold)] pr-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--usr-primary-dark)]">إدارة الطلبات والمعاملات الواردة</h2>
          <p className="text-xs text-[var(--usr-muted)]">متابعة ومعالجة جميع الطلبات والإقرارات المقدمة من المكلفين</p>
        </div>
      </div>

      {requests.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الطلب</TableHead>
              <TableHead>اسم المكلف / المنشأة</TableHead>
              <TableHead>نوع الخدمة</TableHead>
              <TableHead>تاريخ تقديم الطلب</TableHead>
              <TableHead>الحالة الحالية</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-bold text-[var(--usr-primary-dark)]">{req.requestNumber}</TableCell>
                <TableCell className="font-semibold">{req.taxpayerName}</TableCell>
                <TableCell>{req.serviceType}</TableCell>
                <TableCell className="text-xs text-[var(--usr-muted)]">{req.submissionDate}</TableCell>
                <TableCell>
                  <Badge variant={req.status === 'مكتمل' ? 'success' : req.status === 'قيد_النزول' ? 'warning' : 'default'}>
                    {req.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDetails(req.id)}>
                      التفاصيل 📄
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(req.id, 'تحت_المعالجة')}>
                      بدء الفحص
                    </Button>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => {
                        setSelectedReq(req);
                        setIsVisitModalOpen(true);
                      }}
                    >
                      جدولة نزول 🚗
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(req.id, 'مكتمل')}>
                      اعتماد ✅
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="usr-institutional-card p-12 text-center space-y-3 bg-white">
          <InboxIcon size={40} className="mx-auto text-slate-300" />
          <p className="font-bold text-slate-700 text-sm">لا توجد طلبات مسجلة في قاعدة البيانات حالياً</p>
          <p className="text-xs text-[var(--usr-muted)]">عند قيام المكلفين بتقديم الإقرارات والطلبات ستظهر السجلات تلقائياً هنا</p>
        </div>
      )}

      <Modal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={details ? `تفاصيل الطلب ${details.request.requestNumber}` : 'تفاصيل الطلب'}
        description={details ? `${details.request.taxpayerName} — ${details.request.serviceType}` : ''}
      >
        {detailsLoading ? (
          <LoadingState message="جاري جلب تفاصيل الطلب..." />
        ) : details ? (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-[var(--usr-muted)]">الرقم الضريبي:</span> <b>{details.request.tin}</b></div>
              <div><span className="text-[var(--usr-muted)]">تاريخ التقديم:</span> <b>{details.request.submissionDate}</b></div>
              <div><span className="text-[var(--usr-muted)]">الحالة الحالية:</span> <Badge variant="gold">{details.request.status}</Badge></div>
            </div>
            <div>
              <p className="font-bold text-sm text-[var(--usr-primary-dark)] mb-2">سجل الحالات</p>
              {details.history.length > 0 ? (
                <div className="space-y-2">
                  {details.history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between rounded-lg border border-[var(--usr-border)] p-2">
                      <span>{h.from} ← <b>{h.to}</b></span>
                      <span className="text-[var(--usr-muted)]">{h.changedAt}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--usr-muted)]">لا توجد انتقالات حالة مسجلة بعد — تُسجَّل تلقائياً مع كل تغيير حالة.</p>
              )}
            </div>

            <div className="border-t border-[var(--usr-border)] pt-3">
              <p className="font-bold text-sm text-[var(--usr-primary-dark)] mb-2">المرفقات والنماذج 📎</p>
              {attachments.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {attachments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-[var(--usr-border)] p-2">
                      <div>
                        <p className="font-semibold">{a.filename}</p>
                        <p className="text-[var(--usr-muted)]">{ATTACHMENT_CATEGORY_AR[a.category] ?? a.category} — {a.sizeKb} KB — {a.uploadedAt}</p>
                      </div>
                      <a
                        href={api.admin.attachmentFileUrl(a.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-[var(--usr-border)] px-3 py-1 font-bold text-[var(--usr-primary-dark)] hover:bg-slate-50"
                      >
                        فتح ⬇️
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--usr-muted)] mb-3">لا توجد مرفقات بعد — ارفع نموذج الموافقة أو الرفض أو أي مرفق عام.</p>
              )}
              <div className="grid gap-2 md:grid-cols-3">
                <select
                  value={attachCategory}
                  onChange={(e) => setAttachCategory(e.target.value)}
                  className="rounded-lg border border-[var(--usr-border)] bg-white px-2 py-1.5"
                >
                  <option value="attachment">مرفق عام</option>
                  <option value="approval_form">نموذج موافقة</option>
                  <option value="rejection_form">نموذج رفض</option>
                </select>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv"
                  onChange={(e) => setAttachFile(e.target.files?.[0] ?? null)}
                  className="rounded-lg border border-[var(--usr-border)] bg-white px-2 py-1"
                />
                <Button variant="gold" size="sm" onClick={handleUploadAttachment} disabled={attachBusy || !attachFile}>
                  {attachBusy ? 'جاري الرفع...' : 'رفع المرفق ⬆️'}
                </Button>
              </div>
              {attachError && <p className="mt-2 text-red-600">{attachError}</p>}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--usr-muted)]">تعذر جلب تفاصيل الطلب.</p>
        )}
      </Modal>

      <Modal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        title="جدولة نزول ميداني للطلب"
        description={selectedReq ? `الطلب: ${selectedReq.requestNumber} - ${selectedReq.taxpayerName}` : ''}
      >
        <form onSubmit={handleScheduleVisit} className="space-y-4 text-xs">
          <Input
            label="اسم المفتش المكلف بالنزول"
            required
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
            placeholder="مثال: مهندس/ أحمد العبيدي"
          />
          <Input
            label="تاريخ وتوقيت الزيارة الميدانية"
            type="date"
            required
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
          />
          <Button variant="gold" size="lg" type="submit" className="w-full font-bold">
            تأكيد وجدولة الزيارة الميدانية 🚀
          </Button>
        </form>
      </Modal>
    </div>
  );
}
