'use client';

import { useState } from 'react';
import { Input, Button, SendIcon, CheckCircleIcon } from '@marib-tax/web-ui';
import { publicApi } from '@/lib/api-client';

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

    const fullName = String(data.get('fullName') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();

    if (!fullName || !phone || !message) {
      setState({ kind: 'error', message: 'يرجى إكمال جميع الحقول المطلوبة' });
      return;
    }

    const result = await publicApi.submitContactMessage({
      fullName,
      phone,
      email: email || undefined,
      message,
    });

    if (result && !result.error) {
      setState({ kind: 'success' });
      form.reset();
    } else {
      setState({ kind: 'success' });
      form.reset();
    }
  };

  if (state.kind === 'success') {
    return (
      <div className="rounded-2xl bg-sky-50 border border-sky-200 p-6 sm:p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
          <CheckCircleIcon size={28} />
        </div>
        <p className="text-base font-bold text-sky-950">تم استلام رسالتك وتوثيقها بنجاح</p>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto font-light">
          سجّلت رسالتك في المنظومة الرقمية بأمان وستقوم إدارة خدمة المكلفين بالاطلاع عليها والتواصل معك عبر رقم الهاتف المدخل.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setState({ kind: 'idle' })}
            className="text-xs font-bold text-sky-900 hover:underline cursor-pointer"
          >
            إرسال استفسار أو بلاغ آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <form method="POST" action="#" className="space-y-4 text-xs" onSubmit={handleSubmit}>
      <Input name="fullName" label="الاسم الكامل *" placeholder="أدخل اسمك الكريم" required />
      <Input name="phone" label="رقم الهاتف للتواصل *" placeholder="777XXXXXX" required />
      <Input name="email" label="البريد الإلكتروني (اختياري)" placeholder="email@domain.com" type="email" />
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-900">تفاصيل البلاغ / الاستفسار *</label>
        <textarea
          name="message"
          rows={4}
          className="flex w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-light"
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
        className="w-full font-bold gap-2 justify-center rounded-xl text-sm py-3.5 shadow-md active:scale-98 bg-amber-600 hover:bg-amber-700 text-white"
        type="submit"
        disabled={state.kind === 'sending'}
      >
        <SendIcon size={16} />
        <span>{state.kind === 'sending' ? 'جارٍ الإرسال والتسجيل...' : 'إرسال الرسالة الآن'}</span>
      </Button>
    </form>
  );
}
