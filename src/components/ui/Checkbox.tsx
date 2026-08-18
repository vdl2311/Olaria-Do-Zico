import React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, id, ...props }, ref) => {
    return (
      <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer font-brand-sans text-xs sm:text-sm text-[#292724] select-none">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className={`w-4 h-4 rounded border-[#E7D5BE] text-[#B85C38] focus:ring-[#B85C38] focus:ring-offset-1 accent-[#B85C38] cursor-pointer ${className}`}
          {...props}
        />
        {label && <span>{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
