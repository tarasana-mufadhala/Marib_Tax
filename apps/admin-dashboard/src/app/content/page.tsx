'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, LoadingState, Modal } from '@marib-tax/web-ui';
import { api } from '@/lib/api-client';

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  isActive: boolean;
}

interface ContentPageRow {
  id: string;
  key: string;
  title: string;
  body: string;
  status: string;
  updatedAt: string;
}

interface LibraryDocRow {
  id: string;
  title: string;
  category: string;
  status: string;
  version: string;
  sizeKb: number;
  mimeType: string;
  createdAt: string;
  publishedAt: string;
}

interface ContactMessageRow {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  isNew: boolean;
  createdAt: string;
}

interface FaqRow {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
}

const LIBRARY_CATEGORY_AR: Record<string, string> = {
  form: 'نموذج / إقرار',
  law: 'قانون / تشريع',
  guide: 'دليل إرشادي',
  decision: 'قرار إداري / تعميم',
};

const PAGE_KEYS = [
  { key: 'about', label: 'عن المكتب والرؤية والرسالة' },
  { key: 'contact', label: 'بيانات التواصل والعنوان' },
  { key: 'guidelines', label: 'الإرشادات والتوعية الضريبية' },
  { key: 'info-center', label: 'مركز المعلومات والأنظمة' },
];

export default function AdminContentPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [pages, setPages] = useState<ContentPageRow[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<{ key: string; label: string; title: string; body: string } | null>(null);
  const [savingPage, setSavingPage] = useState(false);
  const [docs, setDocs] = useState<LibraryDocRow[]>([]);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('form');
  const [docVersion, setDocVersion] = useState('1.0');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [messages, setMessages] = useState<ContactMessageRow[]>([]);
  
  // FAQ Form
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('عام');
  const [faqBusy, setFaqBusy] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [ann, pgs, documents, msgs, faqList] = await Promise.all([
        api.admin.getAnnouncements(),
        api.admin.getContentPages(),
        api.admin.getLibraryDocuments(),
        api.admin.getContactMessages(),
        api.admin.getFaqs(),
      ]);
      setAnnouncements(ann || []);
      setPages(pgs || []);
      setDocs((documents || []) as LibraryDocRow[]);
      setMessages((msgs || []) as ContactMessageRow[]);
      setFaqs(faqList || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر جلب المحتوى');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!title.trim() || !body.trim()) {
      setError('العنوان وملخص الإعلان مطلوبان');
      return;
    }
    try {
      setPublishing(true);
      const result = await api.admin.createAnnouncement({ title: title.trim(), body: body.trim(), priority: 10 });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess('تم نشر الإعلان بنجاح على البوابة العامة');
      setTitle('');
      setBody('');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر نشر الإعلان');
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleAnnouncement = async (id: string) => {
    try {
      await api.admin.toggleAnnouncement(id);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث حالة الإعلان');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان نهائياً؟')) return;
    try {
      await api.admin.deleteAnnouncement(id);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حذف الإعلان');
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage) return;
    setError(null);
    setSuccess(null);
    try {
      setSavingPage(true);
      const result = await api.admin.saveContentPage({
        key: editingPage.key,
        title: editingPage.title.trim(),
        body: editingPage.body,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess(`تم حفظ صفحة «${editingPage.label}» ونشرها بنجاح`);
      setEditingPage(null);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الصفحة');
    } finally {
      setSavingPage(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!docTitle.trim() || !docFile) {
      setError('عنوان المستند والملف مطلوبان');
      return;
    }
    try {
      setDocBusy(true);
      await api.admin.uploadLibraryDocument(docFile, {
        title: docTitle.trim(),
        category: docCategory,
        version: docVersion.trim() || '1.0',
      });
      setSuccess('تم رفع المستند بنجاح (مسودة) — اضغط «نشر» ليظهر مباشرة على الموقع العام');
      setDocTitle('');
      setDocVersion('1.0');
      setDocFile(null);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر رفع المستند');
    } finally {
      setDocBusy(false);
    }
  };

  const handleToggleDoc = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      await api.admin.toggleLibraryDocument(id);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث حالة المستند');
    }
  };

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      setError('السؤال والإجابة مطلوبان');
      return;
    }
    try {
      setFaqBusy(true);
      const result = await api.admin.createFaq({
        question: faqQuestion.trim(),
        answer: faqAnswer.trim(),
        category: faqCategory.trim(),
        displayOrder: faqs.length + 1,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess('تمت إضافة السؤال الشائع بنجاح وسيظهر مباشرة في الموقع العام');
      setFaqQuestion('');
      setFaqAnswer('');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ السؤال');
    } finally {
      setFaqBusy(false);
    }
  };

  const handleToggleFaq = async (id: string) => {
    try {
      await api.admin.toggleFaq(id);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث حالة السؤال');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    try {
      await api.admin.deleteFaq(id);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حذف السؤال');
    }
  };

  const handleMarkRead = async (id: string) => {
    setError(null);
    try {
      await api.admin.markContactMessageRead(id);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث حالة الرسالة');
    }
  };

  if (loading) return <LoadingState message="جاري الاتصال بالسيرفر وجلب المحتوى..." />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-r-4 border-[var(--usr-gold)] pr-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--usr-primary-dark)]">
            إدارة وربط محتوى الموقع العام والبوابة الرسمية
          </h2>
          <p className="text-xs text-[var(--usr-muted)] mt-1">
            التحكم الكامل في الإعلانات، النصوص والصفحات، مكتبة الوثائق والنماذج، والأسئلة الشائعة التي تظهر للجمهور
          </p>
        </div>
        <a href="http://localhost:3002" target="_blank" rel="noopener noreferrer">
          <Button variant="gold" size="sm" className="font-bold gap-1.5">
            <span>معاينة الموقع العام 🌐</span>
          </Button>
        </a>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 font-medium">{success}</div>
      )}

      {/* 1. Announcements */}
      <Card className="usr-institutional-card p-6">
        <CardHeader className="pb-3 border-b border-[var(--usr-border)] mb-4">
          <CardTitle className="text-lg">نشر إعلان / تعميم رسمي على الصفحة الرئيسية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4 text-xs" onSubmit={handlePublish}>
            <Input
              label="عنوان الإعلان / التعميم *"
              placeholder="مثال: بدء موسم تقديم الإقرارات الضريبية السنوية لعام 2025..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--usr-text)]">نص وتفاصيل الإعلان *</label>
              <textarea
                rows={3}
                className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-sm text-[var(--usr-text)] focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)]"
                placeholder="اكتب التفاصيل والإرشادات الموجهة للمكلفين..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>
            <Button variant="gold" size="md" className="font-bold" disabled={publishing}>
              {publishing ? 'جاري النشر...' : 'نشر الإعلان على الموقع العام 📢'}
            </Button>
          </form>

          {/* Announcements list */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-sm text-[var(--usr-primary-dark)]">الإعلانات والتعاميم الحالية ({announcements.length})</h4>
            {announcements.length > 0 ? (
              <div className="space-y-2.5">
                {announcements.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--usr-border)] p-4 bg-[var(--usr-bg)]">
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-[var(--usr-primary-dark)]">{a.title}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{a.body}</p>
                      <p className="text-[11px] text-[var(--usr-muted)] font-mono">تاريخ النشر: {a.publishedAt}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={a.isActive ? 'success' : 'outline'}>{a.isActive ? 'معروض للجمهور' : 'معطّل'}</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleToggleAnnouncement(a.id)}>
                        {a.isActive ? 'تعطيل' : 'تفعيل'}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteAnnouncement(a.id)}>
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--usr-muted)]">لا توجد إعلانات منشورة بعد — سيظهر كل إعلان هنا وعلى الصفحة الرئيسية فور إضافته.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Static Content Pages */}
      <Card className="usr-institutional-card p-6">
        <CardHeader className="pb-3 border-b border-[var(--usr-border)] mb-4">
          <CardTitle className="text-lg">تحرير محتوى الصفحات الثابتة (عن المكتب، التواصل، الإرشادات)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-[var(--usr-muted)]">
            أي تعديل تقوم بحفظه هنا ينعكس مباشرة في صفحات الموقع العام المقابلة (/about, /contact, /guides).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {PAGE_KEYS.map((pk) => {
              const page = pages.find((p) => p.key === pk.key);
              return (
                <div key={pk.key} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--usr-border)] p-4 bg-white shadow-xs">
                  <div>
                    <p className="font-bold text-sm text-[var(--usr-primary-dark)]">{pk.label}</p>
                    <p className="text-xs text-[var(--usr-muted)] mt-1">
                      {page ? `آخر تحديث: ${page.updatedAt}` : 'المحتوى الافتراضي مفعّل'}
                    </p>
                  </div>
                  <Button
                    variant="gold"
                    size="sm"
                    className="font-bold"
                    onClick={() =>
                      setEditingPage({
                        key: pk.key,
                        label: pk.label,
                        title: page?.title ?? pk.label,
                        body: page?.body ?? '',
                      })
                    }
                  >
                    تحرير المحتوى ✏️
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Library Documents (Forms, Laws, Decisions, Guides) */}
      <Card className="usr-institutional-card p-6">
        <CardHeader className="pb-3 border-b border-[var(--usr-border)] mb-4">
          <CardTitle className="text-lg">مكتبة النماذج والقوانين والقرارات والأدلة ({docs.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="grid gap-3 text-xs md:grid-cols-5 p-4 rounded-2xl bg-[var(--usr-bg)] border border-[var(--usr-border)]" onSubmit={handleUploadDoc}>
            <input
              type="text"
              placeholder="عنوان المستند أو الاستمارة *"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-sm md:col-span-2"
              required
            />
            <select
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
              className="rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-sm font-medium"
            >
              <option value="form">نموذج / إقرار (/forms)</option>
              <option value="law">قانون / لائحة (/laws)</option>
              <option value="decision">قرار إداري / تعميم (/decisions)</option>
              <option value="guide">دليل إرشادي (/guides)</option>
            </select>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              className="rounded-lg border border-[var(--usr-border)] bg-white px-2 py-1.5 text-xs"
              required
            />
            <Button variant="gold" size="sm" type="submit" className="font-bold" disabled={docBusy || !docFile || !docTitle.trim()}>
              {docBusy ? 'جاري الرفع...' : 'رفع للمكتبة ⬆️'}
            </Button>
          </form>

          {docs.length > 0 ? (
            <div className="space-y-2">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--usr-border)] p-3 text-xs bg-white">
                  <div>
                    <p className="font-bold text-sm text-[var(--usr-primary-dark)]">{d.title}</p>
                    <p className="text-[var(--usr-muted)] mt-0.5">
                      التصنيف: <strong className="text-slate-800">{LIBRARY_CATEGORY_AR[d.category] ?? d.category}</strong> — {d.sizeKb} KB
                      {d.status === 'published' ? ` — نُشر بتاريخ ${d.publishedAt}` : ' (مسودة)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={d.status === 'published' ? 'success' : 'outline'}>
                      {d.status === 'published' ? 'منشور بالموقع' : 'مسودة غير منشورة'}
                    </Badge>
                    <a
                      href={api.admin.libraryDocumentFileUrl(d.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-[var(--usr-border)] px-3 py-1 font-bold text-[var(--usr-primary-dark)] hover:bg-slate-50"
                    >
                      معاينة ⬇️
                    </a>
                    <Button variant={d.status === 'published' ? 'outline' : 'gold'} size="sm" onClick={() => handleToggleDoc(d.id)}>
                      {d.status === 'published' ? 'إلغاء النشر' : 'نشر على الموقع 📢'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--usr-muted)]">لا توجد مستندات بعد — ارفع النماذج أو القوانين لتظهر تلقائياً في صفحات الموقع.</p>
          )}
        </CardContent>
      </Card>

      {/* 4. Frequently Asked Questions (FAQs) */}
      <Card className="usr-institutional-card p-6">
        <CardHeader className="pb-3 border-b border-[var(--usr-border)] mb-4">
          <CardTitle className="text-lg">إدارة الأسئلة الشائعة للمكلفين ({faqs.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="space-y-3 p-4 rounded-2xl bg-[var(--usr-bg)] border border-[var(--usr-border)] text-xs" onSubmit={handleCreateFaq}>
            <Input
              label="نص السؤال *"
              placeholder="مثال: كيف أستخرج بطاقة ضريبية جديدة لأول مرة؟"
              value={faqQuestion}
              onChange={(e) => setFaqQuestion(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--usr-text)]">الإجابة والتوضيح *</label>
              <textarea
                rows={2}
                className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-sm text-[var(--usr-text)] focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)]"
                placeholder="اكتب الإجابة المفصلة التي ستظهر للمكلف في الموقع العام..."
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                required
              />
            </div>
            <Button variant="gold" size="sm" type="submit" className="font-bold" disabled={faqBusy}>
              {faqBusy ? 'جاري الحفظ...' : '+ إضافة سؤال شائع جديد'}
            </Button>
          </form>

          {faqs.length > 0 ? (
            <div className="space-y-2">
              {faqs.map((f) => (
                <div key={f.id} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--usr-border)] p-3 text-xs bg-white">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-[var(--usr-primary-dark)]">❓ {f.question}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{f.answer}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={f.isActive ? 'success' : 'outline'}>{f.isActive ? 'ظاهر' : 'مخفي'}</Badge>
                    <Button variant="outline" size="sm" onClick={() => handleToggleFaq(f.id)}>
                      {f.isActive ? 'إخفاء' : 'إظهار'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteFaq(f.id)}>
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--usr-muted)]">لا توجد أسئلة مضافة بعد — أضف الأسئلة لتظهر في قسم الأسئلة الشائعة بالصفحة الرئيسية.</p>
          )}
        </CardContent>
      </Card>

      {/* 5. Contact Messages */}
      <Card className="usr-institutional-card p-6">
        <CardHeader className="pb-3 border-b border-[var(--usr-border)] mb-4">
          <CardTitle className="text-lg">
            رسائل واستفسارات الجمهور الواردة من الموقع العام ({messages.filter((m) => m.isNew).length} جديدة)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {messages.length > 0 ? (
            <div className="space-y-2.5">
              {messages.map((m) => (
                <div key={m.id} className="rounded-xl border border-[var(--usr-border)] p-4 text-xs space-y-2 bg-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-sm text-[var(--usr-primary-dark)]">{m.fullName}</p>
                      <p className="text-[var(--usr-muted)] mt-0.5">
                        📞 {m.phone}{m.email ? ` — ✉️ ${m.email}` : ''} — {m.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={m.isNew ? 'gold' : 'outline'}>{m.status}</Badge>
                      {m.isNew && (
                        <Button variant="outline" size="sm" onClick={() => handleMarkRead(m.id)}>
                          تعليم كمقروءة ✔️
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="rounded-xl bg-[var(--usr-bg)] border border-[var(--usr-border)]/50 px-3.5 py-2.5 leading-relaxed text-[var(--usr-text)]">
                    {m.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--usr-muted)]">لا توجد رسائل واردة بعد — ستظهر هنا فور إرسالها من صفحة «التواصل والعنوان» على الموقع العام.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Page Modal */}
      <Modal
        isOpen={editingPage !== null}
        onClose={() => setEditingPage(null)}
        title={editingPage ? `تحرير صفحة: ${editingPage.label}` : ''}
        description="يظهر المحتوى المحفوظ على الموقع العام فور حفظه"
      >
        {editingPage && (
          <form onSubmit={handleSavePage} className="space-y-4 text-xs">
            <Input
              label="عنوان الصفحة *"
              required
              value={editingPage.title}
              onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
            />

            {editingPage.key === 'contact' ? (() => {
              const contactData = (() => {
                const DEFAULT = {
                  whatsapp: '+967 777 000 111',
                  phone: '06-302155 / 06-302156',
                  address: 'محافظة مأرب — مأرب المدينة — الشارع العام — المجمع الحكومي لمكاتب الوزارات والهيئات الحكومية',
                  hours: 'الأحد إلى الخميس — من 8:00 صباحاً حتى 2:00 ظهراً',
                  notes: '',
                };
                if (!editingPage.body.trim()) return DEFAULT;
                try {
                  const p = JSON.parse(editingPage.body);
                  if (typeof p === 'object' && p !== null) {
                    return {
                      whatsapp: p.whatsapp || DEFAULT.whatsapp,
                      phone: p.phone || DEFAULT.phone,
                      address: p.address || DEFAULT.address,
                      hours: p.hours || DEFAULT.hours,
                      notes: p.notes || '',
                    };
                  }
                } catch {
                  return { ...DEFAULT, notes: editingPage.body };
                }
                return DEFAULT;
              })();

              const updateContact = (patch: Partial<typeof contactData>) => {
                const updated = { ...contactData, ...patch };
                setEditingPage({ ...editingPage, body: JSON.stringify(updated) });
              };

              return (
                <div className="space-y-3 p-3.5 rounded-2xl bg-[var(--usr-bg)] border border-[var(--usr-border)]">
                  <p className="font-bold text-[var(--usr-primary-dark)] text-xs border-b border-slate-200 pb-2">
                    بيانات التواصل وأرقام الخدمة المعتمدة
                  </p>
                  
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-emerald-800">
                      💬 رقم التواصل عبر الواتساب (يتحول تلقائياً لرابط محادثة مباشر على الموقع):
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      className="flex w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-mono text-emerald-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={contactData.whatsapp}
                      onChange={(e) => updateContact({ whatsapp: e.target.value })}
                      placeholder="+967 777 000 111"
                      required
                    />
                    <p className="text-[11px] text-slate-500">
                      أدخل الرقم بالصيغة الدولية أو المحلية (مثل +967777000111 أو 777000111). وسيتم إنشاء رابط الواتساب التفاعلي تلقائياً.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[var(--usr-text)]">
                      📞 أرقام الهاتف الثابت والسنترال:
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-sm font-mono text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)]"
                      value={contactData.phone}
                      onChange={(e) => updateContact({ phone: e.target.value })}
                      placeholder="06-302155 / 06-302156"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[var(--usr-text)]">
                      📍 عنوان المقر الرئيسي والموقع:
                    </label>
                    <input
                      type="text"
                      className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)]"
                      value={contactData.address}
                      onChange={(e) => updateContact({ address: e.target.value })}
                      placeholder="محافظة مأرب — مأرب المدينة..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[var(--usr-text)]">
                      ⏰ أوقات الدوام الرسمي واستقبال المراجعين:
                    </label>
                    <input
                      type="text"
                      className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)]"
                      value={contactData.hours}
                      onChange={(e) => updateContact({ hours: e.target.value })}
                      placeholder="الأحد إلى الخميس — من 8:00 صباحاً حتى 2:00 ظهراً"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[var(--usr-text)]">
                      📝 توجيهات أو إرشادات إضافية للجمهور (اختياري):
                    </label>
                    <textarea
                      rows={3}
                      className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-xs text-[var(--usr-text)] focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)]"
                      value={contactData.notes}
                      onChange={(e) => updateContact({ notes: e.target.value })}
                      placeholder="أي ملاحظات تظهر بأسفل صفحة التواصل..."
                    />
                  </div>
                </div>
              );
            })() : (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--usr-text)]">محتوى الصفحة (النص الكامل) *</label>
                <textarea
                  rows={8}
                  className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-sm text-[var(--usr-text)] focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)]"
                  value={editingPage.body}
                  onChange={(e) => setEditingPage({ ...editingPage, body: e.target.value })}
                  placeholder="اكتب محتوى الصفحة..."
                  required
                />
              </div>
            )}

            <Button variant="gold" size="lg" type="submit" className="w-full font-bold" disabled={savingPage}>
              {savingPage ? 'جاري الحفظ...' : 'حفظ ونشر الصفحة على الموقع العام'}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
