'use strict';
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface WhiteLabelSettings {
  coopName: string;
  subdomain: string;
  logoUrl: string;
  brandColor: 'indigo' | 'emerald' | 'purple' | 'amber' | 'slate';
  brandName: string;
  platformName: string;
  brandLogoText: string;
  primaryColor: string;
  currencySymbol: string;
  customReportHeader: string;
  customInvoiceFooter: string;
  themeMode: string;
  updateWhiteLabel: (settings: Partial<WhiteLabelSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: WhiteLabelSettings = {
  coopName: '',
  subdomain: 'main',
  logoUrl: '/icon.png',
  brandColor: 'indigo',
  brandName: 'PFMS',
  platformName: 'PFMS',
  brandLogoText: 'P',
  primaryColor: '#4f46e5',
  currencySymbol: '$',
  customReportHeader: 'Official Farm Management Analytics Report',
  customInvoiceFooter: 'Thank you for buying from our certified organic poultry farm!',
  themeMode: 'modern',
  updateWhiteLabel: async () => {},
};

const WhiteLabelContext = createContext<WhiteLabelSettings>(DEFAULT_SETTINGS);

export function WhiteLabelProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Omit<WhiteLabelSettings, 'updateWhiteLabel'>>(() => {
    // Immediate hydration from cached brand settings to avoid flash of default name
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('pfms_cached_brand');
        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            ...DEFAULT_SETTINGS,
            brandName: parsed.brandName || DEFAULT_SETTINGS.brandName,
            platformName: parsed.platformName || parsed.brandName || DEFAULT_SETTINGS.platformName,
            logoUrl: parsed.logoUrl || DEFAULT_SETTINGS.logoUrl,
            primaryColor: parsed.primaryColor || DEFAULT_SETTINGS.primaryColor,
          };
        }
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  const loadBrandAndSettings = () => {
    // 1. Fetch Global Platform CMS / Branding / Currency (propagate to all tenants & public visitors)
    fetch('/api/branding')
      .then(res => res.ok ? res.json() : null)
      .then(cms => {
        if (cms) {
          const effectiveLogo = cms.logoUrl && cms.logoUrl.trim() !== '' ? cms.logoUrl : '/icon.png';
          const effectiveBrand = cms.brandName || cms.platformName || DEFAULT_SETTINGS.brandName;

          setSettings(prev => ({
            ...prev,
            brandName: effectiveBrand,
            platformName: effectiveBrand,
            brandLogoText: cms.brandLogoText || effectiveBrand.charAt(0).toUpperCase() || 'P',
            logoUrl: effectiveLogo,
            primaryColor: cms.primaryColor || prev.primaryColor,
            currencySymbol: cms.currencySymbol || prev.currencySymbol,
          }));

          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('pfms_cached_brand', JSON.stringify({
                brandName: effectiveBrand,
                platformName: effectiveBrand,
                logoUrl: effectiveLogo,
                primaryColor: cms.primaryColor,
              }));
            }
          } catch {}
        }
      })
      .catch(() => {});

    // 2. Fetch cooperative/tenant specific settings only when inside authenticated dashboard
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isPublic = ['/', '/login', '/signup', '/pricing', '/about', '/contact', '/privacy', '/terms', '/documentation', '/reset-password', '/setup'].some(
      p => pathname === p || pathname.startsWith('/pay-invoice')
    );

    if (!isPublic && pathname.startsWith('/dashboard')) {
      fetch('/api/enterprise')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.cooperative) {
            const c = data.cooperative;
            setSettings(prev => ({
              ...prev,
              coopName: c.coopName || prev.coopName,
              subdomain: c.subdomain || prev.subdomain,
              logoUrl: c.logoUrl || prev.logoUrl || '/icon.png',
              brandColor: (c.brandColor || prev.brandColor) as WhiteLabelSettings['brandColor'],
              customReportHeader: c.customReportHeader || prev.customReportHeader,
              customInvoiceFooter: c.customInvoiceFooter || prev.customInvoiceFooter,
              themeMode: c.themeMode || prev.themeMode,
            }));
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    loadBrandAndSettings();

    if (typeof window !== 'undefined') {
      const handleBrandUpdate = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail) {
          setSettings(prev => ({
            ...prev,
            brandName: detail.platformName || detail.brandName || prev.brandName,
            platformName: detail.platformName || detail.brandName || prev.platformName,
            logoUrl: detail.logoUrl || prev.logoUrl,
            currencySymbol: detail.currencySymbol || prev.currencySymbol
          }));
        }
        loadBrandAndSettings();
      };

      window.addEventListener('pfms_brand_updated', handleBrandUpdate);
      return () => {
        window.removeEventListener('pfms_brand_updated', handleBrandUpdate);
      };
    }
  }, []);

  const updateWhiteLabel = async (newSettings: Partial<WhiteLabelSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      await fetch('/api/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_cooperative',
          ...updated
        })
      });
    } catch {}
  };

  return (
    <WhiteLabelContext.Provider value={{ ...settings, updateWhiteLabel }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabel() {
  return useContext(WhiteLabelContext);
}
