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
    const errData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errData.message || `خطأ في الاتصال بالسيرفر (${res.status})`);
  }

  return await res.json();
}

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

    getTaxpayers: async (): Promise<Taxpayer[]> => {
      const rows = await apiRequest<any[]>('/admin/taxpayers');
      return (rows ?? []).map((r) => ({
        id: String(r.id),
        tin: r.public_ref ?? '—',
        tradeName: r.display_name ?? '—',
        ownerName: r.owner_name ?? '—',
        phone: r.primary_phone ?? '—',
        governorate: r.governorate_name ?? '—',
        directorate: r.directorate_name ?? '—',
        activityType: r.activity_type_name ?? '—',
        registrationDate: fmtDate(r.created_at),
        status: mapTaxpayerStatus(r.status_code),
        totalDues: Number(r.total_dues ?? 0),
      }));
    },

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

    getDues: async (): Promise<TaxDue[]> => {
      const rows = await apiRequest<any[]>('/admin/dues');
      return (rows ?? []).map((r) => {
        const dateStr = r.assessed_at ?? r.created_at ?? '';
        return {
          id: String(r.id),
          tin: r.taxpayer_ref ?? '—',
          taxpayerName: r.taxpayer_name ?? '—',
          taxYear: dateStr ? new Date(dateStr).getFullYear() : new Date().getFullYear(),
          amount: Number(r.amount ?? 0),
          dueDate: dateStr,
          status: mapDueStatus(r.status_code),
          requestRef: r.request_ref ?? undefined,
        } as TaxDue;
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

    createStaffUser: async (data: { displayName: string; phone: string; password: string; title?: string; roleCode?: string }) => {
      return await apiRequest<any>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

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
