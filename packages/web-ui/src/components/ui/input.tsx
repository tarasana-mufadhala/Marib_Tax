import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = "text", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-[var(--usr-text)]">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-[var(--usr-border)] bg-white px-3 py-2 text-sm text-[var(--usr-text)] placeholder:text-[var(--usr-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--usr-primary)] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
