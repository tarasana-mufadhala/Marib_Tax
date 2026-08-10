import type {
  Announcement,
  TaxService,
} from './mock-data';

export * from './mock-data';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
};

const fmtDate = (value: string | null | undefined): string => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('ar-YE');
};

async function safeFetch<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${getBaseUrl()}${endpoint}`, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export interface PublicLibraryDocument {
  id: string;
  title: string;
  category: string;
  version: string;
  sizeKb: number;
  mimeType: string;
  publishedAt: string;
  fileUrl: string;
}

export interface PublicContentPage {
  key: string;
  title: string;
  body: string;
}

export interface PublicFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
}

export interface PublicStats {
  taxpayersCount: number;
  servicesCount: number;
  documentsCount: number;
}

export const publicApi = {
  getAnnouncements: async (): Promise<Announcement[]> => {
    const rows = await safeFetch<any[]>('/public/announcements', []);
    return (rows ?? []).map((r) => ({
      id: String(r.id),
      title: r.title ?? '',
      summary: r.body ?? '',
      category: (Number(r.priority ?? 0) > 50 ? 'إعلان مهم' : 'تعميم ضريبي') as any,
      date: fmtDate(r.published_at ?? r.created_at),
      isImportant: Number(r.priority ?? 0) > 0,
    }));
  },

  getServices: async (): Promise<TaxService[]> => {
    const rows = await safeFetch<any[]>('/public/services', []);
    return (rows ?? []).map((r) => ({
      id: String(r.id),
      title: r.name ?? '',
      description: r.description ?? '',
      category: 'تسجيل وقيد' as const,
      requiredDocuments: [],
      processingDays: 0,
      fees: '',
      icon: r.code ?? '',
    }));
  },

  getContentPage: async (key: string): Promise<PublicContentPage | null> => {
    const row = await safeFetch<any>(`/public/content-pages/${key}`, null);
    if (!row?.key) return null;
    return { key: row.key, title: row.title ?? '', body: row.body ?? '' };
  },

  getLibraryDocuments: async (category?: string): Promise<PublicLibraryDocument[]> => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const rows = await safeFetch<any[]>(`/public/library-documents${query}`, []);
    return (rows ?? []).map((r) => ({
      id: String(r.id),
      title: r.title ?? '',
      category: r.category_code ?? 'form',
      version: r.version_label ?? '',
      sizeKb: Math.max(1, Math.ceil(Number(r.file_size_bytes ?? 0) / 1024)),
      mimeType: r.mime_type ?? '',
      publishedAt: fmtDate(r.published_at),
      fileUrl: `${getBaseUrl()}/public/library-documents/${r.id}/file`,
    }));
  },

  getFaqs: async (): Promise<PublicFaq[]> => {
    const rows = await safeFetch<any[]>('/public/faqs', []);
    return (rows ?? []).map((r) => ({
      id: String(r.id),
      question: r.question ?? '',
      answer: r.answer ?? '',
      category: r.category_code ?? 'general',
      displayOrder: Number(r.display_order ?? 0),
    }));
  },

  getStats: async (): Promise<PublicStats> => {
    return await safeFetch<PublicStats>('/public/stats', {
      taxpayersCount: 0,
      servicesCount: 0,
      documentsCount: 0,
    });
  },

  submitContactMessage: async (data: { fullName: string; phone: string; email?: string; message: string }) => {
    try {
      const res = await fetch(`${getBaseUrl()}/public/contact-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return { error: 'تعذر الاتصال بالخادم' };
    }
  },
};
