export interface AdminUser {
  id: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'AUDITOR';
  permissions: string[];
}

export function canAccessSection(user: AdminUser | null, section: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  
  switch (section) {
    case 'users':
      return false;
    case 'reports':
    case 'taxpayers':
    case 'requests':
      return true;
    default:
      return true;
  }
}
