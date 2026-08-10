'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@marib-tax/web-ui';
import { login, loginWithEmail, requestOtp, verifyOtp } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [role, setRole] = useState<'admin' | 'employee' | 'taxpayer'>('admin');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (role === 'taxpayer') {
        // المكلف يدخل برقم الهاتف ورمز التحقق.
        await requestOtp(phone);
        setStep('otp');
      } else {
        // الموظفون يدخلون بالبريد: مزود الهاتف معطّل حالياً في Supabase.
        await loginWithEmail(email, password);
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في عملية تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      await verifyOtp(phone, otpCode);
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'رمز التحقق غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--usr-bg)] p-6">
      <div className="w-full max-w-md">
        <div className="usr-auth-card">
          <div className="usr-auth-card-header">
            <div className="w-12 h-12 rounded-xl bg-white text-[var(--usr-primary-dark)] flex items-center justify-center font-bold text-2xl mx-auto mb-3 shadow">
              مـ
            </div>
            <h1 className="text-2xl font-bold font-display text-white">تسجيل الدخول للنظام الإداري</h1>
            <p className="text-xs text-[var(--usr-gold-soft)] mt-1">مكتب الضرائب بمحافظة مأرب</p>
          </div>

          <div className="p-6 space-y-6">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                ⚠️ {errorMsg}
              </div>
            )}

            {step === 'login' && (
              <div className="grid grid-cols-3 gap-1 bg-[var(--usr-bg)] p-1 rounded-lg border border-[var(--usr-border)] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 rounded-md transition-colors ${
                    role === 'admin' ? 'bg-[var(--usr-primary)] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  مدير المكتب
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employee')}
                  className={`py-2 rounded-md transition-colors ${
                    role === 'employee' ? 'bg-[var(--usr-primary)] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  موظف فحص
                </button>
                <button
                  type="button"
                  onClick={() => setRole('taxpayer')}
                  className={`py-2 rounded-md transition-colors ${
                    role === 'taxpayer' ? 'bg-[var(--usr-primary)] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  المكلف
                </button>
              </div>
            )}

            {step === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {role === 'taxpayer' ? (
                  <Input
                    label="رقم الهاتف المسجل"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                ) : (
                  <>
                    <Input
                      label="البريد الإلكتروني"
                      type="email"
                      dir="ltr"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                      label="كلمة المرور"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </>
                )}

                <Button variant="gold" size="lg" type="submit" disabled={loading} className="w-full font-bold text-base">
                  {loading ? 'جاري التحقق...' : role === 'taxpayer' ? 'إرسال رمز التحقق OTP' : 'تسجيل الدخول الآن'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="p-3 bg-blue-50 text-blue-900 text-xs rounded border border-blue-200">
                  تم إرسال رمز التحقق OTP مكون من 6 أرقام إلى الهاتف <span dir="ltr" className="font-bold">{phone}</span>
                </div>
                <Input
                  label="أدخل رمز التحقق (OTP)"
                  type="text"
                  required
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />

                <Button variant="gold" size="lg" type="submit" disabled={loading} className="w-full font-bold text-base">
                  {loading ? 'جاري التحقق من الرمز...' : 'تأكيد الرمز والدخول'}
                </Button>
              </form>
            )}

            <div className="pt-4 text-center border-t border-[var(--usr-border)]">
              <a href="http://localhost:3000" className="text-xs text-[var(--usr-muted)] hover:text-[var(--usr-primary)]">
                ← العودة إلى الموقع العام
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
