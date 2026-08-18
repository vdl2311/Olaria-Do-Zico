import React from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  helpText,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 font-brand-sans ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-bold text-[#8A5A44] uppercase tracking-wider"
      >
        {label}
        {required && <span className="text-rose-600 ml-1" aria-hidden="true">*</span>}
      </label>
      
      <div>
        {children}
      </div>

      {error && (
        <p id={`${htmlFor}-error`} className="text-xs font-medium text-rose-700 mt-1">
          {error}
        </p>
      )}

      {helpText && !error && (
        <p id={`${htmlFor}-help`} className="text-[11px] text-[#5C5852] mt-0.5">
          {helpText}
        </p>
      )}
    </div>
  );
};
