'use client';

import * as React from "react";
import { Button } from "./button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl overflow-hidden bg-white rounded-xl shadow-2xl border border-[var(--usr-border)] animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        <div className="usr-gold-rule" />
        <div className="flex items-center justify-between p-6 border-b border-[var(--usr-border)] bg-[var(--usr-bg)]">
          <div>
            <h3 className="text-xl font-bold font-display text-[var(--usr-primary-dark)]">{title}</h3>
            {description && <p className="text-sm text-[var(--usr-muted)] mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>

        {footer ? (
          <div className="flex items-center justify-end gap-3 p-4 bg-slate-50 border-t border-[var(--usr-border)]">
            {footer}
          </div>
        ) : (
          <div className="flex justify-end p-4 bg-slate-50 border-t border-[var(--usr-border)]">
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
