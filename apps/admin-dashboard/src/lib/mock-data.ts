export interface Taxpayer {
  id: string;
  tin: string;
  tradeName: string;
  ownerName: string;
  phone: string;
  governorate: string;
  directorate: string;
  activityType: string;
  registrationDate: string;
  status: 'نشط' | 'قيد المراجعة' | 'موقوف' | 'متأخر';
  totalDues: number;
}

export interface RequestItem {
  id: string;
  requestNumber: string;
  taxpayerName: string;
  tin: string;
  serviceType: string;
  submissionDate: string;
  status: 'مقدم' | 'تحت_المعالجة' | 'قيد_النزول' | 'بانتظار السداد' | 'مكتمل' | 'مرفوض';
  assignedEmployee?: string;
  notes?: string;
}

export interface FieldVisit {
  id: string;
  visitNumber: string;
  requestId: string;
  taxpayerName: string;
  inspectorName: string;
  scheduledDate: string;
  status: 'مجدولة' | 'قيد التنفيذ' | 'مكتملة' | 'ملغاة';
  findings?: string;
}

export interface TaxDue {
  id: string;
  tin: string;
  taxpayerName: string;
  taxYear: number;
  amount: number;
  dueDate: string;
  status: 'غير مسدد' | 'مسدد جزئياً' | 'مسدد بالكامل' | 'متأخر';
}

export interface DataImportJob {
  id: string;
  sourceSystem: 'LEGACY_SQL' | 'EXCEL_SHEET' | 'CUSTOM_CSV';
  fileName: string;
  recordCount: number;
  importedCount: number;
  failedCount: number;
  status: 'قيد المعالجة' | 'مكتمل' | 'فشل الجزئي' | 'فشل كامل';
  timestamp: string;
}

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

export const INITIAL_TAXPAYERS: Taxpayer[] = [];

export const INITIAL_REQUESTS: RequestItem[] = [];

export const INITIAL_VISITS: FieldVisit[] = [];

export const INITIAL_DUES: TaxDue[] = [];

export const INITIAL_IMPORTS: DataImportJob[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_SERVICES: TaxService[] = [];
