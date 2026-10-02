'use strict';
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink min-w-0">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoUrl} alt={brandName} className="h-7 sm:h-8 max-w-[130px] sm:max-w-[160px] object-contain shrink-0" />
            ) : (
              <div 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {brandLogoText}
              </div>
            )}
            <span className="font-bold text-base sm:text-xl tracking-tight text-slate-800 truncate">
              {brandName}
            </span>
          </Link>
          
          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <Link href="/about" className={`hover:text-indigo-600 transition-colors ${activePath === '/about' ? 'text-indigo-600 font-semibold' : ''}`}>{t("About")}</Link>
            <Link href="/pricing" className={`hover:text-indigo-600 transition-colors ${activePath === '/pricing' ? 'text-indigo-600 font-semibold' : ''}`}>{t("Pricing")}</Link>
            <Link href="/documentation" className={`hover:text-indigo-600 transition-colors ${activePath === '/documentation' || activePath === '/documentation/index.html' ? 'text-indigo-600 font-semibold' : ''}`}>{t("Documentation")}</Link>
            <Link href="/contact" className={`hover:text-indigo-600 transition-colors ${activePath === '/contact' ? 'text-indigo-600 font-semibold' : ''}`}>{t("Contact")}</Link>
          </div>
          
          {/* Actions & Mobile Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Language Selector (Always visible, compact on mobile) */}
            <LanguageSelector variant="light" />

            {/* Desktop Auth Actions */}
            {isLoggedIn ? (
              <Link href="/dashboard" className="hidden sm:inline-flex bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95">
                {t("Dashboard")}
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors">
                  {t("Log In")}
                </Link>
                <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95 whitespace-nowrap">
                  {t("Sign Up Free")}
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
            <Link 
              href="/about" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors ${activePath === '/about' ? 'text-indigo-600 bg-indigo-50/50' : ''}`}
            >
              {t("About")}
            </Link>
            <Link 
              href="/pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors ${activePath === '/pricing' ? 'text-indigo-600 bg-indigo-50/50' : ''}`}
            >
              {t("Pricing")}
            </Link>
            <Link 
              href="/documentation" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors ${activePath === '/documentation' || activePath === '/documentation/index.html' ? 'text-indigo-600 bg-indigo-50/50' : ''}`}
            >
              {t("Documentation")}
            </Link>
            <Link 
              href="/contact" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors ${activePath === '/contact' ? 'text-indigo-600 bg-indigo-50/50' : ''}`}
            >
              {t("Contact")}
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {isLoggedIn ? (
              <Link 
                href="/dashboard" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20"
              >
                {t("Dashboard")}
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200"
                >
                  {t("Log In")}
                </Link>
                <Link 
                  href="/signup" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20"
                >
                  <span>{t("Sign Up Free")}</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
