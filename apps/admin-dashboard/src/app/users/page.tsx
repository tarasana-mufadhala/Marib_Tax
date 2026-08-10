'use client';

import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Badge, Button, LoadingState, InboxIcon, Modal, Input } from '@marib-tax/web-ui';
import { api } from '@/lib/api-client';

interface StaffUser {
  id: string;
  name: string;
  role: string;
  staffCode: string;
  status: string;
}

interface RoleOption {
  id: string;
  code: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ displayName: '', phone: '', password: '', title: '', roleCode: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getUsers();
      setUsers(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر جلب المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    api.admin.getRoles().then((r) => setRoles(r || [])).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSaving(true);
      const result = await api.admin.createStaffUser({
        displayName: form.displayName.trim(),
        phone: form.phone.trim(),
        password: form.password,
        title: form.title.trim() || undefined,
        roleCode: form.roleCode || undefined,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setAddOpen(false);
      setForm({ displayName: '', phone: '', password: '', title: '', roleCode: '' });
      await fetchUsers();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="جاري الاتصال بالسيرفر وجلب المستخدمين..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-r-4 border-[var(--usr-gold)] pr-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--usr-primary-dark)]">إدارة المستخدمين والصلاحيات</h2>
          <p className="text-xs text-[var(--usr-muted)]">إضافة وتعيين أدوار موظفي مكتب الضرائب والصلاحيات الممنوحة</p>
        </div>
        <Button variant="gold" size="sm" onClick={() => setAddOpen(true)}>+ إضافة موظف جديد</Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {users.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم الكامل</TableHead>
              <TableHead>الدور / الصفة الوظيفية</TableHead>
              <TableHead>الرقم الوظيفي</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-bold text-[var(--usr-primary-dark)]">{u.name}</TableCell>
                <TableCell><Badge variant="gold">{u.role}</Badge></TableCell>
                <TableCell className="text-xs font-mono">{u.staffCode}</TableCell>
                <TableCell>
                  <Badge variant={u.status === 'نشط' ? 'success' : 'destructive'}>{u.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">تعديل الصلاحيات ⚙️</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--usr-border)] bg-white py-16 text-center">
          <InboxIcon className="h-10 w-10 text-[var(--usr-muted)]" />
          <p className="font-semibold text-[var(--usr-primary-dark)]">لا يوجد موظفون مسجلون بعد</p>
          <p className="max-w-md text-xs text-[var(--usr-muted)]">
            يُضاف موظفو المكتب وأدوارهم (مدير نظام / موظف مراجعة / موظف محتوى / قارئ تقارير) من هنا، وتُسجَّل كل عملياتهم في سجل التدقيق.
          </p>
        </div>
      )}

      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="إضافة موظف جديد"
        description="يُنشأ حساب دخول برقم الهاتف ويُسنَد الدور الوظيفي للموظف"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <Input
            label="الاسم الكامل"
            required
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="مثال: فاطمة الحسن"
          />
          <Input
            label="رقم الهاتف (مع رمز الدولة)"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+9677XXXXXXXX"
          />
          <Input
            label="كلمة المرور المؤقتة"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Input
            label="الصفة الوظيفية"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="مثال: موظف فحص ومراجعة"
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--usr-text)]">الدور / الصلاحيات</label>
            <select
              className="flex w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-sm"
              value={form.roleCode}
              onChange={(e) => setForm({ ...form, roleCode: e.target.value })}
            >
              <option value="">— بدون دور —</option>
              {roles.map((r) => (
                <option key={r.id} value={r.code}>{r.name}</option>
              ))}
            </select>
          </div>
          <Button variant="gold" size="lg" type="submit" className="w-full font-bold" disabled={saving}>
            {saving ? 'جاري الإنشاء...' : 'إنشاء حساب الموظف'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
