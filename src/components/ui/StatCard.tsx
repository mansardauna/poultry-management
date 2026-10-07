'use strict';
'use client';

import React from 'react';
import { Card, CardContent } from './Card';
import { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/components/features/LanguageContext';
import { formatCompactNumber } from '@/lib/currency';

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
  /** Optional badge or chip component placed next to the metric value */
  badge?: React.ReactNode;
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
    iconText: 'text-indigo-600',
    valueText: 'text-slate-900',
    subtext: 'text-indigo-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    iconText: 'text-emerald-600',
    valueText: 'text-slate-900',
    subtext: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    iconText: 'text-amber-500',
    valueText: 'text-slate-900',
    subtext: 'text-amber-600',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    iconText: 'text-purple-600',
    valueText: 'text-slate-900',
    subtext: 'text-purple-600',
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    iconText: 'text-rose-500',
    valueText: 'text-slate-900',
    subtext: 'text-rose-600',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    iconText: 'text-blue-600',
    valueText: 'text-slate-900',
    subtext: 'text-blue-600',
  },
  slate: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    iconText: 'text-slate-400',
    valueText: 'text-slate-900',
    subtext: 'text-slate-500',
  },
};

/**
 * Helper to compact large numbers inside StatCard values, including values with currency symbols (e.g. "₦1,500,000", "$250,000", 12500, "15,000 Birds").
 */
function formatStatCardValue(val: string | number): string {
  if (typeof val === 'number') {
    return formatCompactNumber(val, 1);
  }
  if (typeof val !== 'string') return String(val ?? '');

  const str = val.trim();
  // Match prefix symbol (e.g. $, ₦, €, £, CA$, etc.) followed by numbers/commas/decimals and optional suffix unit
  const match = str.match(/^([^0-9.-]*?)([-+]?[0-9,]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) return str;

  const prefix = match[1];
  const numRaw = match[2].replace(/,/g, '');
  const suffix = match[3];

  const parsed = Number(numRaw);
  if (isNaN(parsed) || !Number.isFinite(parsed)) return str;

  // Only compact if >= 1000 or <= -1000
  if (Math.abs(parsed) >= 1000) {
    const compacted = formatCompactNumber(parsed, 1);
    return `${prefix}${compacted}${suffix}`;
  }

  return str;
}

/**
 * Reusable Telemetry KPI StatCard component for displaying farm analytics and operational metrics.
 * Automatically translates card titles and subtexts, and formats large numbers with K, M, B to prevent overflow.
 */
export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'indigo',
  badge,
  dataTour,
  onClick,
  className = '',
}: StatCardProps) {
  const { t } = useLanguage();
  const styles = COLOR_MAPS[color] || COLOR_MAPS.indigo;

  const displayValue = formatStatCardValue(value);
  const fullValueString = String(value);

  return (
    <div 
      data-tour={dataTour}
      onClick={onClick}
      className={onClick ? 'cursor-pointer group' : ''}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <Card className={`transition-all duration-200 shadow-sm ${
        onClick 
          ? 'hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer' 
          : 'hover:border-indigo-200'
      } ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1 min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors truncate">{t(title)}</p>
                {onClick && (
                  <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <p 
                  className={`text-2xl sm:text-3xl font-semibold tracking-tight ${styles.valueText} truncate`}
                  title={fullValueString !== displayValue ? fullValueString : undefined}
                >
                  {displayValue}
                </p>
                {badge}
              </div>
              {subtext && (
                <p className={`text-xs font-medium ${styles.subtext} flex items-center gap-1 mt-1 truncate`}>
                  {t(subtext)}
                </p>
              )}
            </div>

            {Icon && (
              <Icon size={28} className={`${styles.iconText} shrink-0`} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
