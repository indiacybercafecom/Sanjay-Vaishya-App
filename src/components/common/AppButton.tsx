import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface AppButtonProps {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  'aria-label'?: string;
  title?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-[#ED1C24] hover:bg-[#B81D24] text-white border border-transparent',
  secondary: 'bg-[#1A1E28] hover:border-[#00BFFF] text-white border border-[#2B3140]',
  ghost: 'bg-transparent hover:bg-white/5 text-[#CCCCCC] hover:text-white border border-[#333333]',
  danger: 'bg-[#ED1C24]/15 hover:bg-[#ED1C24]/25 text-[#ED1C24] border border-[#ED1C24]/40',
  success: 'bg-[#00CC66]/15 hover:bg-[#00CC66]/25 text-[#00CC66] border border-[#00CC66]/40',
};

export function AppButton({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  type = 'button',
  ...rest
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
