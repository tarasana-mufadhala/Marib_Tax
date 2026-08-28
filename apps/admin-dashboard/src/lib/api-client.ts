import type {
  Taxpayer,
  RequestItem,
  FieldVisit,
  TaxDue,
} from './mock-data';

const REQUEST_STATUS_AR: Record<string, RequestItem['status']> = {
  draft: 'مقدم',
  submitted: 'مقدم',
  received: 'مقدم',
  under_review: 'تحت_المعالجة',
  info_required: 'تحت_المعالجة',
  field_visit_pending: 'قيد_النزول',
  field_visit: 'قيد_النزول',
  payment_required: 'بانتظار السداد',
  attendance_required: 'تحت_المعالجة',
  completed: 'مكتمل',
  rejected: 'مرفوض',
  cancelled: 'مرفوض',
  archived: 'مكتمل',
};

const mapRequestStatus = (code: string | null | undefined): RequestItem['status'] => {
  if (!code) return 'مقدم';
  const known: RequestItem['status'][] = ['مقدم', 'تحت_المعالجة', 'قيد_النزول', 'بانتظار السداد', 'مكتمل', 'مرفوض'];
  if (known.includes(code as RequestItem['status'])) return code as RequestItem['status'];
  return REQUEST_STATUS_AR[code.toLowerCase()] ?? 'مقدم';
};

const VISIT_STATUS_AR: Record<string, FieldVisit['status']> = {
  scheduled: 'مجدولة',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
};

const mapVisitStatus = (code: string | null | undefined): FieldVisit['status'] => {
  if (!code) return 'مجدولة';
  const known: FieldVisit['status'][] = ['مجدولة', 'قيد التنفيذ', 'مكتملة', 'ملغاة'];
  if (known.includes(code as FieldVisit['status'])) return code as FieldVisit['status'];
  return VISIT_STATUS_AR[code.toLowerCase()] ?? 'مجدولة';
};

const fmtDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('ar-YE');
};

const TAXPAYER_STATUS_AR: Record<string, Taxpayer['status']> = {
  active: 'نشط',
  under_review: 'قيد المراجعة',
  suspended: 'موقوف',
  delinquent: 'متأخر',
  inactive: 'موقوف',
};

const mapTaxpayerStatus = (code: string | null | undefined): Taxpayer['status'] => {
  if (!code) return 'نشط';
  const known: Taxpayer['status'][] = ['نشط', 'قيد المراجعة', 'موقوف', 'متأخر'];
  if (known.includes(code as Taxpayer['status'])) return code as Taxpayer['status'];
  return TAXPAYER_STATUS_AR[code.toLowerCase()] ?? 'نشط';
};

const mapDueStatus = (code: string | null | undefined): TaxDue['status'] => {
  switch ((code ?? '').toLowerCase()) {
    case 'paid':
    case 'مسدد':
    case 'مسدد بالكامل':
      return 'مسدد بالكامل';
    case 'partial':
    case 'partially_paid':
    case 'مسدد جزئياً':
      return 'مسدد جزئياً';
    case 'overdue':
    case 'late':
    case 'متأخر':
      return 'متأخر';
    default:
      return 'غير مسدد';
  }
};

export * from './mock-data';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
};

let authToken: string | null = null;

export const setToken = (token: string | null) => {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('marib_tax_token', token);
      document.cookie = `marib_tax_token=${token}; path=/; max-age=86400; SameSite=Lax`;
    } else {
      localStorage.removeItem('marib_tax_token');
      document.cookie = 'marib_tax_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }
};

export const getToken = (): string | null => {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('marib_tax_token');
  }
  return authToken;
};

export const logout = () => {
  setToken(null);
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

const ERROR_MESSAGES_AR: Record<string, string> = {
  AUTHENTICATION_REQUIRED: 'بيانات الدخول غير صحيحة',
  PERMISSION_DENIED: 'لا تملك صلاحية تنفيذ هذه العملية',
  ACCESS_DENIED: 'لا تملك صلاحية تنفيذ هذه العملية',
  BAD_REQUEST: 'البيانات المُدخلة غير صحيحة',
  VALIDATION_FAILED: 'البيانات المُدخلة غير مطابقة للمطلوب',
  RESOURCE_NOT_FOUND: 'العنصر المطلوب غير موجود',
  RESOURCE_CONFLICT: 'العملية تتعارض مع بيانات موجودة مسبقاً',
  RATE_LIMITED: 'محاولات كثيرة، يرجى الانتظار قليلاً',
  SERVICE_UNAVAILABLE: 'الخدمة غير متاحة حالياً',
  INTERNAL_ERROR: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً',
};

const hasArabic = (text: string) => /[؀-ۿ]/.test(text);

/**
 * الـ API يغلّف الخطأ في `{ error: { code, message } }`.
 *
 * كانت هذه الدالة تقرأ `message` من جذر الجسم فتجده دائماً undefined،
 * فيظهر للمستخدم «خطأ في الاتصال بالسيرفر (400)» بدل السبب الحقيقي.
 */
async function readApiError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const error = body?.error;

    if (typeof error === 'string' && error.trim() !== '') return error;

    if (error && typeof error === 'object') {
      const message = typeof error.message === 'string' ? error.message : '';
      // الرسائل العربية من الخادم مكتوبة للمستخدم أصلاً، فلا تُستبدل.
      if (message && hasArabic(message)) return message;
      const mapped = ERROR_MESSAGES_AR[error.code as string];
      if (mapped) return mapped;
      if (message) return message;
    }

    if (typeof body?.message === 'string' && body.message.trim() !== '') {
      return body.message;
    }
  } catch {
    // رد غير JSON — نكمل للرسالة الافتراضية.
  }
  return `تعذّر تنفيذ العملية (${res.status})`;
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const res = await fetch(`${baseUrl}${endpoint}`, config);

  if (res.status === 401) {
    // Auth endpoints return 401 for bad credentials — surface the error
    // instead of force-redirecting (which would hide the message).
    if (endpoint.startsWith('/auth/')) {
      throw new Error('بيانات الدخول غير صحيحة');
    }
    logout();
    throw new Error('جلسة العمل انتهت، يرجى إعادة تسجيل الدخول');
  }

  if (!res.ok) {
    throw new Error(await readApiError(res));
  }

  return await res.json();
}

/** انتقال حالة متاح على ملف مكلف، كما يحدّده الخادم. */
export interface TaxpayerTransition {
  code: string;
  label: string;
  reasonRequired: boolean;
}

/** صف في سجل المكلفين بلوحة الإدارة. */
export interface AdminTaxpayer {
  id: string;
  taxNumber: string | null;
  displayName: string;
  statusCode: string;
  statusLabel: string;
  createdAt: string;
  phone: string | null;
  email: string | null;
  activityCount: number;
  openRequests: number;
  allowedTransitions: TaxpayerTransition[];
}

export interface AdminTaxpayerDetails extends AdminTaxpayer {
  legalEntityName: string | null;
  /** حسابات الدخول المرتبطة بالملف، بهواتفها من خدمة الحسابات. */
  accounts: {
    userProfileId: string;
    displayName: string | null;
    phone: string | null;
    email: string | null;
    relationship: string;
    verificationStatus: string;
    linkedAt: string;
  }[];
  contacts: { type: string; value: string; isPrimary: boolean }[];
  activities: {
    id: string;
    publicRef: string | null;
    name: string | null;
    activityType: string | null;
    statusCode: string | null;
    createdAt: string;
    address: string | null;
    cityCode: string | null;
    districtCode: string | null;
  }[];
  history: {
    fromStatus: string | null;
    toStatus: string;
    fromLabel: string | null;
    toLabel: string;
    reason: string | null;
    changedAt: string;
    officerName: string | null;
  }[];
}

/** مستحق كما تعرضه لوحة الإدارة. */
export interface AdminDue {
  id: string;
  publicRef: string | null;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  currencyCode: string;
  statusCode: string;
  statusLabel: string;
  assessedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  taxpayerId: string;
  taxpayerName: string | null;
  taxpayerRef: string | null;
  requestRef: string | null;
  basisTypeCode: string | null;
  documentReference: string | null;
  editable: boolean;
  /** يمكن تسجيل سداد عليه — لم يُسدَّد بالكامل ولم يُلغَ. */
  payable: boolean;
  /** يمكن إلغاؤه — لم يُقبض منه شيء. */
  cancellable: boolean;
}

/** دفعة مقبوضة على مستحق. */
export interface DuePayment {
  id: string;
  publicRef: string | null;
  amount: number;
  receivedAt: string;
  statusCode: string;
  confirmedAt: string | null;
  officerName: string | null;
}

export interface DueCorrection {
  priorAmount: number;
  newAmount: number;
  currencyCode: string;
  reason: string;
  correctedAt: string;
  officerName: string | null;
}

/** تسميات البلاغات الستة، مطابِقة لما يعرضه التطبيق للمكلف. */
const BALAGH_TITLES: Record<string, string> = {
  'FR-201': 'إخطار إيقاف نشاط',
  'FR-202': 'إخطار خروج مستأجر أو إخلاء عقار',
  'FR-203': 'إخطار خروج عامل',
  'FR-204': 'إخطار تغيير عنوان النشاط',
  'FR-205': 'إخطار نقل ملكية عقار',
  'FR-206': 'إخطار تفعيل نشاط موقوف',
};

export const api = {
  auth: {
    login: async (credentials: { phone: string; password?: string }) => {
      const result = await apiRequest<{ accessToken: string; userProfileId: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: credentials.phone,
          password: credentials.password,
        }),
      });
      if (result?.accessToken) {
        setToken(result.accessToken);
      }
      return { token: result.accessToken, user: { id: result.userProfileId } };
    },

    // دخول الموظفين بالبريد — المسار العامل حالياً (مزود الهاتف معطّل في Supabase).
    loginWithEmail: async (credentials: { email: string; password: string }) => {
      const result = await apiRequest<{ accessToken: string; userProfileId: string }>('/auth/login/email', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });
      if (result?.accessToken) {
        setToken(result.accessToken);
      }
      return { token: result.accessToken, user: { id: result.userProfileId } };
    },

    requestOtp: async (data: { phone: string }) => {
      const result = await apiRequest<{ verificationId: string }>('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: data.phone }),
      });
      return { success: true, message: result.verificationId };
    },

    verifyOtp: async (data: { phone: string; code: string }) => {
      const result = await apiRequest<{ verificationToken: string }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: data.phone, code: data.code }),
      });
      return { token: null, verificationToken: result.verificationToken };
    },

    register: async (taxpayerData: { phone: string; verificationToken: string; password: string; displayName?: string }) => {
      const result = await apiRequest<{ userProfileId: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: taxpayerData.phone,
          verificationToken: taxpayerData.verificationToken,
          password: taxpayerData.password,
          displayName: taxpayerData.displayName ?? null,
        }),
      });
      return { token: null, user: { id: result.userProfileId } };
    },

    requestPasswordReset: async (data: { phone: string }) => {
      return await apiRequest<{ verificationId: string }>('/auth/password/reset/request', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: data.phone }),
      });
    },

    resetPassword: async (data: { phone: string; code: string; newPassword?: string }) => {
      return await apiRequest<{ success: boolean }>('/auth/password/reset/confirm', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: data.phone,
          code: data.code,
          newPassword: data.newPassword,
        }),
      });
    },
  },

  admin: {
    /** هوية المستخدم الحالي وصلاحياته من الخادم. */
    me: async () =>
      apiRequest<{
        userProfileId: string;
        displayName: string | null;
        staffCode: string | null;
        title: string | null;
        roles: { code: string; nameAr: string | null }[];
        permissions: string[];
      }>('/admin/me'),

    getRequests: async (): Promise<RequestItem[]> => {
      const rows = await apiRequest<any[]>('/admin/requests');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        requestNumber: r.public_ref ?? String(r.id).slice(0, 8),
        taxpayerName: r.taxpayer_name ?? '—',
        tin: r.taxpayer_ref ?? '—',
        serviceType: r.service_type_name ?? '—',
        submissionDate: fmtDate(r.submitted_at ?? r.created_at),
        status: mapRequestStatus(r.status_code),
      }));
    },

    /**
     * البلاغات الستة كما تصل من تطبيق المكلف. مصدرها جدول مستقل عن الطلبات،
     * فلها نداء مستقل — دمجها في `getRequests` كان يعني إخفاءها بالكامل.
     */
    /**
     * سجل المكلفين لشاشة الإدارة.
     *
     * التصفية والبحث على الخادم لا في المتصفح: تحميل السجل كاملاً ثم
     * تصفيته محلياً يعني إرسال بيانات كل المكلفين إلى كل جهاز موظف.
     */
    getAdminTaxpayers: async (params?: {
      status?: string;
      search?: string;
    }): Promise<AdminTaxpayer[]> => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.search) query.set('search', params.search);
      const suffix = query.toString() ? `?${query.toString()}` : '';
      return (await apiRequest<AdminTaxpayer[]>(`/admin/taxpayers${suffix}`)) ?? [];
    },

    getAdminTaxpayer: async (id: string): Promise<AdminTaxpayerDetails> =>
      apiRequest<AdminTaxpayerDetails>(`/admin/taxpayers/${id}`),

    changeTaxpayerStatus: async (
      id: string,
      toStatus: string,
      reason: string,
    ): Promise<void> => {
      await apiRequest(`/admin/taxpayers/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ toStatus, reason }),
      });
    },

    getBalaghs: async (): Promise<RequestItem[]> => {
      const rows = await apiRequest<any[]>('/admin/balaghs');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        requestNumber: r.public_ref ?? String(r.id).slice(0, 8),
        taxpayerName: r.taxpayer_name ?? '—',
        tin: r.taxpayer_ref ?? '—',
        serviceType: BALAGH_TITLES[r.balagh_type_code] ?? r.balagh_type_code,
        submissionDate: fmtDate(r.submitted_at ?? r.created_at),
        status: mapRequestStatus(r.status_code),
      }));
    },

    /** سجل المستحقات مع أسماء المكلفين والمسدَّد والمتبقي. */
    getAdminDues: async (params?: {
      status?: string;
      taxpayerId?: string;
      search?: string;
    }): Promise<AdminDue[]> => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.taxpayerId) query.set('taxpayerId', params.taxpayerId);
      if (params?.search) query.set('search', params.search);
      const suffix = query.toString() ? `?${query.toString()}` : '';
      return (await apiRequest<AdminDue[]>(`/admin/dues${suffix}`)) ?? [];
    },

    getDuePayments: async (id: string): Promise<DuePayment[]> =>
      (await apiRequest<DuePayment[]>(`/admin/dues/${id}/payments`)) ?? [],

    /**
     * تسجيل سداد بمبلغه. الحالة تُشتق على الخادم من مجموع ما قُبض، فلا
     * تُرسَل من هنا: «مسدَّد» بلا مبلغ مقابل يجعل الدفتر يكذب.
     */
    recordDuePayment: async (
      id: string,
      amount: number,
      notes: string,
    ): Promise<void> => {
      await apiRequest(`/dues/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount, notes: notes || null }),
      });
    },

    cancelDue: async (id: string, reason: string): Promise<void> => {
      await apiRequest(`/dues/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },

    getDueCorrections: async (id: string): Promise<DueCorrection[]> =>
      (await apiRequest<DueCorrection[]>(`/admin/dues/${id}/corrections`)) ?? [],

    /** تسجيل مستحق جديد على مكلف. */
    createDue: async (input: {
      taxpayerId: string;
      amount: number;
      basisTypeCode: string;
      documentReference?: string | null;
      serviceRequestId?: string | null;
    }): Promise<void> => {
      await apiRequest('/dues', {
        method: 'POST',
        body: JSON.stringify({
          taxpayerId: input.taxpayerId,
          amount: input.amount,
          currencyCode: 'YER',
          basisTypeCode: input.basisTypeCode,
          documentReference: input.documentReference || null,
          serviceRequestId: input.serviceRequestId || null,
        }),
      });
    },

    /** تعديل مبلغ مستحق قائم. السبب إلزامي ويُحفظ في سجل التعديلات. */
    correctDue: async (
      id: string,
      newAmount: number,
      reason: string,
    ): Promise<void> => {
      await apiRequest(`/dues/${id}/corrections`, {
        method: 'POST',
        body: JSON.stringify({ newAmount, reason }),
      });
    },

    updateDueStatus: async (dueId: string, status: string) => {
      return await apiRequest<any>(`/admin/dues/${dueId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    updateRequestStatus: async (requestId: string, status: string, notes?: string) => {
      return await apiRequest<RequestItem>(`/admin/requests/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
    },

    getUsers: async () => {
      const rows = await apiRequest<any[]>('/admin/users');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        name: r.display_name ?? r.staff_code ?? '—',
        role: r.role_name ?? r.title ?? '—',
        staffCode: r.staff_code ?? '—',
        status: r.is_active ? 'نشط' : 'معطّل',
      }));
    },

    getDecisions: async () => {
      const rows = await apiRequest<any[]>('/admin/decisions');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        outcome: r.outcome_code ?? '—',
        summary: r.decision_summary ?? '—',
        decidedAt: fmtDate(r.decided_at),
        requestRef: r.request_ref ?? '—',
        taxpayerName: r.taxpayer_name ?? '—',
      }));
    },

    getAnnouncements: async () => {
      const rows = await apiRequest<any[]>('/admin/announcements');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        title: r.title ?? '—',
        body: r.body ?? '',
        publishedAt: fmtDate(r.published_at ?? r.created_at),
        isActive: Boolean(r.is_active),
      }));
    },

    createAnnouncement: async (data: { title: string; body: string; priority?: number }) => {
      return await apiRequest<any>('/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    toggleAnnouncement: async (id: string) => {
      return await apiRequest<any>(`/admin/announcements/${id}/toggle`, {
        method: 'PATCH',
      });
    },

    deleteAnnouncement: async (id: string) => {
      return await apiRequest<any>(`/admin/announcements/${id}`, {
        method: 'DELETE',
      });
    },

    getFaqs: async () => {
      const rows = await apiRequest<any[]>('/admin/faqs');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        question: r.question ?? '',
        answer: r.answer ?? '',
        category: r.category_code ?? 'general',
        displayOrder: Number(r.display_order ?? 0),
        isActive: Boolean(r.is_active),
      }));
    },

    createFaq: async (data: { question: string; answer: string; category?: string; displayOrder?: number }) => {
      return await apiRequest<any>('/admin/faqs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    toggleFaq: async (id: string) => {
      return await apiRequest<any>(`/admin/faqs/${id}/toggle`, {
        method: 'PATCH',
      });
    },

    deleteFaq: async (id: string) => {
      return await apiRequest<any>(`/admin/faqs/${id}`, {
        method: 'DELETE',
      });
    },

    getImportJobs: async () => {
      const rows = await apiRequest<any[]>('/admin/imports');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        ref: r.public_ref ?? String(r.id).slice(0, 8),
        source: r.source_label ?? '—',
        status: r.status_code ?? '—',
        createdAt: fmtDate(r.created_at),
        totalRows: Number(r.total_rows ?? 0),
        validRows: Number(r.valid_rows ?? 0),
        rejectedRows: Number(r.rejected_rows ?? 0),
      }));
    },

    uploadImportFile: async (file: File, importType: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('importType', importType);
      const token = getToken();
      const res = await fetch(`${getBaseUrl()}/admin/imports/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || `خطأ في رفع الملف (${res.status})`);
      if (data?.error) throw new Error(data.error);
      return data as { jobId: string; total: number; valid: number; rejected: number; errors: { row: number; field: string; message: string }[] };
    },

    getImportJobDetails: async (id: string) => {
      const result = await apiRequest<any>(`/admin/imports/${id}`);
      if (!result?.job) return null;
      return {
        id: String(result.job.id),
        ref: result.job.public_ref ?? '—',
        source: result.job.source_label ?? '—',
        status: result.job.status_code ?? '—',
        createdAt: fmtDate(result.job.created_at),
        importType: result.importType ?? null,
        total: Number(result.total ?? 0),
        valid: Number(result.valid ?? 0),
        rejected: Number(result.rejected ?? 0),
        errors: (result.errors ?? []).map((e: any) => ({
          id: String(e.id),
          row: Number(e.row_number ?? 0),
          field: e.field_name ?? '',
          message: e.error_message ?? '',
        })),
      };
    },

    approveImport: async (id: string) => {
      const result = await apiRequest<any>(`/admin/imports/${id}/approve`, { method: 'POST' });
      if (result?.error) throw new Error(result.error);
      return result as { success: boolean; inserted: number; skipped: number };
    },

    rejectImport: async (id: string) => {
      const result = await apiRequest<any>(`/admin/imports/${id}/reject`, { method: 'POST' });
      if (result?.error) throw new Error(result.error);
      return result as { success: boolean };
    },

    getRequestDetails: async (id: string) => {
      const result = await apiRequest<any>(`/admin/requests/${id}/details`);
      if (!result?.request) return null;
      return {
        request: {
          id: String(result.request.id),
          requestNumber: result.request.public_ref ?? '—',
          taxpayerName: result.request.taxpayer_name ?? '—',
          tin: result.request.taxpayer_ref ?? '—',
          serviceType: result.request.service_type_name ?? '—',
          submissionDate: fmtDate(result.request.submitted_at ?? result.request.created_at),
          status: mapRequestStatus(result.request.status_code),
        },
        history: (result.history ?? []).map((h: any) => ({
          id: String(h.id),
          from: h.from_status_code ?? '—',
          to: h.to_status_code ?? '—',
          reason: h.reason ?? '',
          changedAt: fmtDate(h.changed_at),
        })),
      };
    },

    getRequestAttachments: async (requestId: string) => {
      const rows = await apiRequest<any[]>(`/admin/requests/${requestId}/attachments`);
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        filename: r.original_filename ?? 'ملف',
        mimeType: r.mime_type ?? '',
        sizeKb: Math.max(1, Math.ceil(Number(r.logical_file_size_bytes ?? 0) / 1024)),
        category: r.document_category_code ?? 'attachment',
        uploadedAt: fmtDate(r.linked_at),
      }));
    },

    uploadRequestAttachment: async (requestId: string, file: File, category: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      const token = getToken();
      const res = await fetch(`${getBaseUrl()}/admin/requests/${requestId}/attachments`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || `خطأ في رفع المرفق (${res.status})`);
      if (data?.error) throw new Error(data.error);
      return data as { success: boolean; attachmentId: string };
    },

    attachmentFileUrl: (attachmentId: string) => `${getBaseUrl()}/admin/attachments/${attachmentId}/file`,

    importFileUrl: (jobId: string) => `${getBaseUrl()}/admin/imports/${jobId}/file`,

    getLibraryDocuments: async () => {
      const rows = await apiRequest<any[]>('/admin/library-documents');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        title: r.title ?? '—',
        category: r.category_code ?? 'form',
        status: r.status ?? 'draft',
        version: r.version_label ?? '',
        sizeKb: Math.max(1, Math.ceil(Number(r.file_size_bytes ?? 0) / 1024)),
        mimeType: r.mime_type ?? '',
        createdAt: fmtDate(r.created_at),
        publishedAt: fmtDate(r.published_at),
      }));
    },

    uploadLibraryDocument: async (file: File, data: { title: string; category: string; version: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', data.title);
      formData.append('category', data.category);
      formData.append('version', data.version);
      const token = getToken();
      const res = await fetch(`${getBaseUrl()}/admin/library-documents`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.message || resData.error || `خطأ في رفع المستند (${res.status})`);
      if (resData?.error) throw new Error(resData.error);
      return resData as { success: boolean; documentId: string };
    },

    toggleLibraryDocument: async (id: string) => {
      const result = await apiRequest<any>(`/admin/library-documents/${id}/toggle`, { method: 'PATCH' });
      if (result?.error) throw new Error(result.error);
      return result;
    },

    libraryDocumentFileUrl: (id: string) => `${getBaseUrl()}/admin/library-documents/${id}/file`,

    getServices: async () => {
      const rows = await apiRequest<any[]>('/admin/services');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        code: r.code ?? '—',
        name: r.name ?? '—',
        description: r.description ?? '',
        isActive: Boolean(r.is_active),
      }));
    },

    toggleService: async (id: string) => {
      return await apiRequest<any>(`/admin/services/${id}/toggle`, { method: 'PATCH' });
    },

    getLegalEntities: async () => {
      const rows = await apiRequest<any[]>('/admin/legal-entities');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        name: r.legal_name ?? '—',
        classification: r.classification_code ?? '—',
        isActive: Boolean(r.is_active),
      }));
    },

    createLegalEntity: async (data: { legal_name: string }) => {
      return await apiRequest<any>('/admin/legal-entities', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getRoles: async () => {
      const rows = await apiRequest<any[]>('/admin/roles');
      return (rows ?? []).map((r) => ({ id: String(r.id), code: r.code, name: r.name_ar ?? r.code }));
    },

    /** كتالوج الصلاحيات مبوّباً بالمورد. */
    getPermissionCatalog: async () =>
      apiRequest<
        {
          resource: string;
          resourceLabel: string;
          permissions: { code: string; label: string; action: string }[];
        }[]
      >('/admin/permissions'),

    /** الأدوار مع صلاحيات كل دور وعدد حامليه. */
    getRolesDetailed: async () =>
      apiRequest<
        {
          id: string;
          code: string;
          nameAr: string | null;
          description: string | null;
          isSystem: boolean;
          permissionCodes: string[];
          holders: number;
        }[]
      >('/admin/roles/detailed'),

    createRole: async (data: {
      code: string;
      nameAr: string;
      description?: string;
      permissionCodes: string[];
    }) =>
      apiRequest<{ id: string }>('/admin/roles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateRolePermissions: async (roleId: string, permissionCodes: string[]) =>
      apiRequest<{ id: string }>(`/admin/roles/${roleId}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ permissionCodes }),
      }),

    /** إنشاء موظف بالبريد وإسناد أدوار له. */
    createStaffUser: async (data: {
      displayName: string;
      email: string;
      password: string;
      phone?: string;
      title?: string;
      roleCodes: string[];
    }) =>
      apiRequest<{ userProfileId: string }>('/admin/staff-users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateUserRoles: async (userProfileId: string, roleCodes: string[]) =>
      apiRequest<{ userProfileId: string }>(
        `/admin/staff-users/${userProfileId}/roles`,
        { method: 'PATCH', body: JSON.stringify({ roleCodes }) },
      ),

    getContentPages: async () => {
      const rows = await apiRequest<any[]>('/admin/content-pages');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        key: r.key ?? '—',
        title: r.title ?? '—',
        body: r.body ?? '',
        status: r.status ?? '—',
        updatedAt: fmtDate(r.updated_at ?? r.created_at),
      }));
    },

    saveContentPage: async (data: { key: string; title: string; body: string }) => {
      return await apiRequest<any>('/admin/content-pages', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getContactMessages: async () => {
      const rows = await apiRequest<any[]>('/admin/contact-messages');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        fullName: r.full_name ?? '—',
        phone: r.phone ?? '—',
        email: r.email ?? '',
        message: r.message ?? '',
        status: r.status === 'read' ? 'مقروءة' : 'جديدة',
        isNew: r.status !== 'read',
        createdAt: fmtDate(r.created_at),
      }));
    },

    markContactMessageRead: async (id: string) => {
      return await apiRequest<any>(`/admin/contact-messages/${id}/read`, {
        method: 'PATCH',
      });
    },
  },

  fieldVisits: {
    getVisits: async (): Promise<FieldVisit[]> => {
      const rows = await apiRequest<any[]>('/admin/visits');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        visitNumber: r.public_ref ?? String(r.id).slice(0, 8),
        requestId: r.service_request_id ?? '',
        taxpayerName: r.taxpayer_name ?? '—',
        inspectorName: r.inspector_name ?? '—',
        scheduledDate: fmtDate(r.scheduled_start_at ?? r.created_at),
        status: mapVisitStatus(r.status_code),
        findings: r.notes ?? undefined,
      }));
    },

    create: async (visitData: Partial<FieldVisit>) => {
      return await apiRequest<FieldVisit>('/visits', {
        method: 'POST',
        body: JSON.stringify(visitData),
      });
    },
  },

  reports: {
    getExecutiveMetrics: async () => {
      return await apiRequest<any>('/reports/executive-summary');
    },

    getReport: async (reportId: string, params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return await apiRequest<any>(`/reports/${reportId}${query}`);
    },
  },
};
