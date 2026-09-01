export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: any): string => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401: return 'جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى';
      case 403: return 'ليس لديك صلاحية للوصول إلى هذه البيانات';
      case 404: return 'البيانات المطلوبة غير موجودة';
      case 422: return `بيانات غير صالحة: ${error.details?.message || ''}`;
      case 429: return 'عدد المحاولات كبير جداً، يرجى الانتظار قليلاً';
      default: return error.message || 'حدث خطأ غير متوقع';
    }
  }
  return error?.message || 'حدث خطأ في الاتصال بالخادم';
};
