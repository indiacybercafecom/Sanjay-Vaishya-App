import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AppModal({ open, onClose, title, subtitle, children }: AppModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[320] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#13161D] border border-[#2B3140] rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.65)] max-h-[85dvh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[#262B38] flex items-center justify-between gap-3">
          <div>
            {subtitle && <p className="font-mono text-[11px] text-[#00BFFF]">{subtitle}</p>}
            <h2 className="text-base font-bold text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-w-[40px] min-h-[40px] rounded-lg bg-[#1A1E28] border border-[#262B38] flex items-center justify-center text-[#CCCCCC] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
