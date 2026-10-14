import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import {
  Card,
  CardContent,
  Badge,
  Button,
  DownloadIcon,
  FileTextIcon,
  ScaleIcon,
  ScrollTextIcon,
  HelpCircleIcon,
} from '@marib-tax/web-ui';
import type { PublicLibraryDocument } from '@/lib/api-client';

/**
 * صفحة نوع ضريبة (دخل / مبيعات).
 *
 * موقع المصلحة القديم كان مُنظَّماً بهذا المحور: صفحتا `incometaxes`
 * و`salestaxes` وحدهما حملتا 49 من أصل 61 مستنداً — لأن المكلف يبحث بنوع
 * الضريبة التي تخصّه لا بنوع المستند الإداري. تجمع هذه الصفحة كل ما يخص
 * النوع الواحد مرتّباً بأقسامه.
 */

const SECTIONS: {
  category: string;
  title: string;
  description: string;
  Icon: typeof FileTextIcon;
}[] = [
  {
    category: 'law',
    title: 'القوانين واللوائح',
    description: 'النصوص القانونية الحاكمة',
    Icon: ScaleIcon,
  },
  {
    category: 'decision',
    title: 'القرارات والتعاميم',
    description: 'القرارات الصادرة عن المصلحة',
    Icon: ScrollTextIcon,
  },
  {
    category: 'form',
    title: 'النماذج والإقرارات',
    description: 'الاستمارات المعتمدة للتعبئة والتقديم',
    Icon: FileTextIcon,
  },
  {
    category: 'guide',
    title: 'الأدلة الإرشادية',
    description: 'شروح إجراءات المصلحة خطوةً بخطوة',
    Icon: HelpCircleIcon,
  },
];

export interface TaxTopicPageProps {
  title: string;
  subtitle: string;
  documents: PublicLibraryDocument[];
}

export function TaxTopicPage({ title, subtitle, documents }: TaxTopicPageProps) {
  const byCategory = new Map<string, PublicLibraryDocument[]>();
  for (const document of documents) {
    const list = byCategory.get(document.category) ?? [];
    list.push(document);
    byCategory.set(document.category, list);
  }

  const populated = SECTIONS.filter(
    (section) => (byCategory.get(section.category) ?? []).length > 0,
  );

  return (
    <div className="min-h-screen bg-[var(--usr-bg)] flex flex-col">
      <PublicHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12">
        <header className="border-r-4 border-[var(--usr-gold)] pr-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--usr-primary-dark)]">
            {title}
          </h1>
          <p className="text-sm text-[var(--usr-muted)] mt-2 leading-relaxed">
            {subtitle}
          </p>
          <p className="text-xs text-[var(--usr-muted)] mt-3">
            {documents.length} مستنداً متاحاً للتحميل
          </p>
        </header>

        {populated.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileTextIcon size={40} className="mx-auto text-[var(--usr-muted)] mb-3" />
              <p className="text-sm text-[var(--usr-primary-dark)] font-semibold">
                لا توجد مستندات منشورة في هذا القسم بعد
              </p>
              <p className="text-xs text-[var(--usr-muted)] mt-1">
                تُضاف المستندات تباعاً من إدارة المكتب
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {populated.map((section) => {
              const items = byCategory.get(section.category) ?? [];
              const { Icon } = section;
              return (
                <section key={section.category}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 rounded-xl bg-[var(--usr-primary-soft)] flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-[var(--usr-primary)]" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold font-display text-[var(--usr-primary-dark)]">
                        {section.title}
                        <span className="text-sm font-normal text-[var(--usr-muted)] mr-2">
                          ({items.length})
                        </span>
                      </h2>
                      <p className="text-xs text-[var(--usr-muted)]">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((document) => (
                      <DocumentRow key={document.id} document={document} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}

function DocumentRow({ document }: { document: PublicLibraryDocument }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-[var(--usr-gold-soft)] flex items-center justify-center shrink-0 mt-0.5">
          <FileTextIcon size={17} className="text-[var(--usr-gold-dark)]" />
        </span>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--usr-primary-dark)] leading-snug">
            {document.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {document.version && (
              <Badge variant="outline">{document.version}</Badge>
            )}
            <span className="text-[11px] text-[var(--usr-muted)]">
              {formatSize(document.sizeKb)}
            </span>
            {document.publishedAt && document.publishedAt !== '—' && (
              <span className="text-[11px] text-[var(--usr-muted)]">
                {document.publishedAt}
              </span>
            )}
          </div>
        </div>

        <a
          href={document.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button variant="outline" size="sm" className="gap-1.5">
            <DownloadIcon size={14} />
            <span className="hidden sm:inline">تحميل</span>
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}

/** الحجم بوحدة مقروءة: المكلف يقرّر التحميل بناءً عليه على وصلة بطيئة. */
function formatSize(sizeKb: number): string {
  if (sizeKb >= 1024) return `${(sizeKb / 1024).toFixed(1)} ميغابايت`;
  return `${sizeKb} كيلوبايت`;
}
