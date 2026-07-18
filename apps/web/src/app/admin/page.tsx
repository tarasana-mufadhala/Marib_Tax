import { notFound } from 'next/navigation';
import { evaluateAdminAccess } from '@/lib/admin-access';

export default function AdminPage(): never {
  const decision = evaluateAdminAccess();
  if (!decision.allowed) notFound();
  return notFound();
}
