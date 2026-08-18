import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, id, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        id={id}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-[#FAF6EF] text-[#292724] placeholder-[#5C5852]/60 text-xs sm:text-sm font-brand-sans transition-all focus:outline-none resize-y min-h-[80px] ${
          error
            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            : 'border-[#E7D5BE] focus:border-[#B85C38] focus:ring-2 focus:ring-[#B85C38]/20'
        } ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
