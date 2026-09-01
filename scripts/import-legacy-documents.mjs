/**
 * إدخال مستندات موقع مصلحة الضرائب القديم (tax.gov.ye) إلى مكتبة الموقع.
 *
 * يمر عبر نقطة الأدمن نفسها لا عبر القاعدة مباشرة، فيخضع للتحقق والتدقيق
 * كأي رفع يدوي. idempotent: يتخطى ما رُفع سابقاً بنفس العنوان.
 *
 * التشغيل من جذر المستودع:
 *   node scripts/import-legacy-documents.mjs
 *   node scripts/import-legacy-documents.mjs --dry-run   # للمعاينة بلا رفع
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
// النسخة المضغوطة إن وُجدت: المسوحات الأصلية تصل إلى 50 ميغابايت وهي غير
// قابلة للتنزيل على سرعات الإنترنت المحلية. الأصل يبقى محفوظاً كما هو.
const COMPRESSED_DIR = path.join(ROOT, 'downloads', 'tax_gov_ye_documents_compressed');
const ORIGINAL_DIR = path.join(ROOT, 'downloads', 'tax_gov_ye_documents');
const DOCS_DIR = fs.existsSync(COMPRESSED_DIR) ? COMPRESSED_DIR : ORIGINAL_DIR;
const MANIFEST_DIR = ORIGINAL_DIR;
const API = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';
const DRY_RUN = process.argv.includes('--dry-run');

const readEnv = (key) => {
  const content = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  const line = content.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') : null;
};

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@marib-tax.gov.ye';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Marib@2026';

/**
 * تصنيف المستند وعنوانه العربي.
 *
 * عناوين الـ manifest عامة («المبيعات»، «ضرائب الدخل») لأنها أسماء أقسام في
 * الموقع القديم لا عناوين مستندات. نبني عنواناً مفيداً من رقم القرار وسنته
 * في اسم الملف، ونُبقي القسم كسياق.
 */
function classify(fileName, manifestTitle) {
  const base = decodeURIComponent(fileName).replace(/\.(pdf|zip)$/i, '');
  const section = (manifestTitle ?? '').trim();
  // عنوان مخصّص إن وُجد: أسماء الأقسام في الموقع القديم عامة ولا تصلح عنواناً.
  const override = FORM_TITLES[base];

  // قرار برقم وسنة: 214-2014.pdf
  const decision = /^(\d+)-(\d{4})$/.exec(base);
  if (decision) {
    const [, number, year] = decision;
    const context = section && !/^(المبيعات|ضرائب الدخل)$/.test(section) ? ` — ${section}` : '';
    const scope = section === 'المبيعات' ? 'ضريبة المبيعات'
      : section === 'ضرائب الدخل' ? 'ضريبة الدخل'
      : '';
    return {
      category: 'decision',
      title: `قرار رقم ${number} لسنة ${year}${scope ? ` — ${scope}` : context}`,
      version: year,
    };
  }

  if (/^دليل|guide|guid|دليل/i.test(base) || /دليل/.test(section)) {
    return { category: 'guide', title: override ?? cleanTitle(section || base), version: '1.0' };
  }

  if (/forms|iqrar|Commercial|Industrial|Service|Telecom|big-mid/i.test(base)) {
    return { category: 'form', title: override ?? cleanTitle(section || base), version: '1.0' };
  }

  if (/قرار|law|قانون/.test(base) || /قرار/.test(section)) {
    return { category: 'law', title: override ?? cleanTitle(section || base), version: '1.0' };
  }

  // ما تبقّى دراسات ونشرات: تُصنّف أدلة لا نماذج، فهي ليست استمارات تُعبَّأ.
  return { category: 'guide', title: override ?? cleanTitle(section || base), version: '1.0' };
}

/** عناوين عربية للنماذج التي أسماؤها إنجليزية في الموقع القديم. */
const FORM_TITLES = {
  Commercial: 'إقرار ضريبة الدخل — النشاط التجاري',
  Industrial: 'إقرار ضريبة الدخل — النشاط الصناعي',
  Service: 'إقرار ضريبة الدخل — النشاط الخدمي والمقاولات',
  Telecom1: 'إقرار ضريبة الدخل — الاتصالات',
  'big-mid': 'إقرار ضريبة الدخل — كبار ومتوسطي المكلفين',
  salestaxforms: 'نماذج ضريبة المبيعات',
  'iqrar-guid': 'دليل الإقرارات الضريبية',
  'acknowledgement-guide': 'دليل الإقرارات والاعترافات الضريبية',
  'reg-guid': 'دليل التسجيل الضريبي',
  'collect-guid': 'دليل التحصيل',
  'conect-guid': 'دليل الربط الضريبي',
  'mnazaa-guide': 'دليل المنازعات الضريبية',
  electronicservicess: 'دليل الخدمات الإلكترونية',
  'recordsbills-guide': 'دليل الدفاتر والفواتير — ضريبة المبيعات',
  'register-guide': 'دليل التسجيل — ضريبة المبيعات',
  'rightsduties-guide': 'دليل حقوق وواجبات المكلف',
  'آلية-التعامل-الضريبي-مع-مدخلات-الإنتاج-في-المنافذ-الجمرك_compressed':
    'آلية التعامل الضريبي مع مدخلات الإنتاج في المنافذ الجمركية',
  'قرار-سقف-الضمانات-البنكية-1.Pdf': 'قرار سقف الضمانات البنكية',
  'امل-القيلي': 'دراسة ضريبية — أمل القيلي',
  'خالد-المرتضى': 'دراسة ضريبية — خالد المرتضى',
  '‏‏دليل المستفيد مرفوع للطباعة 33': 'دليل المستفيد',
  '‏‏دليل-نظام-الخصم-والإضافة-39': 'دليل نظام الخصم والإضافة',
  '‏‏‏‏دليل-الاسترداد-18': 'دليل الاسترداد',
};

function cleanTitle(raw) {
  return decodeURIComponent(raw)
    .replace(/[-_]+/g, ' ')
    .replace(/\.(pdf|zip)$/i, '')
    .replace(/&#8230;/g, '…')
    .replace(/\s+/g, ' ')
    .replace(/[‎‏]/g, '')
    .trim();
}

/**
 * إعادة محاولة مع تراجع أُسّي.
 *
 * الوصلة إلى الخدمات السحابية بطيئة ومتقطّعة هنا، وفشل نداء واحد لا يعني
 * أن العملية كلها يجب أن تسقط بعد رفع عشرات الملفات.
 */
async function withRetry(label, action, attempts = 6) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        const waitMs = 2000 * attempt;
        console.log(`    … ${label}: محاولة ${attempt} فشلت، إعادة بعد ${waitMs / 1000}ث`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }
  throw lastError;
}

async function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    throw new Error(`مجلد المستندات غير موجود: ${DOCS_DIR}`);
  }

  const manifest = JSON.parse(
    fs.readFileSync(path.join(MANIFEST_DIR, 'complete_documents_manifest.json'), 'utf8'),
  );
  const titleByFile = new Map(
    manifest.map((d) => [decodeURIComponent(d.url.split('/').pop()), d.title]),
  );

  // الملفات المضغوطة استمارات مصدرية لا تصلح للعرض العام.
  const files = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.pdf'))
    .sort();

  console.log(`وُجد ${files.length} مستند PDF.\n`);

  const planned = files.map((file) => ({
    file,
    ...classify(file, titleByFile.get(file)),
  }));

  const byCategory = planned.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
  console.log('التصنيف:', JSON.stringify(byCategory, null, 0));
  console.log();

  if (DRY_RUN) {
    for (const p of planned) {
      console.log(`  [${p.category}] ${p.title}   (${p.file})`);
    }
    console.log('\nمعاينة فقط — لم يُرفع شيء.');
    return;
  }

  const accessToken = await withRetry('دخول المدير', async () => {
    const res = await fetch(`${API}/auth/login/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).accessToken;
  });

  const existing = await fetch(`${API}/admin/library-documents`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const existingTitles = new Set(
    ((await existing.json()) ?? []).map((d) => (d.title ?? '').trim()),
  );

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of planned) {
    if (existingTitles.has(item.title)) {
      skipped++;
      continue;
    }

    const buffer = fs.readFileSync(path.join(DOCS_DIR, item.file));
    // يُبنى في كل محاولة: جسم FormData يُستهلك مرة واحدة ولا يُعاد إرساله.
    const buildForm = () => {
      const form = new FormData();
      form.append('title', item.title);
      form.append('category', item.category);
      form.append('version', item.version);
      form.append('file', new Blob([buffer], { type: 'application/pdf' }), item.file);
      return form;
    };

    let body;
    try {
      body = await withRetry(item.title, async () => {
        const res = await fetch(`${API}/admin/library-documents`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: buildForm(),
        });
        return res.json();
      });
    } catch (error) {
      failed++;
      const reason = error?.message ?? error?.error?.message ?? JSON.stringify(error);
      console.log(`  ✘ ${item.title} — ${String(reason).slice(0, 120)}`);
      continue;
    }

    if (body?.success) {
      uploaded++;
      // يُنشر مباشرة: هذه مستندات كانت منشورة على الموقع الرسمي القديم.
      await fetch(`${API}/admin/library-documents/${body.documentId}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => undefined);
      console.log(`  ✔ [${item.category}] ${item.title}`);
      // تمهُّل بين الرفعات: الوصلة بطيئة وتشبّعها يُسقط تجمّع اتصالات القاعدة.
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } else {
      failed++;
      console.log(`  ✘ ${item.title} — ${body?.error ?? res.status}`);
    }
  }

  console.log(`\nرُفع ${uploaded}، تُخطّي ${skipped} (موجود مسبقاً)، فشل ${failed}.`);
}

main().catch((e) => {
  console.error('فشل:', e.message);
  process.exit(1);
});
