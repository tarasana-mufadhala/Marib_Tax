import { api, setToken, logout as apiLogout } from './api-client';

export interface RegisterRequest {
  phone: string;
  firstName: string;
  lastName: string;
  tradeName?: string;
  legalEntity?: string;
  password?: string;
  verificationToken?: string;
}

export const login = async (phone: string, password?: string) => {
  const response = await api.auth.login({ phone, password });
  if (response.token) {
    setToken(response.token);
    return response;
  }
  throw new Error('فشل تسجيل الدخول');
};

/** دخول الموظفين بالبريد — المسار العامل حالياً. */
export const loginWithEmail = async (email: string, password: string) => {
  const response = await api.auth.loginWithEmail({ email, password });
  if (response.token) {
    setToken(response.token);
    return response;
  }
  throw new Error('فشل تسجيل الدخول');
};

export const register = async (data: RegisterRequest) => {
  const response = await api.auth.register({
    phone: data.phone,
    verificationToken: data.verificationToken ?? '',
    password: data.password ?? '',
    displayName: [data.firstName, data.lastName].filter(Boolean).join(' ') || undefined,
  });
  if (response.token) {
    setToken(response.token);
    return response;
  }
  throw new Error('فشل إنشاء الحساب');
};

export const requestOtp = async (phone: string) => {
  return await api.auth.requestOtp({ phone });
};

export const verifyOtp = async (phone: string, code: string) => {
  const response = await api.auth.verifyOtp({ phone, code });
  if (response.token) {
    setToken(response.token);
  }
  return response;
};

export const resetPassword = async (phone: string, code: string, newPassword: string) => {
  return await api.auth.resetPassword({ phone, code, newPassword });
};

export const logout = () => {
  apiLogout();
};

export interface CurrentUser {
  userProfileId: string;
  displayName: string | null;
  staffCode: string | null;
  title: string | null;
  roles: { code: string; nameAr: string | null }[];
  permissions: string[];
}

/**
 * المستخدم الحالي من الخادم بناءً على رمز الجلسة — لا بيانات مستخدم مثبّتة في الواجهة.
 * يعيد null إن لم تكن هناك جلسة صالحة.
 */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await api.admin.me();
  } catch {
    return null;
  }
}

export function logoutUser() {
  logout();
}
