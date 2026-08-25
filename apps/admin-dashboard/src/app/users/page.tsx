'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Button,
  LoadingState,
  InboxIcon,
  Modal,
  Input,
} from '@marib-tax/web-ui';
import { api } from '@/lib/api-client';

interface StaffUser {
  id: string;
  name: string;
  role: string;
  staffCode: string;
  status: string;
}

interface RoleDetail {
  id: string;
  code: string;
  nameAr: string | null;
  description: string | null;
  isSystem: boolean;
  permissionCodes: string[];
  holders: number;
}

interface PermissionGroup {
  resource: string;
  resourceLabel: string;
  permissions: { code: string; label: string; action: string }[];
}

const emptyUserForm = {
  displayName: '',
  email: '',
  phone: '',
  password: '',
  title: '',
  roleCodes: [] as string[],
};

const emptyRoleForm = {
  code: '',
  nameAr: '',
  description: '',
  permissionCodes: [] as string[],
};

export default function UsersPage() {
  const [tab, setTab] = useState<'users' | 'roles'>('users');

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<RoleDetail[]>([]);
  const [catalog, setCatalog] = useState<PermissionGroup[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [roleForm, setRoleForm] = useState(emptyRoleForm);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRows, roleRows, permissionGroups] = await Promise.all([
        api.admin.getUsers(),
        api.admin.getRolesDetailed(),
        api.admin.getPermissionCatalog(),
      ]);
      setUsers(userRows ?? []);
      setRoles(roleRows ?? []);
      setCatalog(permissionGroups ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const submitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.admin.createStaffUser({
        displayName: userForm.displayName.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        phone: userForm.phone.trim() || undefined,
        title: userForm.title.trim() || undefined,
        roleCodes: userForm.roleCodes,
      });
      setUserModalOpen(false);
      setUserForm(emptyUserForm);
      setNotice('أُنشئ الحساب. يدخل صاحبه ببريده وكلمة المرور التي حدّدتها.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر إنشاء الحساب');
    } finally {
      setSaving(false);
    }
  };

  const submitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.admin.createRole({
        code: roleForm.code.trim(),
        nameAr: roleForm.nameAr.trim(),
        description: roleForm.description.trim() || undefined,
        permissionCodes: roleForm.permissionCodes,
      });
      setRoleModalOpen(false);
      setRoleForm(emptyRoleForm);
      setNotice('أُنشئ الدور. يمكنك الآن إسناده عند إضافة موظف.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر إنشاء الدور');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="جاري جلب المستخدمين والأدوار..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-r-4 border-[var(--usr-gold)] pr-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--usr-primary-dark)]">
            إدارة المستخدمين والصلاحيات
          </h2>
          <p className="text-xs text-[var(--usr-muted)]">
            أنشئ أدواراً بأي مجموعة صلاحيات، ثم أضف الموظفين وأسند لهم ما يناسبهم
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRoleModalOpen(true)}>
            + دور جديد
          </Button>
          <Button variant="gold" size="sm" onClick={() => setUserModalOpen(true)}>
            + موظف جديد
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
          {error}
        </div>
      )}
      {notice && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
          {notice}
        </div>
      )}

      <div className="flex gap-1 border-b border-[var(--usr-border)]">
        {([
          ['users', `الموظفون (${users.length})`],
          ['roles', `الأدوار (${roles.length})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-xs font-bold border-b-2 -mb-px transition ${
              tab === key
                ? 'border-[var(--usr-gold)] text-[var(--usr-primary-dark)]'
                : 'border-transparent text-[var(--usr-muted)] hover:text-[var(--usr-primary-dark)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' ? (
        <UsersTable users={users} />
      ) : (
        <RolesTable roles={roles} catalog={catalog} />
      )}

      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title="إضافة موظف جديد"
      >
        <form onSubmit={submitUser} className="space-y-3">
          <Input
            label="الاسم الكامل"
            required
            value={userForm.displayName}
            onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
          />
          <Input
            label="البريد الإلكتروني (يُستخدم للدخول)"
            type="email"
            dir="ltr"
            required
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
          />
          <Input
            label="رقم الهاتف (اختياري)"
            dir="ltr"
            value={userForm.phone}
            onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
          />
          <Input
            label="المسمى الوظيفي (اختياري)"
            value={userForm.title}
            onChange={(e) => setUserForm({ ...userForm, title: e.target.value })}
          />
          <Input
            label="كلمة المرور"
            type="password"
            required
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
          />
          <p className="text-[11px] text-[var(--usr-muted)] -mt-1">
            8 خانات على الأقل، وتحتوي على حرف كبير وحرف صغير ورقم ورمز خاص.
          </p>

          <fieldset className="border border-[var(--usr-border)] rounded-lg p-3">
            <legend className="text-xs font-bold px-1">الأدوار الممنوحة</legend>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {roles.map((role) => (
                <label key={role.code} className="flex items-start gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={userForm.roleCodes.includes(role.code)}
                    onChange={() =>
                      setUserForm({
                        ...userForm,
                        roleCodes: toggle(userForm.roleCodes, role.code),
                      })
                    }
                  />
                  <span>
                    <span className="font-semibold">{role.nameAr ?? role.code}</span>
                    <span className="text-[var(--usr-muted)]">
                      {' '}
                      — {role.permissionCodes.length} صلاحية
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex gap-2 pt-1">
            <Button type="submit" variant="gold" disabled={saving} className="flex-1">
              {saving ? 'جارٍ الحفظ...' : 'إنشاء الحساب'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setUserModalOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="إنشاء دور بصلاحيات مخصّصة"
      >
        <form onSubmit={submitRole} className="space-y-3">
          <Input
            label="اسم الدور بالعربية"
            required
            value={roleForm.nameAr}
            onChange={(e) => setRoleForm({ ...roleForm, nameAr: e.target.value })}
          />
          <Input
            label="رمز الدور (حروف إنجليزية صغيرة وشرطة سفلية)"
            dir="ltr"
            required
            placeholder="reviewer_officer"
            value={roleForm.code}
            onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value })}
          />
          <Input
            label="الوصف (اختياري)"
            value={roleForm.description}
            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
          />

          <fieldset className="border border-[var(--usr-border)] rounded-lg p-3">
            <legend className="text-xs font-bold px-1">
              الصلاحيات ({roleForm.permissionCodes.length} مختارة)
            </legend>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {catalog.map((group) => (
                <div key={group.resource}>
                  <p className="text-[11px] font-bold text-[var(--usr-primary-dark)] mb-1">
                    {group.resourceLabel}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission.code}
                        className="flex items-center gap-1.5 text-[11px] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={roleForm.permissionCodes.includes(permission.code)}
                          onChange={() =>
                            setRoleForm({
                              ...roleForm,
                              permissionCodes: toggle(
                                roleForm.permissionCodes,
                                permission.code,
                              ),
                            })
                          }
                        />
                        <span>{permission.action}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="flex gap-2 pt-1">
            <Button type="submit" variant="gold" disabled={saving} className="flex-1">
              {saving ? 'جارٍ الحفظ...' : 'إنشاء الدور'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setRoleModalOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function UsersTable({ users }: { users: StaffUser[] }) {
  if (users.length === 0) {
    return (
      <EmptyState message="لا يوجد موظفون مسجّلون بعد" hint="ابدأ بإضافة موظف جديد" />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>الاسم</TableHead>
          <TableHead>الرمز الوظيفي</TableHead>
          <TableHead>الدور</TableHead>
          <TableHead>الحالة</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-semibold">{user.name}</TableCell>
            <TableCell dir="ltr">{user.staffCode}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              <Badge variant={user.status === 'نشط' ? 'success' : 'outline'}>
                {user.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RolesTable({
  roles,
  catalog,
}: {
  roles: RoleDetail[];
  catalog: PermissionGroup[];
}) {
  const labelOf = (code: string) =>
    catalog
      .flatMap((group) => group.permissions)
      .find((permission) => permission.code === code)?.label ?? code;

  if (roles.length === 0) {
    return <EmptyState message="لا توجد أدوار" hint="أنشئ دوراً وحدّد صلاحياته" />;
  }

  return (
    <div className="space-y-3">
      {roles.map((role) => (
        <div
          key={role.id}
          className="bg-white border border-[var(--usr-border)] rounded-xl p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[var(--usr-primary-dark)]">
                  {role.nameAr ?? role.code}
                </h3>
                {role.isSystem && <Badge variant="outline">دور نظامي</Badge>}
              </div>
              <p className="text-[11px] text-[var(--usr-muted)] mt-0.5" dir="ltr">
                {role.code}
              </p>
              {role.description && (
                <p className="text-xs text-[var(--usr-muted)] mt-1">{role.description}</p>
              )}
            </div>
            <div className="text-left shrink-0">
              <p className="text-xs font-bold text-[var(--usr-primary-dark)]">
                {role.permissionCodes.length} صلاحية
              </p>
              <p className="text-[11px] text-[var(--usr-muted)]">
                {role.holders} مستخدم
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mt-3">
            {role.permissionCodes.slice(0, 12).map((code) => (
              <span
                key={code}
                className="px-2 py-0.5 rounded bg-[var(--usr-primary-soft)] text-[10px] text-[var(--usr-primary-dark)]"
              >
                {labelOf(code)}
              </span>
            ))}
            {role.permissionCodes.length > 12 && (
              <span className="px-2 py-0.5 text-[10px] text-[var(--usr-muted)]">
                +{role.permissionCodes.length - 12} أخرى
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="bg-white border border-[var(--usr-border)] rounded-xl p-10 text-center">
      <InboxIcon size={40} className="mx-auto text-[var(--usr-muted)] mb-3" />
      <p className="text-sm font-semibold text-[var(--usr-primary-dark)]">{message}</p>
      <p className="text-xs text-[var(--usr-muted)] mt-1">{hint}</p>
    </div>
  );
}
