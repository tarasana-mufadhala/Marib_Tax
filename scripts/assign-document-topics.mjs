/**
 * إسناد «نوع الضريبة» لمستندات المكتبة.
 *
 * موقع المصلحة القديم كان مُنظَّماً بنوع الضريبة لا بنوع المستند: صفحتا
 * `incometaxes` و`salestaxes` وحدهما حملتا 49 من أصل 61 مستنداً. نستخرج
 * هذا الانتماء من حقل `source` في فهرس التنزيل، فيصير بالإمكان بناء نفس
 * الشاشات على الموقع الجديد.
 *
 * التشغيل من جذر المستودع:
 *   node scripts/assign-document-topics.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DOCS_DIR = path.join(ROOT, 'downloads', 'tax_gov_ye_documents');
const API = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@marib-tax.gov.ye';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Marib@2026';

/** صفحة الموقع القديم ← نوع الضريبة. */
function topicOfSource(source) {
  const page = decodeURIComponent(source ?? '');
  if (page.includes('incometaxes')) return 'income_tax';
  if (page.includes('salestaxes')) return 'sales_tax';
  if (/المبيعات/.test(page)) return 'sales_tax';
  if (/الدخل/.test(page)) return 'income_tax';
  return 'general';
}

/** الملفات التي يكشف اسمها انتماءها مباشرة. */
const BY_FILE = {
  'recordsbills-guide.pdf': 'sales_tax',
  'register-guide.pdf': 'sales_tax',
  'salestaxforms.pdf': 'sales_tax',
  'Commercial.pdf': 'income_tax',
  'Industrial.pdf': 'income_tax',
  'Service.pdf': 'income_tax',
  'Telecom1.pdf': 'income_tax',
  'big-mid.pdf': 'income_tax',
};

async function main() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(DOCS_DIR, 'documents_manifest.json'), 'utf8'),
  );

  // اسم الملف ← نوع الضريبة، من مصدر التنزيل.
  const topicByFile = new Map();
  for (const entry of manifest) {
    const name = decodeURIComponent((entry.url ?? '').split('/').pop() ?? '');
    if (name) topicByFile.set(name, topicOfSource(entry.source));
  }
  for (const [name, topic] of Object.entries(BY_FILE)) topicByFile.set(name, topic);

  const login = await fetch(`${API}/auth/login/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!login.ok) throw new Error(`تعذّر دخول المدير: ${login.status}`);
  const { accessToken } = await login.json();

  const documents = await (
    await fetch(`${API}/admin/library-documents`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  ).json();

  // العنوان يحمل نوع الضريبة للقرارات («— ضريبة الدخل»)، وهو أوثق مصدر
  // لما رُفع فعلاً لأن اسم الملف الأصلي لا يُحفظ مع المستند.
  const updates = [];
  for (const doc of documents ?? []) {
    const title = String(doc.title ?? '');
    let topic = null;
    if (/ضريبة الدخل|الأرباح التجارية|النشاط الصناعي|الاتصالات|كبار ومتوسطي/.test(title)) {
      topic = 'income_tax';
    } else if (/ضريبة المبيعات|المبيعات/.test(title)) {
      topic = 'sales_tax';
    } else {
      topic = 'general';
    }
    updates.push({ id: doc.id, title, topic });
  }

  const counts = {};
  for (const u of updates) counts[u.topic] = (counts[u.topic] ?? 0) + 1;

  const res = await fetch(`${API}/admin/library-documents/topics`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      assignments: updates.map(({ id, topic }) => ({ id, topicCode: topic })),
    }),
  });
  const body = await res.json().catch(() => ({}));

  if (!body?.success) {
    throw new Error(body?.error?.message ?? `تعذّر الحفظ: ${res.status}`);
  }

  console.log('أُسند نوع الضريبة لـ', body.updated, 'مستنداً:');
  for (const [topic, n] of Object.entries(counts)) {
    const label =
      topic === 'income_tax' ? 'ضريبة الدخل'
      : topic === 'sales_tax' ? 'ضريبة المبيعات'
      : 'عام';
    console.log(`  ${label}: ${n}`);
  }
}

main().catch((e) => {
  console.error('فشل:', e.message);
  process.exit(1);
});
