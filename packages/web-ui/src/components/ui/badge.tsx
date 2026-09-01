import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'gold';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] border-transparent font-bold",
    success: "bg-emerald-100 text-emerald-900 border-emerald-200 font-bold",
    warning: "bg-amber-100 text-amber-900 border-amber-200 font-bold",
    destructive: "bg-red-100 text-red-900 border-red-200 font-bold",
    gold: "bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] font-bold border-amber-200",
    outline: "border border-[var(--usr-border)] text-slate-800 bg-white font-medium",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
