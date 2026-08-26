'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, LoadingState, Modal } from '@marib-tax/web-ui';
import { api } from '@/lib/api-client';
import { Megaphone, FileText, Globe, HelpCircle, Inbox, ExternalLink, Edit3, Smartphone } from 'lucide-react';

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
  { key: 'download', label: 'تطبيق الجوال وروابط التحميل المباشر' },
  { key: 'guidelines', label: 'الإرشادات والتوعية الضريبية' },
  { key: 'info-center', label: 'مركز المعلومات والأنظمة' },
];

type ContentTab = 'announcements' | 'library' | 'pages' | 'faqs' | 'messages';

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<ContentTab>('announcements');
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

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-[var(--usr-border)] shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-emerald-600 text-white shadow-sm font-bold'
              : 'text-[var(--usr-muted)] hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Megaphone size={16} className={activeTab === 'announcements' ? 'text-white' : 'text-emerald-700'} />
          <span>الإعلانات والتعاميم</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'announcements' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {announcements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'library'
              ? 'bg-emerald-600 text-white shadow-sm font-bold'
              : 'text-[var(--usr-muted)] hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText size={16} className={activeTab === 'library' ? 'text-white' : 'text-emerald-700'} />
          <span>المكتبة واللوائح والنماذج</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'library' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {docs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pages')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pages'
              ? 'bg-emerald-600 text-white shadow-sm font-bold'
              : 'text-[var(--usr-muted)] hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Globe size={16} className={activeTab === 'pages' ? 'text-white' : 'text-emerald-700'} />
          <span>محتوى الصفحات وتطبيق الجوال</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'pages' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {PAGE_KEYS.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('faqs')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'faqs'
              ? 'bg-emerald-600 text-white shadow-sm font-bold'
              : 'text-[var(--usr-muted)] hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <HelpCircle size={16} className={activeTab === 'faqs' ? 'text-white' : 'text-emerald-700'} />
          <span>الأسئلة الشائعة والإرشادات</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'faqs' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {faqs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'messages'
              ? 'bg-emerald-600 text-white shadow-sm font-bold'
              : 'text-[var(--usr-muted)] hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Inbox size={16} className={activeTab === 'messages' ? 'text-white' : 'text-emerald-700'} />
          <span>الرسائل والبلاغات الواردة</span>
          {messages.filter((m) => m.isNew).length > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500 text-white font-bold animate-pulse">
              {messages.filter((m) => m.isNew).length} جديد
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'messages' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Announcements */}
      {activeTab === 'announcements' && (
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
      )}

      {/* Tab 2: Library & Documents */}
      {activeTab === 'library' && (
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
              <Button variant="gold" size="sm" type="submit" disabled={docBusy} className="font-bold">
                {docBusy ? 'جاري الرفع...' : 'رفع ونشر المستند 📤'}
              </Button>
            </form>

            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-sm text-[var(--usr-primary-dark)]">المستندات المنشورة بالمكتبة ({docs.length})</h4>
              {docs.length > 0 ? (
                <div className="space-y-2">
                  {docs.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--usr-border)] p-3 text-xs bg-white">
                      <div>
                        <p className="font-bold text-[var(--usr-primary-dark)] text-sm">{d.title}</p>
                        <p className="text-[var(--usr-muted)] mt-0.5">
                          التصنيف: {LIBRARY_CATEGORY_AR[d.category] ?? d.category} — الإصدار: {d.version} — الحجم: {d.sizeKb} KB
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={api.admin.libraryDocumentFileUrl(d.id)} target="_blank" rel="noreferrer" className="text-[var(--usr-primary)] font-bold hover:underline">
                          معاينة / تحميل 📄
                        </a>
                        <Button variant="destructive" size="sm" onClick={() => handleToggleDoc(d.id)}>
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--usr-muted)]">لا توجد مستندات مرفوعة بمكتبة الوثائق حتى الآن.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Pages Content & Download Link */}
      {activeTab === 'pages' && (
        <Card className="usr-institutional-card p-6">
          <CardHeader className="pb-3 border-b border-[var(--usr-border)] mb-4">
            <CardTitle className="text-lg">تحرير محتوى الصفحات الثابتة ورابط تنزيل التطبيق</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[var(--usr-muted)]">
              أي تعديل تقوم بحفظه هنا ينعكس مباشرة في صفحات الموقع العام المقابلة (/about, /contact, /download, /guides).
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
      )}

      {/* Tab 4: FAQs */}
      {activeTab === 'faqs' && (
        <Card className="usr-institutional-card p-6">
          <CardHeader className="pb-3 border-b border-[var(--usr-border)] mb-4">
            <CardTitle className="text-lg">إدارة الأسئلة الشائعة والإرشادات ({faqs.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-4 text-xs p-4 rounded-2xl bg-[var(--usr-bg)] border border-[var(--usr-border)]" onSubmit={handleCreateFaq}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Input
                    label="السؤال الشائع *"
                    placeholder="مثال: ما هي شروط تجديد البطاقة الضريبية السنوية؟"
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--usr-text)] mb-1">التصنيف *</label>
                  <select
                    value={faqCategory}
                    onChange={(e) => setFaqCategory(e.target.value)}
                    className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-sm font-medium"
                  >
                    <option value="عام">عام</option>
                    <option value="بطاقات وبراءات">بطاقات وبراءات</option>
                    <option value="إقرارات وأرباح">إقرارات وأرباح</option>
                    <option value="ضرائب عقارية">ضرائب عقارية</option>
                    <option value="طعون واعتراضات">طعون واعتراضات</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--usr-text)]">الإجابة التفصيلية المعتمدة *</label>
                <textarea
                  rows={3}
                  className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-sm text-[var(--usr-text)] focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)]"
                  placeholder="اكتب الإجابة بالخطوات الشفافة والإرشادات الدقيقة..."
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  required
                />
              </div>
              <Button variant="gold" size="md" className="font-bold" disabled={faqBusy}>
                {faqBusy ? 'جاري الحفظ...' : 'إضافة السؤال لمكتبة الأسئلة ➕'}
              </Button>
            </form>

            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-[var(--usr-primary-dark)]">الأسئلة الشائعة المنشورة ({faqs.length})</h4>
              {faqs.length > 0 ? (
                <div className="space-y-3">
                  {faqs.map((f) => (
                    <div key={f.id} className="rounded-xl border border-[var(--usr-border)] p-4 text-xs space-y-2 bg-white">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="gold">{f.category}</Badge>
                          <p className="font-bold text-sm text-[var(--usr-primary-dark)]">{f.question}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={f.isActive ? 'success' : 'outline'}>{f.isActive ? 'نشط' : 'معطّل'}</Badge>
                          <Button variant="outline" size="sm" onClick={() => handleToggleFaq(f.id)}>
                            {f.isActive ? 'تعطيل' : 'تفعيل'}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteFaq(f.id)}>
                            حذف
                          </Button>
                        </div>
                      </div>
                      <p className="rounded-xl bg-[var(--usr-bg)] border border-[var(--usr-border)]/50 px-3.5 py-2.5 leading-relaxed text-slate-700">
                        {f.answer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--usr-muted)]">لا توجد أسئلة شائعة حتى الآن.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Contact Messages */}
      {activeTab === 'messages' && (
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
      )}

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
            })() : editingPage.key === 'download' ? (() => {
              const downloadData = (() => {
                const DEFAULT = {
                  apkUrl: '/downloads/marib-tax-v1.0.4.apk',
                  version: 'v1.0.4',
                  sizeMb: '24 MB',
                  iosUrl: '',
                  notes: 'الإصدار الرسمي المعتمد • متوافق مع Android 8.0+',
                };
                if (!editingPage.body.trim()) return DEFAULT;
                try {
                  const p = JSON.parse(editingPage.body);
                  if (typeof p === 'object' && p !== null) {
                    return {
                      apkUrl: p.apkUrl || DEFAULT.apkUrl,
                      version: p.version || DEFAULT.version,
                      sizeMb: p.sizeMb || DEFAULT.sizeMb,
                      iosUrl: p.iosUrl || '',
                      notes: p.notes || DEFAULT.notes,
                    };
                  }
                } catch {
                  return { ...DEFAULT, apkUrl: editingPage.body };
                }
                return DEFAULT;
              })();

              const updateDownload = (patch: Partial<typeof downloadData>) => {
                const updated = { ...downloadData, ...patch };
                setEditingPage({ ...editingPage, body: JSON.stringify(updated) });
              };

              return (
                <div className="space-y-3 p-3.5 rounded-2xl bg-[var(--usr-bg)] border border-[var(--usr-border)]">
                  <p className="font-bold text-[var(--usr-primary-dark)] text-xs border-b border-slate-200 pb-2">
                    إدارة رابط تنزيل تطبيق الجوال والنسخ المعتمدة
                  </p>
                  
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-emerald-800">
                      📱 رابط تنزيل ملف الـ APK المباشر لـ Android (APK Download URL) *:
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      className="flex w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-mono text-emerald-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={downloadData.apkUrl}
                      onChange={(e) => updateDownload({ apkUrl: e.target.value })}
                      placeholder="https://domain.com/downloads/marib-tax.apk"
                      required
                    />
                    <p className="text-[11px] text-slate-500">
                      ضع رابط التنزيل المباشر المعتمد لملف تطبيق الأندرويد (.apk).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[var(--usr-text)]">
                        🏷️ رقم الإصدار الرسمي:
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-xs font-mono text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)]"
                        value={downloadData.version}
                        onChange={(e) => updateDownload({ version: e.target.value })}
                        placeholder="v1.0.4"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[var(--usr-text)]">
                        📦 حجم الملف (MB):
                      </label>
                      <input
                        type="text"
                        className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)]"
                        value={downloadData.sizeMb}
                        onChange={(e) => updateDownload({ sizeMb: e.target.value })}
                        placeholder="24 MB"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[var(--usr-text)]">
                      🍎 رابط متجر أبل App Store (اختياري):
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)]"
                      value={downloadData.iosUrl}
                      onChange={(e) => updateDownload({ iosUrl: e.target.value })}
                      placeholder="https://apps.apple.com/app/..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[var(--usr-text)]">
                      📝 ملاحظات الإصدار وتوافق الأجهزة:
                    </label>
                    <textarea
                      rows={2}
                      className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-xs text-[var(--usr-text)] focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)]"
                      value={downloadData.notes}
                      onChange={(e) => updateDownload({ notes: e.target.value })}
                      placeholder="الإصدار الرسمي المعتمد • متوافق مع Android 8.0+"
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
