import { notFound } from 'next/navigation';
import { evaluateAdminAccess } from '@/lib/admin-access';

export default function AdminPage() {
  const decision = evaluateAdminAccess();
  if (!decision.allowed) notFound();

  return (
    <main className="admin-shell" style={{ padding: '2rem', direction: 'rtl' }}>
      <h1>لوحة تحكم المسؤول</h1>
      <p>مرحباً بك في لوحة الإدارة لمكتب الضرائب بمحافظة مأرب.</p>
    </main>
  );
}

