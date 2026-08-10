'use client';

export const LoadingState = ({ message = 'جاري تحميل البيانات...' }: { message?: string }) => (
  <div className="flex justify-center items-center p-12">
    <div className="text-center space-y-3">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--usr-gold)] border-t-transparent mx-auto"></div>
      <p className="text-xs font-semibold text-[var(--usr-muted)]">{message}</p>
    </div>
  </div>
);

export const EmptyState = ({ message = 'لا توجد بيانات متاحة حالياً' }: { message?: string }) => (
  <div className="text-center p-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
    <p className="text-sm font-semibold text-[var(--usr-muted)]">{message}</p>
  </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="text-center p-8 bg-rose-50 rounded-xl border border-rose-200 space-y-3">
    <p className="text-xs font-bold text-rose-800">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
      >
        إعادة المحاولة
      </button>
    )}
  </div>
);
