'use strict';
'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '@/components/features/LanguageContext';

interface TableControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  placeholder?: string;
  actions?: React.ReactNode;
}

export function TableControls({ searchTerm, setSearchTerm, placeholder, actions }: TableControlsProps) {
  const { t } = useLanguage();
  const effectivePlaceholder = placeholder ? t(placeholder) : t("Search...");

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 border-b border-slate-100 bg-white">
      <div className="relative w-full sm:w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={effectivePlaceholder}
          className="w-full pl-9 pr-4 py-2 sm:py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 transition-all bg-white shadow-sm"
        />
      </div>
      {actions && (
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
