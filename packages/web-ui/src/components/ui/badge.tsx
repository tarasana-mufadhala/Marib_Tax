import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'gold';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] border-transparent",
    success: "bg-emerald-100 text-emerald-800 border-transparent dark:bg-emerald-950 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-800 border-transparent dark:bg-amber-950 dark:text-amber-300",
    destructive: "bg-red-100 text-red-800 border-transparent dark:bg-red-950 dark:text-red-300",
    gold: "bg-[var(--usr-gold-soft)] text-[var(--usr-gold-dark)] font-semibold border-amber-200",
    outline: "border border-[var(--usr-border)] text-[var(--usr-text)] bg-white",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
