import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = PackageOpen,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-2xl bg-[#FAF6EF] border border-[#E7D5BE] space-y-3 font-brand-sans my-4 max-w-lg mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-[#E7D5BE]/60 text-[#8A5A44] mx-auto flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-brand-serif font-bold text-base sm:text-lg text-[#292724]">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-[#5C5852] max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button onClick={onAction} variant="primary" size="sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
