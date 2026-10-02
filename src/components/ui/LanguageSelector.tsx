'use strict';
'use client';

import React from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../features/LanguageContext';
import { Language } from '@/lib/i18n/types';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'light' | 'dark' | 'minimal';
  compact?: boolean;
}

const LANGUAGE_CONFIG: Record<Language, { label: string; short: string }> = {
  en: { label: 'English', short: 'EN' },
  zh: { label: '中文', short: 'ZH' },
  id: { label: 'Indonesia', short: 'ID' },
  hi: { label: 'हिन्दी', short: 'HI' },
  sw: { label: 'Kiswahili', short: 'SW' },
};

export function LanguageSelector({ 
  className = '', 
  variant = 'light',
  compact = false 
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const baseStyle = variant === 'dark' 
    ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-800 shadow-sm' 
    : variant === 'minimal'
    ? 'bg-transparent border-transparent text-slate-700 hover:bg-slate-100'
    : 'bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm';

  const current = LANGUAGE_CONFIG[language] || { label: 'English', short: 'EN' };

  return (
    <div 
      className={`relative inline-flex items-center border rounded-xl px-2 sm:px-2.5 py-1.5 text-xs transition-colors cursor-pointer select-none shrink-0 ${baseStyle} ${className}`}
      title="Change language / 更改语言 / Ubah bahasa / भाषा बदलें / Badilisha lugha"
    >
      <Globe size={14} className="text-indigo-600 mr-1.5 shrink-0" />
      <span className={`font-bold tracking-tight text-xs ${compact ? 'inline' : 'inline sm:hidden'}`}>
        {current.short}
      </span>
      {!compact && (
        <span className="font-semibold text-xs hidden sm:inline whitespace-nowrap">
          {current.label} ({current.short})
        </span>
      )}
      <ChevronDown size={12} className="ml-1 opacity-50 shrink-0 pointer-events-none" />

      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
        aria-label="Select Language"
      >
        <option value="en" className="text-slate-900 bg-white">English (EN)</option>
        <option value="zh" className="text-slate-900 bg-white">中文 (ZH)</option>
        <option value="id" className="text-slate-900 bg-white">Indonesia (ID)</option>
        <option value="hi" className="text-slate-900 bg-white">हिन्दी (HI)</option>
        <option value="sw" className="text-slate-900 bg-white">Kiswahili (SW)</option>
      </select>
    </div>
  );
}
