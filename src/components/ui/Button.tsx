import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ElementType;
  ariaLabel?: string;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon: Icon,
  ariaLabel,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-[#B85C38] hover:bg-[#9E4A2A] text-white font-bold shadow-xs border border-[#CF734E]/50 active:scale-[0.98]',
    secondary: 'bg-[#8A5A44] hover:bg-[#6E4533] text-[#FAF6EF] font-bold shadow-xs border border-[#A7735B]/40 active:scale-[0.98]',
    outline: 'bg-transparent border border-[#B85C38] dark:border-[#D98A5B] text-[#B85C38] dark:text-[#D98A5B] hover:bg-[#B85C38]/10 font-bold active:scale-[0.98]',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white font-bold shadow-xs border border-rose-600/50 active:scale-[0.98]',
    ghost: 'bg-transparent hover:bg-[#E7D5BE]/50 dark:hover:bg-stone-800 text-[#292724] dark:text-[#F7F1E7] font-medium',
  }[variant];

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm rounded-xl gap-2',
    lg: 'px-5 py-2.5 text-sm sm:text-base rounded-2xl gap-2.5',
  }[size];

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-brand-sans ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
};
