import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyle = "inline-flex items-center justify-center font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none active:scale-[0.98]";
    
    const variants = {
      primary: "bg-[var(--usr-primary)] text-white hover:bg-[var(--usr-primary-dark)] focus:ring-[var(--usr-primary)] shadow-sm",
      secondary: "bg-[var(--usr-primary-soft)] text-[var(--usr-primary-dark)] hover:bg-[var(--usr-border)] focus:ring-[var(--usr-primary)]",
      gold: "bg-gradient-to-r from-[var(--usr-gold)] to-[var(--usr-gold-dark)] text-[var(--usr-primary-deeper)] hover:brightness-105 focus:ring-[var(--usr-gold)] shadow-md border border-amber-300/40",
      outline: "border-2 border-[var(--usr-border)] bg-white text-slate-800 hover:bg-slate-50 hover:border-[var(--usr-primary)] hover:text-[var(--usr-primary-dark)] shadow-2xs",
      ghost: "text-slate-700 hover:bg-slate-100 hover:text-[var(--usr-primary-dark)]",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-2.5 text-base gap-2.5",
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
