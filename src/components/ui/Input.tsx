'use strict';
'use client';

import React, { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { useLanguage } from '@/components/features/LanguageContext';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

/**
 * Standard Unified Input Component for PFMS.
 * Enforces uniform radius (rounded-xl), sizing, label typography, and focus ring across all pages.
 * Automatically translates label and placeholder strings.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className = '',
    containerClassName = '',
    id,
    disabled,
    placeholder,
    ...props
  },
  ref
) {
  const { t } = useLanguage();
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const displayLabel = label ? t(label) : undefined;
  const displayPlaceholder = placeholder ? t(placeholder) : undefined;
  const displayError = error ? t(error) : undefined;
  const displayHelper = helperText ? t(helperText) : undefined;

  return (
    <div className={`w-full ${containerClassName}`}>
      {displayLabel && (
        <label 
          htmlFor={inputId} 
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          {displayLabel}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          placeholder={displayPlaceholder}
          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none transition-all shadow-sm ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${
            error 
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15'
          } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {displayError && <p className="text-[11px] text-red-600 font-medium mt-1">{displayError}</p>}
      {!displayError && displayHelper && <p className="text-[11px] text-slate-500 mt-1">{displayHelper}</p>}
    </div>
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  children: ReactNode;
}

/**
 * Standard Unified Select Component for PFMS.
 * Automatically translates label and helper text.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    error,
    helperText,
    className = '',
    containerClassName = '',
    id,
    children,
    disabled,
    ...props
  },
  ref
) {
  const { t } = useLanguage();
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const displayLabel = label ? t(label) : undefined;
  const displayError = error ? t(error) : undefined;
  const displayHelper = helperText ? t(helperText) : undefined;

  return (
    <div className={`w-full ${containerClassName}`}>
      {displayLabel && (
        <label 
          htmlFor={selectId} 
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          {displayLabel}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none transition-all shadow-sm appearance-none pr-9 cursor-pointer ${
            error 
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15'
          } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
          </svg>
        </div>
      </div>
      {displayError && <p className="text-[11px] text-red-600 font-medium mt-1">{displayError}</p>}
      {!displayError && displayHelper && <p className="text-[11px] text-slate-500 mt-1">{displayHelper}</p>}
    </div>
  );
});
