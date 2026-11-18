import React from 'react';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 sm:p-8 text-center space-y-3">
      <div className="w-11 h-11 rounded-lg bg-[#1A1E28] border border-[#2B3140] flex items-center justify-center mx-auto text-[#00BFFF]">
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-1 max-w-md mx-auto">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-xs text-[#CCCCCC] leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-1">
          <AppButton onClick={onAction}>{actionLabel}</AppButton>
        </div>
      )}
    </div>
  );
}
