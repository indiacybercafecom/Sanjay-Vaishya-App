import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, subtitle, children }: BottomSheetProps) {
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
      className="fixed inset-0 z-[310] flex items-end md:items-center md:justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-[#13161D] border-t md:border border-[#2B3140] rounded-t-xl md:rounded-lg shadow-[0_-8px_36px_rgba(0,0,0,0.65)] max-h-[82dvh] flex flex-col overflow-hidden safe-pb">
        <div className="md:hidden flex justify-center pt-2.5 pb-1">
          <span className="w-10 h-1 rounded-full bg-[#33394A]" />
        </div>
        <div className="px-5 py-3.5 border-b border-[#262B38] flex items-center justify-between gap-3">
          <div>
            {subtitle && <p className="font-mono text-[11px] text-[#00BFFF]">{subtitle}</p>}
            <h2 className="text-base font-bold text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet"
            className="min-w-[40px] min-h-[40px] rounded-lg bg-[#1A1E28] border border-[#262B38] flex items-center justify-center text-[#CCCCCC] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
