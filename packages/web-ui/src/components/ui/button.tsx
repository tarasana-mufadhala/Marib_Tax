import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyle = "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
    
    const variants = {
      primary: "bg-[var(--usr-primary)] text-white hover:bg-[var(--usr-primary-dark)] focus:ring-[var(--usr-primary)] shadow-sm",
      secondary: "bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] hover:bg-slate-200 focus:ring-[var(--usr-primary)]",
      gold: "bg-[var(--usr-gold)] text-white hover:bg-[var(--usr-gold-dark)] focus:ring-[var(--usr-gold)] shadow-sm font-semibold",
      outline: "border border-[var(--usr-border)] bg-white text-[var(--usr-text)] hover:bg-slate-50 hover:border-[var(--usr-primary)]",
      ghost: "text-[var(--usr-text)] hover:bg-slate-100 dark:hover:bg-slate-800",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2.5 font-semibold",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyle, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
