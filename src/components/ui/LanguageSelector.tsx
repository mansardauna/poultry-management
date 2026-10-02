'use strict';
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../features/LanguageContext';
import { Language, SUPPORTED_LANGUAGES } from '@/lib/i18n/types';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'light' | 'dark' | 'minimal';
  compact?: boolean;
  align?: 'left' | 'right';
}

export function LanguageSelector({ 
  className = '', 
  variant = 'light',
  compact = false,
  align = 'right'
}: LanguageSelectorProps) {
  const { language, setLanguage, dir } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.id === language) || SUPPORTED_LANGUAGES[0];

  const baseStyle = variant === 'dark' 
    ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-800 shadow-sm' 
    : variant === 'minimal'
    ? 'bg-transparent border-transparent text-slate-700 hover:bg-slate-100'
    : 'bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm';

  const menuTheme = variant === 'dark'
    ? 'bg-slate-900 border-slate-700 text-slate-200 divide-slate-800'
    : 'bg-white border-slate-200 text-slate-800 divide-slate-100';

  const itemHoverTheme = variant === 'dark'
    ? 'hover:bg-slate-800'
    : 'hover:bg-indigo-50/70';

  const activeItemTheme = variant === 'dark'
    ? 'bg-slate-800/90 text-indigo-400 font-bold'
    : 'bg-indigo-50 text-indigo-700 font-bold';

  const alignmentClass = align === 'left' || dir === 'rtl' ? 'left-0' : 'right-0';

  return (
    <div className="relative inline-block text-left shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`relative inline-flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 text-xs transition-all cursor-pointer select-none ${baseStyle} ${className}`}
        title="Change language / تغيير اللغة / Cambiar idioma / Changer de langue / Yi ede pada / Gbanwee asụsụ / Canza harshe"
      >
        <Globe size={15} className="text-indigo-600 shrink-0" />
        <span className={`font-bold tracking-tight text-xs ${compact ? 'inline' : 'inline sm:hidden'}`}>
          {currentLang.code}
        </span>
        {!compact && (
          <span className="font-semibold text-xs hidden sm:inline whitespace-nowrap">
            {currentLang.nativeName} ({currentLang.code})
          </span>
        )}
        <ChevronDown 
          size={13} 
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div 
          role="listbox"
          className={`absolute ${alignmentClass} mt-2 w-64 rounded-2xl border shadow-2xl z-50 overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${menuTheme}`}
        >
          <div className="px-3.5 py-2.5 border-b border-inherit bg-slate-500/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Globe size={14} className="text-indigo-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Language
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {SUPPORTED_LANGUAGES.length}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = language === lang.id;
              return (
                <button
                  key={lang.id}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer text-left ${
                    isSelected ? activeItemTheme : itemHoverTheme
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-7 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${
                      isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : variant === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {lang.code}
                    </span>
                    <div className="flex flex-col truncate">
                      <span className="font-semibold truncate leading-tight">
                        {lang.nativeName}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight">
                        {lang.name} • {lang.region}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
