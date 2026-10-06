'use strict';
'use client';

import React from 'react';
import { useLanguage } from '@/components/features/LanguageContext';

export interface PageHeaderProps {
  /** Main page title */
  title: string;
  /** Subtitle or explanatory text */
  subtitle?: string;
  /** Optional badge or chip displayed next to the title */
  badge?: React.ReactNode;
  /** Action buttons or controls aligned to the right */
  actions?: React.ReactNode;
  /** Additional custom class names */
  className?: string;
  /** Additional children rendered beneath title/actions */
  children?: React.ReactNode;
}

/**
 * Standardized responsive PageHeader component across all farm feature pages.
 * Ensures consistent typography, spacing, multilingual title translation, and action button alignment.
 */
export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  className = '',
  children
}: PageHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t(title)}</h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{t(subtitle)}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
