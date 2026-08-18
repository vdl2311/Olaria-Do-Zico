import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, id, ...props }, ref) => {
    return (
      <input
        ref={ref}
        id={id}
        className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl border bg-[#FAF6EF] dark:bg-[#1A1816] text-[#292724] dark:text-[#F7F1E7] placeholder-[#5C5852]/60 dark:placeholder-stone-500 text-xs sm:text-sm font-brand-sans transition-all focus:outline-none ${
          error
            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            : 'border-[#E7D5BE] dark:border-stone-700 focus:border-[#B85C38] focus:ring-2 focus:ring-[#B85C38]/20'
        } ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
