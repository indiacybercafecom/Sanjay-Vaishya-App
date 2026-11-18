import React from 'react';

interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  onClick?: () => void;
}

export function AppCard({ children, className = '', elevated = false, onClick }: AppCardProps) {
  const base = `${elevated ? 'bg-[#1A1E28]' : 'bg-[#13161D]'} border border-[#262B38] rounded-lg`;
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} text-left transition-colors hover:border-[#00BFFF] ${className}`}
      >
        {children}
      </button>
    );
  }
  return <div className={`${base} ${className}`}>{children}</div>;
}
