'use strict';
'use client';

import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '@/components/features/LanguageContext';

interface TableSortHeaderProps<K extends string = string> {
  label: React.ReactNode;
  sortKey: K;
  currentSort?: { key: string; direction: 'asc' | 'desc' | null } | null;
  onSort: (key: K) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function TableSortHeader<K extends string = string>({ label, sortKey, currentSort, onSort, className = "", align = 'left' }: TableSortHeaderProps<K>) {
  const { t } = useLanguage();
  const isSorted = currentSort?.key === sortKey;
  const direction = currentSort?.direction;

  const displayLabel = typeof label === 'string' ? t(label) : label;

  return (
    <th 
      className={`px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <span>{displayLabel}</span>
        <div className="flex flex-col text-slate-400">
          {!isSorted || direction === null ? (
            <ArrowUpDown size={12} className="opacity-50" />
          ) : direction === 'asc' ? (
            <ArrowUp size={12} className="text-indigo-600" />
          ) : (
            <ArrowDown size={12} className="text-indigo-600" />
          )}
        </div>
      </div>
    </th>
  );
}
