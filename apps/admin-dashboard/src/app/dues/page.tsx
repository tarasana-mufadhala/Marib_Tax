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
  DollarIcon,
  formatCurrency,
} from '@marib-tax/web-ui';
import {
  api,
  AdminDue,
  AdminTaxpayer,
  DueCorrection,
} from '@/lib/api-client';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  paid: 'success',
  partially_paid: 'warning',
  unpaid: 'destructive',
  cancelled: 'default',
};

const STATUS_FILTERS = [
  { code: '', label: 'الكل' },
  { code: 'unpaid', label: 'غير مسدَّد' },
  { code: 'partially_paid', label: 'مسدَّد جزئياً' },
  { code: 'paid', label: 'مسدَّد' },
];

/** أسانيد التقييد التي يختار منها الموظف بدل كتابة رمز حر. */
const BASIS_TYPES = [
  { code: 'annual_assessment', label: 'ربط سنوي' },
  { code: 'arrears', label: 'متأخرات' },
  { code: 'tax_assessment', label: 'ربط ضريبي على معاملة' },
  { code: 'penalty', label: 'غرامة' },
  { code: 'sales_tax', label: 'ضريبة مبيعات' },
  { code: 'other', label: 'أخرى' },
];

const basisLabel = (code: string | null): string =>
  BASIS_TYPES.find((b) => b.code === code)?.label ?? code ?? '—';

export default function DuesPage() {
  const [dues, setDues] = useState<AdminDue[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminDue | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setDues(await api.admin.getAdminDues({ status, search }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر جلب المستحقات');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const outstanding = dues
    .filter((due) => due.statusCode !== 'paid' && due.statusCode !== 'cancelled')
    .reduce((sum, due) => sum + due.remainingAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-r-4 border-[var(--usr-gold)] pr-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--usr-primary-dark)]">
            المستحقات والمتأخرات
          </h2>
          <p className="text-xs text-[var(--usr-muted)]">
            تسجيل المبالغ المستحقة على المكلفين والمنشآت وتعديلها
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>+ تسجيل مستحق</Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
          ⚠️ {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-red-50 flex items-center justify-center">
          <DollarIcon size={22} className="text-red-600" />
        </div>
        <div>
          <p className="text-xs text-[var(--usr-muted)]">إجمالي المتبقي غير المسدَّد</p>
          <p className="text-xl font-black text-[var(--usr-primary-dark)]">
            {formatCurrency(outstanding)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-md flex-1 min-w-[240px]">
          <Input
            placeholder="ابحث باسم المكلف أو رقمه الضريبي أو رقم المستحق..."
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
        <LoadingState message="جاري جلب المستحقات..." />
      ) : dues.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <DollarIcon size={40} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">لا توجد مستحقات مطابقة</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المكلف</TableHead>
                <TableHead>الرقم الضريبي</TableHead>
                <TableHead>سند التقييد</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>المسدَّد</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dues.map((due) => (
                <TableRow key={due.id}>
                  <TableCell className="font-bold">
                    {due.taxpayerName ?? '—'}
                  </TableCell>
                  <TableCell dir="ltr" className="text-left font-mono text-xs">
                    {due.taxpayerRef ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {basisLabel(due.basisTypeCode)}
                    {due.requestRef && (
                      <span className="block text-slate-400" dir="ltr">
                        {due.requestRef}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(due.amount)}</TableCell>
                  <TableCell className="text-emerald-700">
                    {formatCurrency(due.paidAmount)}
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatCurrency(due.remainingAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_TONE[due.statusCode] ?? 'default'}>
                      {due.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(due)}
                      // المسدَّد كاملاً أو الملغى لا يُعدَّل مبلغه؛ الزر يبقى
                      // ظاهراً لعرض سجل التعديلات.
                    >
                      {due.editable ? 'تعديل' : 'السجل'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {creating && (
        <CreateDueDialog
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            await load();
          }}
        />
      )}

      {editing && (
        <EditDueDialog
          due={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

/** تسجيل مستحق جديد على مكلف. */
function CreateDueDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [taxpayers, setTaxpayers] = useState<AdminTaxpayer[]>([]);
  const [taxpayerId, setTaxpayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [basis, setBasis] = useState(BASIS_TYPES[0].code);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin
      .getAdminTaxpayers()
      .then(setTaxpayers)
      .catch(() => setError('تعذر جلب قائمة المكلفين'));
  }, []);

  const submit = async () => {
    const value = Number(amount);
    if (!taxpayerId) {
      setError('اختر المكلف');
      return;
    }
    if (!Number.isFinite(value) || value < 0) {
      setError('أدخل مبلغاً صحيحاً');
      return;
    }
    try {
      setBusy(true);
      setError('');
      await api.admin.createDue({
        taxpayerId,
        amount: Math.round(value * 100) / 100,
        basisTypeCode: basis,
        documentReference: reference,
      });
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تسجيل المستحق');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog title="تسجيل مستحق على مكلف" onClose={onClose}>
      {error && <ErrorNote message={error} />}

      <Field label="المكلف">
        <select
          value={taxpayerId}
          onChange={(e) => setTaxpayerId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
        >
          <option value="">— اختر المكلف —</option>
          {taxpayers.map((taxpayer) => (
            <option key={taxpayer.id} value={taxpayer.id}>
              {taxpayer.displayName}
              {taxpayer.taxNumber ? ` — ${taxpayer.taxNumber}` : ''}
            </option>
          ))}
        </select>
      </Field>

      <Field label="المبلغ (ريال يمني)">
        <Input
          type="number"
          min="0"
          step="0.01"
          dir="ltr"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
      </Field>

      <Field label="سند التقييد">
        <select
          value={basis}
          onChange={(e) => setBasis(e.target.value)}
          className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
        >
          {BASIS_TYPES.map((type) => (
            <option key={type.code} value={type.code}>
              {type.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="مرجع المستند (اختياري)">
        <Input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="رقم القرار أو محضر الربط"
        />
      </Field>

      <div className="flex gap-2 pt-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? 'جاري التسجيل...' : 'تسجيل المستحق'}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={busy}>
          إلغاء
        </Button>
      </div>
    </Dialog>
  );
}

/** تعديل مبلغ مستحق قائم، مع سجل التعديلات السابقة. */
function EditDueDialog({
  due,
  onClose,
  onSaved,
}: {
  due: AdminDue;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(due.amount));
  const [reason, setReason] = useState('');
  const [corrections, setCorrections] = useState<DueCorrection[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.getDueCorrections(due.id).then(setCorrections).catch(() => {});
  }, [due.id]);

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      setError('أدخل مبلغاً صحيحاً');
      return;
    }
    // السبب إلزامي على الخادم؛ نمنع الرحلة الضائعة.
    if (reason.trim().length === 0) {
      setError('سبب التعديل إلزامي');
      return;
    }
    try {
      setBusy(true);
      setError('');
      await api.admin.correctDue(due.id, Math.round(value * 100) / 100, reason);
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تعديل المبلغ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={`مستحق ${due.taxpayerName ?? ''}`}
      onClose={onClose}
    >
      {error && <ErrorNote message={error} />}

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
        <Row label="المبلغ الحالي" value={formatCurrency(due.amount)} />
        <Row label="المسدَّد" value={formatCurrency(due.paidAmount)} />
        <Row label="المتبقي" value={formatCurrency(due.remainingAmount)} />
        <Row label="الحالة" value={due.statusLabel} />
      </div>

      {due.editable ? (
        <>
          <Field label="المبلغ الجديد (ريال يمني)">
            <Input
              type="number"
              min="0"
              step="0.01"
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>

          <Field label="سبب التعديل (إلزامي)">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={1000}
              className="w-full rounded-lg border border-slate-200 p-2 text-sm"
              placeholder="يُحفظ في سجل تعديلات هذا المستحق ويظهر لمن يراجعه لاحقاً."
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <Button onClick={submit} disabled={busy}>
              {busy ? 'جاري الحفظ...' : 'حفظ المبلغ الجديد'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={busy}>
              إلغاء
            </Button>
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-500 leading-relaxed">
          لا يُعدَّل مبلغ مستحق سُدِّد بالكامل أو أُلغي. لتصحيحه راجع قسم
          المدفوعات.
        </p>
      )}

      <div>
        <h4 className="text-xs font-bold text-[var(--usr-primary)] mb-2">
          سجل التعديلات
        </h4>
        {corrections.length === 0 ? (
          <p className="text-xs text-slate-500">لم يُعدَّل هذا المبلغ من قبل.</p>
        ) : (
          <ol className="space-y-2">
            {corrections.map((correction, index) => (
              <li
                key={index}
                className="rounded-lg border border-slate-200 p-2.5 text-xs"
              >
                <div className="flex justify-between font-semibold">
                  <span dir="ltr">
                    {formatCurrency(correction.priorAmount)} →{' '}
                    {formatCurrency(correction.newAmount)}
                  </span>
                  <span className="text-slate-400">
                    {new Date(correction.correctedAt).toLocaleDateString('ar')}
                  </span>
                </div>
                {correction.officerName && (
                  <p className="mt-1 text-slate-500">
                    بواسطة: {correction.officerName}
                  </p>
                )}
                <p className="mt-1 text-slate-600 leading-relaxed">
                  {correction.reason}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Dialog>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[var(--usr-primary-deeper)] text-white p-4 flex items-center justify-between">
          <h3 className="font-bold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl leading-none"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
      ⚠️ {message}
    </div>
  );
}
