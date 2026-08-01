import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

interface TableSortHeaderProps {
  label: React.ReactNode;
  sortKey: string;
  currentSort?: { key: any; direction: 'asc' | 'desc' | null } | null;
  onSort: (key: any) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function TableSortHeader({ label, sortKey, currentSort, onSort, className = "", align = 'left' }: TableSortHeaderProps) {
  const isSorted = currentSort?.key === sortKey;
  const direction = currentSort?.direction;

  return (
    <th 
      className={`px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <span>{label}</span>
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
