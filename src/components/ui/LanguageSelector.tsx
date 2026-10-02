'use strict';
'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../features/LanguageContext';
import { Language } from '@/lib/i18n/types';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'light' | 'dark' | 'minimal';
}

export function LanguageSelector({ className = '', variant = 'light' }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const baseStyle = variant === 'dark' 
    ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800' 
    : variant === 'minimal'
    ? 'bg-transparent border-transparent text-slate-700 hover:bg-slate-100'
    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm';

  return (
    <div className={`relative inline-flex items-center border rounded-xl px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${baseStyle} ${className}`}>
      <Globe size={14} className="text-indigo-600 mr-1.5 shrink-0" />
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="bg-transparent border-0 outline-none cursor-pointer font-semibold focus:ring-0 py-0 pr-4 pl-0 appearance-none text-xs text-inherit"
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
