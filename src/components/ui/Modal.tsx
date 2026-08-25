'use strict';
'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Function called when user closes the modal */
  onClose: () => void;
  /** Optional title heading */
  title?: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Modal width size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Children form or content */
  children: React.ReactNode;
}

const SIZE_MAPS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-5xl',
};

/**
 * Reusable Accessible Modal Dialog Component with backdrop blur overlay and ESC key closing.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'lg',
  children,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = SIZE_MAPS[size] || SIZE_MAPS.lg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div 
        className={`bg-white rounded-3xl shadow-2xl border border-slate-200 w-full ${maxWidthClass} overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Close Dialog"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
