'use strict';
'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AlertTriangle, Trash2, HelpCircle, X } from 'lucide-react';
import { useLanguage } from '@/components/features/LanguageContext';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (optionsOrMessage: string | ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context;
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((optionsOrMessage: string | ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      if (typeof optionsOrMessage === 'string') {
        const isDelete = optionsOrMessage.toLowerCase().includes('delete') || 
                         optionsOrMessage.toLowerCase().includes('remove') || 
                         optionsOrMessage.toLowerCase().includes('revoke') ||
                         optionsOrMessage.toLowerCase().includes('cancel');
        setOptions({
          title: isDelete ? t('Confirm Action', 'Confirm Action') : t('Confirmation', 'Confirmation'),
          message: optionsOrMessage,
          confirmText: isDelete ? t('Delete', 'Delete') : t('Confirm', 'Confirm'),
          cancelText: t('Cancel', 'Cancel'),
          variant: isDelete ? 'danger' : 'info',
        });
      } else {
        setOptions({
          title: optionsOrMessage.title || t('Confirm Action', 'Confirm Action'),
          message: optionsOrMessage.message,
          confirmText: optionsOrMessage.confirmText || t('Confirm', 'Confirm'),
          cancelText: optionsOrMessage.cancelText || t('Cancel', 'Cancel'),
          variant: optionsOrMessage.variant || 'danger',
        });
      }
      setIsOpen(true);
    });
  }, [t]);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  // Keyboard accessibility: ESC cancels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isDanger = options.variant === 'danger';
  const isWarning = options.variant === 'warning';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans"
          onClick={handleCancel}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="p-6 sm:p-7 space-y-4">
              {/* Header with icon & close */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isDanger 
                      ? 'bg-red-50 text-red-600 border border-red-200/60' 
                      : isWarning
                      ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-200/60'
                  }`}>
                    {isDanger ? <Trash2 size={24} /> : isWarning ? <AlertTriangle size={24} /> : <HelpCircle size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                      {options.title ? t(options.title, options.title) : t('Confirm Action', 'Confirm Action')}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label={t('Close', 'Close')}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Message */}
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {t(options.message, options.message)}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors cursor-pointer"
                >
                  {options.cancelText ? t(options.cancelText, options.cancelText) : t('Cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  autoFocus
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all shadow-md cursor-pointer ${
                    isDanger
                      ? 'bg-red-600 hover:bg-red-700 active:scale-95 shadow-red-600/25'
                      : isWarning
                      ? 'bg-amber-600 hover:bg-amber-700 active:scale-95 shadow-amber-600/25'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-600/25'
                  }`}
                >
                  {options.confirmText ? t(options.confirmText, options.confirmText) : t('Confirm', 'Confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
