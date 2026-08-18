import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  label = 'Carregando...',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center p-4 gap-2 text-[#8A5A44] font-brand-sans ${className}`} role="status">
      <Loader2 className={`${sizeClasses} animate-spin text-[#B85C38] shrink-0`} />
      {label && <span className="text-xs font-medium text-[#5C5852]">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
};
