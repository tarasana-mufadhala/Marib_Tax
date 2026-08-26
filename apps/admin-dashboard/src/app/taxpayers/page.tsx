'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Button,
  Input,
  LoadingState,
  BuildingIcon,
} from '@marib-tax/web-ui';
import { api, AdminTaxpayer, AdminTaxpayerDetails } from '@/lib/api-client';

/** لون الشارة بحسب حالة الملف — نفس دلالة الألوان في التطبيق. */
const STATUS_TONE: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  active: 'success',
  under_review: 'warning',
  suspended: 'destructive',
  rejected: 'destructive',
};

const STATUS_FILTERS = [
  { code: '', label: 'الكل' },
  { code: 'under_review', label: 'قيد المراجعة' },
  { code: 'active', label: 'معتمد' },
  { code: 'suspended', label: 'موقوف' },
  { code: 'rejected', label: 'مرفوض' },
];

export default function TaxpayersPage() {
  const [taxpayers, setTaxpayers] = useState<AdminTaxpayer[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AdminTaxpayerDetails | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setTaxpayers(await api.admin.getAdminTaxpayers({ status, search }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب سجل المكلفين');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetails = async (id: string) => {
    try {
      setSelected(await api.admin.getAdminTaxpayer(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب ملف المكلف');
    }
  };

  const pending = taxpayers.filter((t) => t.statusCode === 'under_review').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-r-4 border-[var(--usr-gold)] pr-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--usr-primary-dark)]">
            سجل المكلفين والمنشآت الضريبية
          </h2>
          <p className="text-xs text-[var(--usr-muted)]">
            اعتماد الحسابات المسجَّلة من التطبيق وإيقافها ومتابعة حالتها
          </p>
        </div>
        {pending > 0 && (
          <Badge variant="warning">{pending} ملف ينتظر الاعتماد</Badge>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
          ⚠️ {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-md flex-1 min-w-[240px]">
          <Input
            placeholder="ابحث بالاسم أو الرقم الضريبي..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.code || 'all'}
              type="button"
              onClick={() => setStatus(filter.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                status === filter.code
                  ? 'bg-[var(--usr-primary)] text-white border-[var(--usr-primary)]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState message="جاري جلب سجل المكلفين..." />
      ) : taxpayers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <BuildingIcon size={40} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">لا توجد ملفات مطابقة</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الرقم الضريبي</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>البريد</TableHead>
                <TableHead>الأنشطة</TableHead>
                <TableHead>طلبات مفتوحة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxpayers.map((taxpayer) => (
                <TableRow key={taxpayer.id}>
                  <TableCell className="font-bold">{taxpayer.displayName}</TableCell>
                  <TableCell dir="ltr" className="text-left font-mono text-xs">
                    {taxpayer.taxNumber ?? '—'}
                  </TableCell>
                  <TableCell dir="ltr" className="text-left font-mono text-xs">
                    {taxpayer.phone ?? '—'}
                  </TableCell>
                  <TableCell dir="ltr" className="text-left text-xs">
                    {taxpayer.email ?? '—'}
                  </TableCell>
                  <TableCell>{taxpayer.activityCount}</TableCell>
                  <TableCell>{taxpayer.openRequests}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_TONE[taxpayer.statusCode] ?? 'default'}>
                      {taxpayer.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetails(taxpayer.id)}
                    >
                      الملف والإجراءات
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selected && (
        <TaxpayerDrawer
          taxpayer={selected}
          onClose={() => setSelected(null)}
          onChanged={async () => {
            await load();
            await openDetails(selected.id);
          }}
        />
      )}
    </div>
  );
}

/** ملف المكلف وإجراءاته الإدارية. */
function TaxpayerDrawer({
  taxpayer,
  onClose,
  onChanged,
}: {
  taxpayer: AdminTaxpayerDetails;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [target, setTarget] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const transition = taxpayer.allowedTransitions.find((t) => t.code === target);

  const apply = async () => {
    if (!transition) return;
    // السبب إلزامي عند الإيقاف والرفض — الخادم يفرضه، ونمنع الرحلة الضائعة.
    if (transition.reasonRequired && reason.trim().length === 0) {
      setError(`يجب كتابة سبب عند «${transition.label}»`);
      return;
    }
    try {
      setBusy(true);
      setError('');
      await api.admin.changeTaxpayerStatus(taxpayer.id, transition.code, reason);
      setTarget(null);
      setReason('');
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تنفيذ الإجراء');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex justify-start"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full bg-white overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[var(--usr-primary-deeper)] text-white p-5 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">{taxpayer.displayName}</h3>
            <p className="text-xs text-slate-200 mt-1" dir="ltr">
              {taxpayer.taxNumber ?? 'بلا رقم ضريبي'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl leading-none"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
              ⚠️ {error}
            </div>
          )}

          <section>
            <h4 className="text-xs font-bold text-[var(--usr-primary)] mb-2">
              الحالة الحالية
            </h4>
            <Badge variant={STATUS_TONE[taxpayer.statusCode] ?? 'default'}>
              {taxpayer.statusLabel}
            </Badge>
          </section>

          <section>
            <h4 className="text-xs font-bold text-[var(--usr-primary)] mb-2">
              الإجراءات المتاحة
            </h4>
            {taxpayer.allowedTransitions.length === 0 ? (
              <p className="text-xs text-slate-500">
                لا إجراء متاح على هذه الحالة.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {taxpayer.allowedTransitions.map((option) => (
                  <Button
                    key={option.code}
                    size="sm"
                    variant={target === option.code ? 'primary' : 'outline'}
                    onClick={() => {
                      setTarget(option.code);
                      setError('');
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            )}

            {transition && (
              <div className="mt-3 space-y-2 rounded-xl border border-slate-200 p-3 bg-slate-50">
                <label className="block text-xs font-bold text-slate-600">
                  السبب {transition.reasonRequired ? '(إلزامي)' : '(اختياري)'}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  placeholder="يُحفظ في سجل قرارات هذا الملف ويظهر لمن يراجعه لاحقاً."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={apply} disabled={busy}>
                    {busy ? 'جاري التنفيذ...' : `تأكيد «${transition.label}»`}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTarget(null);
                      setReason('');
                    }}
                    disabled={busy}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section>
            <h4 className="text-xs font-bold text-[var(--usr-primary)] mb-2">
              قنوات الاتصال
            </h4>
            {taxpayer.contacts.length === 0 ? (
              <p className="text-xs text-slate-500">لا قنوات مسجَّلة.</p>
            ) : (
              <ul className="space-y-1">
                {taxpayer.contacts.map((contact, index) => (
                  <li
                    key={`${contact.type}-${index}`}
                    className="flex justify-between text-xs border-b border-slate-100 py-1.5"
                  >
                    <span className="text-slate-500">{contact.type}</span>
                    <span dir="ltr" className="font-mono">
                      {contact.value}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h4 className="text-xs font-bold text-[var(--usr-primary)] mb-2">
              الأنشطة التجارية
            </h4>
            {taxpayer.activities.length === 0 ? (
              <p className="text-xs text-slate-500">لا أنشطة مسجَّلة.</p>
            ) : (
              <ul className="space-y-1">
                {taxpayer.activities.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex justify-between text-xs border-b border-slate-100 py-1.5"
                  >
                    <span className="font-semibold">{activity.name ?? '—'}</span>
                    <span className="text-slate-500">
                      {activity.activityType ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h4 className="text-xs font-bold text-[var(--usr-primary)] mb-2">
              سجل القرارات
            </h4>
            {taxpayer.history.length === 0 ? (
              <p className="text-xs text-slate-500">
                لم يُتخذ أي قرار على هذا الملف بعد.
              </p>
            ) : (
              <ol className="space-y-2">
                {taxpayer.history.map((entry, index) => (
                  <li
                    key={index}
                    className="rounded-lg border border-slate-200 p-2.5 text-xs"
                  >
                    <div className="flex justify-between font-semibold">
                      <span>
                        {entry.fromLabel ? `${entry.fromLabel} ← ` : ''}
                        {entry.toLabel}
                      </span>
                      <span className="text-slate-400">
                        {new Date(entry.changedAt).toLocaleDateString('ar')}
                      </span>
                    </div>
                    {entry.officerName && (
                      <p className="mt-1 text-slate-500">
                        بواسطة: {entry.officerName}
                      </p>
                    )}
                    {entry.reason && (
                      <p className="mt-1 text-slate-600 leading-relaxed">
                        {entry.reason}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
