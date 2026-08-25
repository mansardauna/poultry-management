'use strict';
'use client';

import React from 'react';
import { Card, CardContent } from './Card';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  /** Title label for the KPI card (e.g. "Active Flock", "Egg Yield") */
  title: string;
  /** Main displayed metric value (e.g. "12,500 Birds", "410 Crates") */
  value: string | number;
  /** Secondary comparison or description label */
  subtext?: string;
  /** Lucide icon component to render */
  icon?: LucideIcon;
  /** Accent color variant */
  color?: 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose' | 'blue' | 'slate';
  /** Optional data-tour spotlight attribute */
  dataTour?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Custom additional CSS classes */
  className?: string;
}

const COLOR_MAPS = {
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    iconBg: 'bg-indigo-600',
    iconText: 'text-white',
    valueText: 'text-slate-900',
    subtext: 'text-indigo-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    iconBg: 'bg-emerald-600',
    iconText: 'text-white',
    valueText: 'text-slate-900',
    subtext: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    iconBg: 'bg-amber-600',
    iconText: 'text-white',
    valueText: 'text-slate-900',
    subtext: 'text-amber-600',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    iconBg: 'bg-purple-600',
    iconText: 'text-white',
    valueText: 'text-slate-900',
    subtext: 'text-purple-600',
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    iconBg: 'bg-rose-600',
    iconText: 'text-white',
    valueText: 'text-slate-900',
    subtext: 'text-rose-600',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    iconBg: 'bg-blue-600',
    iconText: 'text-white',
    valueText: 'text-slate-900',
    subtext: 'text-blue-600',
  },
  slate: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    iconBg: 'bg-slate-700',
    iconText: 'text-white',
    valueText: 'text-slate-900',
    subtext: 'text-slate-500',
  },
};

/**
 * Reusable Telemetry KPI StatCard component for displaying farm analytics and operational metrics.
 */
export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'indigo',
  dataTour,
  onClick,
  className = '',
}: StatCardProps) {
  const styles = COLOR_MAPS[color] || COLOR_MAPS.indigo;

  return (
    <div 
      data-tour={dataTour}
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
    >
      <Card className={`hover:border-indigo-300 transition-all duration-200 shadow-sm ${className}`}>
        <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
            <p className={`text-2xl sm:text-3xl font-bold ${styles.valueText}`}>{value}</p>
            {subtext && (
              <p className={`text-xs font-medium ${styles.subtext} flex items-center gap-1 mt-1`}>
                {subtext}
              </p>
            )}
          </div>

          {Icon && (
            <div className={`w-12 h-12 rounded-2xl ${styles.iconBg} ${styles.iconText} flex items-center justify-center shadow-sm shrink-0`}>
              <Icon size={24} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
