import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  ariaLabel?: string;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  ariaLabel,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element before modal opened
    previousActiveElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Auto-focus first input / focusable element only once when modal opens, if not already focused
    const timer = setTimeout(() => {
      if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
        const firstInput = modalRef.current.querySelector<HTMLElement>(
          'input:not([type="hidden"]), select, textarea'
        ) || modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstInput?.focus();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        // Only return focus if still attached to DOM
        try {
          previousActiveElement.current.focus();
        } catch {
          // Ignore focus errors on unmount
        }
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full mx-4',
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      aria-label={ariaLabel || title}
    >
      {/* Backdrop click handler */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className={`relative bg-[#FAF6EF] dark:bg-[#25221E] border border-[#E7D5BE] dark:border-stone-800 text-[#292724] dark:text-[#F7F1E7] rounded-2xl shadow-2xl w-full ${sizeClasses} max-h-[90vh] flex flex-col font-brand-sans overflow-hidden z-10 ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E7D5BE] dark:border-stone-800 p-4 sm:p-5 shrink-0 bg-[#F7F1E7] dark:bg-[#1E1B18]">
          <div>
            <h2 id="modal-title" className="font-brand-serif font-bold text-lg sm:text-xl text-[#292724] dark:text-[#F7F1E7]">
              {title}
            </h2>
            {description && (
              <p className="text-sm sm:text-base text-[#5C5852] dark:text-[#C9BFA8] mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#E7D5BE]/60 dark:bg-stone-800 text-[#292724] dark:text-[#F7F1E7] hover:bg-[#E7D5BE] dark:hover:bg-stone-700 hover:text-[#B85C38] transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[#B85C38]"
            aria-label="Fechar janela modal"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-base">
          {children}
        </div>
      </div>
    </div>
  );
};
