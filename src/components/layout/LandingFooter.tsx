'use strict';
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export function LandingFooter({
  brandName: propBrandName,
  brandLogoText: propBrandLogoText,
  logoUrl: propLogoUrl,
  primaryColor: propPrimaryColor,
  footerText: propFooterText
}: {
  brandName?: string;
  brandLogoText?: string;
  logoUrl?: string;
  primaryColor?: string;
  footerText?: string;
}) {
  const [brandName, setBrandName] = useState(propBrandName || 'PFMS');
  const [brandLogoText, setBrandLogoText] = useState(propBrandLogoText || 'P');
  const [logoUrl, setLogoUrl] = useState(propLogoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(propPrimaryColor || '#4f46e5');
  const [footerText, setFooterText] = useState(propFooterText || 'PFMS Inc. All rights reserved.');

  useEffect(() => {
    if (!propBrandName) {
      fetch('/api/admin/cms')
        .then(res => res.json())
        .then(data => {
          if (data?.brandName) setBrandName(data.brandName);
          if (data?.brandLogoText) setBrandLogoText(data.brandLogoText);
          else if (data?.brandName) setBrandLogoText(data.brandName.charAt(0).toUpperCase());
          if (data?.logoUrl !== undefined) setLogoUrl(data.logoUrl || '');
          if (data?.primaryColor) setPrimaryColor(data.primaryColor);
          if (data?.footerText) setFooterText(data.footerText);
          else if (data?.brandName) setFooterText(`${data.brandName} Inc. All rights reserved.`);
        })
        .catch(() => {});
    }
  }, [propBrandName]);

  return (
    <footer className="bg-white border-t border-slate-200 py-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={logoUrl} alt={brandName} className="h-6 max-w-[120px] object-contain" />
          ) : (
            <div 
              className="w-6 h-6 rounded text-white font-bold text-xs flex items-center justify-center shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {brandLogoText}
            </div>
          )}
          <span className="font-bold text-slate-800">{brandName}</span>
        </Link>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 font-medium">
          <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
          <Link href="/about" className="hover:text-indigo-600 transition-colors">About Us</Link>
          <Link href="/contact" className="hover:text-indigo-600 transition-colors">Contact Support</Link>
        </div>
        <div className="text-sm text-slate-400 font-normal">
          © {new Date().getFullYear()} {footerText}
        </div>
      </div>
    </footer>
  );
}
