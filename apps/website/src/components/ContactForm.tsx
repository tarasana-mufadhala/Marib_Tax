'use client';

import { useState } from 'react';
import { Input, Button, SendIcon, CheckCircleIcon, ShieldCheckIcon } from '@marib-tax/web-ui';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

export function ContactForm() {
  const [state, setState] = useState<SubmitState>({ kind: 'idle' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setState({ kind: 'sending' });
    try {
      const res = await fetch('/api/v1/public/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.get('fullName'),
          phone: data.get('phone'),
          email: data.get('email'),
          message: data.get('message'),
        }),
      });
      const result = await res.json().catch(() => null);
      if (res.ok && result?.success) {
        setState({ kind: 'success' });
        form.reset();
      } else {
        setState({ kind: 'error', message: result?.error ?? 'تعذر إرسال الرسالة، يرجى المحاولة لاحقاً.' });
      }
    } catch {
      setState({ kind: 'error', message: 'تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.' });
    }
  };

  if (state.kind === 'success') {
    return (
      <div className="rounded-2xl bg-[var(--usr-primary-soft)] border border-[var(--usr-primary)]/30 p-6 sm:p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
          <CheckCircleIcon size={28} />
        </div>
        <p className="text-base font-bold text-[var(--usr-primary-dark)]">تم استلام رسالتك وتوثيقها بنجاح</p>
        <p className="text-xs text-[var(--usr-muted)] leading-relaxed max-w-md mx-auto font-light">
          سجّلت رسالتك في المنظومة الرقمية وستقوم إدارة خدمة المكلفين بالاطلاع عليها والتواصل معك عبر رقم الهاتف المدخل.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setState({ kind: 'idle' })}
            className="text-xs font-bold text-[var(--usr-primary)] hover:underline cursor-pointer"
          >
            إرسال استفسار أو بلاغ آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4 text-xs" onSubmit={handleSubmit}>
      <Input name="fullName" label="الاسم الكامل *" placeholder="أدخل اسمك الكريم" required />
      <Input name="phone" label="رقم الهاتف للتواصل *" placeholder="777XXXXXX" required />
      <Input name="email" label="البريد الإلكتروني (اختياري)" placeholder="email@domain.com" type="email" />
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[var(--usr-text)]">تفاصيل البلاغ / الاستفسار *</label>
        <textarea
          name="message"
          rows={4}
          className="flex w-full rounded-xl border border-[var(--usr-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--usr-text)] focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)] transition-all font-light"
          placeholder="اكتب تفاصيل استفسارك أو تفاصيل البلاغ بسرية تامة..."
          required
        />
      </div>
      {state.kind === 'error' && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-semibold text-red-700 leading-relaxed">
          {state.message}
        </p>
      )}
      <Button
        variant="gold"
        size="lg"
        className="w-full font-bold gap-2 justify-center rounded-xl text-sm py-3.5 shadow-md active:scale-98"
        type="submit"
        disabled={state.kind === 'sending'}
      >
        <SendIcon size={16} />
        <span>{state.kind === 'sending' ? 'جارٍ الإرسال والتسجيل...' : 'إرسال الرسالة الآن'}</span>
      </Button>
    </form>
  );
}
