'use strict';
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

import { useLanguage } from '../features/LanguageContext';
import { LanguageSelector } from '../ui/LanguageSelector';

export function LandingNav({ 
  activePath, 
  brandName: propBrandName,
  brandLogoText: propBrandLogoText,
  logoUrl: propLogoUrl,
  primaryColor: propPrimaryColor
}: { 
  activePath?: string;
  brandName?: string;
  brandLogoText?: string;
  logoUrl?: string;
  primaryColor?: string;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [brandName, setBrandName] = useState(propBrandName || 'PFMS');
  const [brandLogoText, setBrandLogoText] = useState(propBrandLogoText || 'P');
  const [logoUrl, setLogoUrl] = useState(propLogoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(propPrimaryColor || '#4f46e5');
  const { t } = useLanguage();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setIsLoggedIn(!!data.authenticated);
      })
      .catch(() => {
        setIsLoggedIn(false);
      });

    if (!propBrandName) {
      fetch('/api/admin/cms')
        .then(res => res.json())
        .then(data => {
          if (data?.brandName) setBrandName(data.brandName);
          if (data?.brandLogoText) setBrandLogoText(data.brandLogoText);
          else if (data?.brandName) setBrandLogoText(data.brandName.charAt(0).toUpperCase());
          if (data?.logoUrl !== undefined) setLogoUrl(data.logoUrl || '');
          if (data?.primaryColor) setPrimaryColor(data.primaryColor);
        })
        .catch(() => {});
    }
  }, [propBrandName]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoUrl} alt={brandName} className="h-8 max-w-[160px] object-contain" />
            ) : (
              <div 
                className="w-8 h-8 rounded-lg text-white font-bold flex items-center justify-center text-sm shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {brandLogoText}
              </div>
            )}
            <span className="font-bold text-xl tracking-tight text-slate-800">
              {brandName}
            </span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <Link href="/about" className={`hover:text-indigo-600 transition-colors ${activePath === '/about' ? 'text-indigo-600 font-semibold' : ''}`}>{t("About")}</Link>
            <Link href="/pricing" className={`hover:text-indigo-600 transition-colors ${activePath === '/pricing' ? 'text-indigo-600 font-semibold' : ''}`}>{t("Pricing")}</Link>
            <Link href="/documentation" className={`hover:text-indigo-600 transition-colors ${activePath === '/documentation' || activePath === '/documentation/index.html' ? 'text-indigo-600 font-semibold' : ''}`}>{t("Documentation")}</Link>
            <Link href="/contact" className={`hover:text-indigo-600 transition-colors ${activePath === '/contact' ? 'text-indigo-600 font-semibold' : ''}`}>{t("Contact")}</Link>
          </div>
          
          <div className="flex items-center gap-2.5 sm:gap-4">
            <LanguageSelector variant="light" />

            {isLoggedIn ? (
              <Link href="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95">
                {t("Dashboard")}
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors hidden sm:block">
                  {t("Log In")}
                </Link>
                <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95 whitespace-nowrap">
                  {t("Sign Up Free")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
