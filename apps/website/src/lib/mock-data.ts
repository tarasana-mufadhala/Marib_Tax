export interface Announcement {
  id: string;
  title: string;
  summary: string;
  category: 'إعلان مهم' | 'تعميم ضريبي' | 'تنبيه امتثال' | 'قرار إداري';
  date: string;
  isImportant?: boolean;
}

export interface TaxService {
  id: string;
  title: string;
  description: string;
  category: 'تسجيل وقيد' | 'إقرارات وربط' | 'شهادات وبراءات' | 'اعتراضات وشكاوى';
  requiredDocuments: string[];
  processingDays: number;
  fees: string;
  icon: string;
}

export interface TaxForm {
  id: string;
  title: string;
  code: string;
  category: 'إقرارات' | 'تسجيل' | 'اعتراضات' | 'إعفاءات';
  fileSize: string;
  downloadUrl: string;
}

export interface TaxLaw {
  id: string;
  title: string;
  lawNumber: string;
  year: string;
  category: 'قانون' | 'ائحة تنفيذية' | 'تعديل تشريعي';
  summary: string;
  downloadUrl: string;
}

export interface TaxDecision {
  id: string;
  decisionNumber: string;
  title: string;
  issueDate: string;
  issuer: string;
  summary: string;
  status: 'نافذ' | 'معدل' | 'قيد المراجعة';
}

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_SERVICES: TaxService[] = [];
