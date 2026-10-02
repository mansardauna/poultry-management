'use strict';
'use client';
import Link from 'next/link';
import { useLanguage } from '../features/LanguageContext';
import { useWhiteLabel } from '../features/WhiteLabelContext';

export function LandingFooter({
  brandName: propBrandName,
  logoUrl: propLogoUrl,
  footerText: propFooterText
}: {
  brandName?: string;
  brandLogoText?: string;
  logoUrl?: string;
  primaryColor?: string;
  footerText?: string;
}) {
  const whiteLabel = useWhiteLabel();
  const { t } = useLanguage();

  const brandName = propBrandName || whiteLabel.brandName || whiteLabel.platformName || 'PFMS';
  const logoUrl = propLogoUrl || whiteLabel.logoUrl || '/icon.png';
  const footerText = propFooterText || `${brandName} Inc. All rights reserved.`;

  return (
    <footer className="bg-white border-t border-slate-200 py-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={logoUrl || '/icon.png'} 
            alt={brandName} 
            className="h-6 w-auto max-w-[120px] object-contain transition-transform group-hover:scale-105" 
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (!target.src.endsWith('/icon.png')) {
                target.src = '/icon.png';
              }
            }}
          />
          <span className="font-bold text-slate-800">{brandName}</span>
        </Link>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 font-medium">
          <Link href="/privacy" className="hover:text-indigo-600 transition-colors">{t("Privacy Policy")}</Link>
          <Link href="/terms" className="hover:text-indigo-600 transition-colors">{t("Terms of Service")}</Link>
          <Link href="/documentation" className="hover:text-indigo-600 transition-colors">{t("Documentation")}</Link>
          <Link href="/contact" className="hover:text-indigo-600 transition-colors">{t("Contact")}</Link>
        </div>
        <div className="text-sm text-slate-400 font-normal">
          © {new Date().getFullYear()} {footerText}
        </div>
      </div>
    </footer>
  );
}
