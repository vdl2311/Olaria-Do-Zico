import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'flat' | 'highlight';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick,
}) => {
  const variantClasses = {
    default: 'bg-[#FAF6EF] dark:bg-[#25221E] border border-[#E7D5BE] dark:border-stone-800 shadow-xs text-[#292724] dark:text-[#F7F1E7]',
    flat: 'bg-[#F7F1E7] dark:bg-[#1E1B18] border border-[#D4BEA2]/60 dark:border-stone-800 text-[#292724] dark:text-[#F7F1E7]',
    highlight: 'bg-[#8A5A44] dark:bg-[#3D261C] border border-[#6E4533] text-[#FAF6EF] shadow-md',
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-4 sm:p-5 font-brand-sans transition-all ${
        onClick ? 'cursor-pointer hover:border-[#B85C38]/60 hover:shadow-sm' : ''
      } ${variantClasses} ${className}`}
    >
      {children}
    </div>
  );
};
