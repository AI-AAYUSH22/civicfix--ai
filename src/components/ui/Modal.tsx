import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { backdropVariants, modalVariants } from '@/animations';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const maxWidthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-[#172033]/40 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full ${maxWidthStyles[maxWidth]} bg-white rounded-[20px] border border-[#E2E8F0] shadow-modal z-10 overflow-hidden my-8`}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#E2E8F0]">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold text-[#172033] tracking-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                      {description}
                    </p>
                  )}
                </div>

                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9] transition-colors -mr-2"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-5">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
