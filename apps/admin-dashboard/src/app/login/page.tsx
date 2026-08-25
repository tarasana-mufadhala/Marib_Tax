'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, ShieldCheckIcon } from '@marib-tax/web-ui';
import { loginWithEmail, requestOtp, verifyOtp } from '@/lib/auth';
import { OfficeLogo } from '@/components/OfficeLogo';

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
        await requestOtp(phone);
        setStep('otp');
      } else {
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--usr-bg)] p-4 sm:p-6 selection:bg-[var(--usr-gold)] selection:text-white">
      <div className="w-full max-w-md space-y-4">
        {/* Main Auth Container */}
        <div className="rounded-3xl border border-[var(--usr-border)] bg-white shadow-2xl overflow-hidden">
          {/* Header Banner with Gradient */}
          <div className="bg-gradient-to-r from-[var(--usr-primary-deeper)] via-[var(--usr-primary-dark)] to-[var(--usr-primary)] p-8 text-center text-white relative">
            <div className="flex justify-center mb-3">
              <OfficeLogo size={56} className="border-2 border-[var(--usr-gold)] shadow-xl" priority />
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
              تسجيل الدخول للنظام الإداري
            </h1>
            <p className="text-xs text-[var(--usr-gold-soft)] font-medium mt-1">
              مكتب الضرائب بمحافظة مأرب
            </p>
          </div>

          {/* Golden Rule Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[var(--usr-gold-dark)] via-[var(--usr-gold)] to-[var(--usr-gold-dark)]" />

          {/* Form Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                ⚠️ {errorMsg}
              </div>
            )}

            {step === 'login' && (
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 rounded-lg transition-all ${
                    role === 'admin'
                      ? 'bg-[var(--usr-primary)] text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
                  }`}
                >
                  مدير النظام
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employee')}
                  className={`py-2 rounded-lg transition-all ${
                    role === 'employee'
                      ? 'bg-[var(--usr-primary)] text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
                  }`}
                >
                  موظف فحص
                </button>
                <button
                  type="button"
                  onClick={() => setRole('taxpayer')}
                  className={`py-2 rounded-lg transition-all ${
                    role === 'taxpayer'
                      ? 'bg-[var(--usr-primary)] text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
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
                    label="رقم الهاتف المسجل لدى المكتب *"
                    type="text"
                    required
                    placeholder="مثال: 777000111"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                ) : (
                  <>
                    <Input
                      label="البريد الإلكتروني الوظيفي *"
                      type="email"
                      dir="ltr"
                      required
                      placeholder="admin@marib-tax.gov.ye"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                      label="كلمة المرور *"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </>
                )}

                <Button
                  variant="gold"
                  size="lg"
                  type="submit"
                  disabled={loading}
                  className="w-full font-black text-sm py-3 justify-center shadow-lg"
                >
                  {loading ? 'جاري التحقق...' : role === 'taxpayer' ? 'إرسال رمز التحقق OTP 📱' : 'تسجيل الدخول للنظام 🔐'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="p-3 bg-blue-50 text-blue-900 text-xs rounded-xl border border-blue-200">
                  تم إرسال رمز التحقق OTP إلى الهاتف <span dir="ltr" className="font-bold">{phone}</span>
                </div>
                <Input
                  label="أدخل رمز التحقق (OTP) *"
                  type="text"
                  required
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />

                <Button
                  variant="gold"
                  size="lg"
                  type="submit"
                  disabled={loading}
                  className="w-full font-black text-sm py-3 justify-center shadow-lg"
                >
                  {loading ? 'جاري التحقق من الرمز...' : 'تأكيد الرمز والدخول 🚀'}
                </Button>
              </form>
            )}

            <div className="pt-4 text-center border-t border-slate-100">
              <a
                href="http://localhost:3002"
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--usr-primary)] hover:text-[var(--usr-primary-dark)] hover:underline"
              >
                <span>← العودة إلى الموقع العام للمكلفين</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
