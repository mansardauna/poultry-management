'use strict';
'use client';

import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { useLanguage } from '@/components/features/LanguageContext';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  icon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_MAPS = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 active:scale-[0.98]',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-[0.98]',
  outline: 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm active:scale-[0.98]',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20 active:scale-[0.98]',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 active:scale-[0.98]',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
};

const SIZE_MAPS = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-xs sm:text-sm',
  lg: 'px-5 py-2.5 text-sm sm:text-base',
};

/**
 * Standard Unified Button Component for PFMS.
 * Enforces uniform radius (rounded-xl), sizing, typography, and click interactions across all pages.
 * Automatically translates string text content using LanguageContext.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    icon,
    fullWidth = false,
    className = '',
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  const { t } = useLanguage();
  const variantClass = VARIANT_MAPS[variant] || VARIANT_MAPS.primary;
  const sizeClass = SIZE_MAPS[size] || SIZE_MAPS.md;
  const effectiveLeftIcon = leftIcon || icon;
  const displayChildren = typeof children === 'string' ? t(children) : children;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${fullWidth ? 'w-full' : ''} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : effectiveLeftIcon}
      {displayChildren}
      {!isLoading && rightIcon}
    </button>
  );
});
