'use strict';
'use client';

import React from 'react';
import { useLanguage } from '@/components/features/LanguageContext';

export interface BadgeStatusProps {
  /** Status string value (e.g. "Paid", "Unpaid", "Active", "Completed", "Pending", "Offline") */
  status: string;
  /** Custom size variant */
  size?: 'sm' | 'md';
  /** Additional custom classes */
  className?: string;
}

/**
 * Standardized Status Badge component for data tables and status pills across the application.
 * Automatically translates the displayed status name into the active language.
 */
export function BadgeStatus({ status, size = 'sm', className = '' }: BadgeStatusProps) {
  const { t } = useLanguage();
  const norm = (status || '').toLowerCase().trim();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (norm === 'paid' || norm === 'active' || norm === 'completed' || norm === 'success' || norm === 'good' || norm === 'online') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (norm === 'unpaid' || norm === 'offline' || norm === 'critical' || norm === 'error' || norm === 'failed') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (norm === 'pending' || norm === 'warning' || norm === 'low' || norm === 'due') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (norm === 'pro' || norm === 'enterprise' || norm === 'info') {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  const paddingClasses = size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-semibold border rounded-full ${colorClasses} ${paddingClasses} ${className}`}>
      {t(status)}
    </span>
  );
}
