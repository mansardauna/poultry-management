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
  logoUrl: '',
  brandColor: 'indigo',
  brandName: 'PFMS',
  platformName: 'PFMS',
  brandLogoText: 'P',
  primaryColor: '#4f46e5',
  currencySymbol: '₦',
  customReportHeader: 'Official Farm Management Analytics Report',
  customInvoiceFooter: 'Thank you for buying from our certified organic poultry farm!',
  themeMode: 'modern',
  updateWhiteLabel: async () => {},
};

const WhiteLabelContext = createContext<WhiteLabelSettings>(DEFAULT_SETTINGS);

export function WhiteLabelProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Omit<WhiteLabelSettings, 'updateWhiteLabel'>>({
    coopName: DEFAULT_SETTINGS.coopName,
    subdomain: DEFAULT_SETTINGS.subdomain,
    logoUrl: DEFAULT_SETTINGS.logoUrl,
    brandColor: DEFAULT_SETTINGS.brandColor,
    brandName: DEFAULT_SETTINGS.brandName,
    platformName: DEFAULT_SETTINGS.platformName,
    brandLogoText: DEFAULT_SETTINGS.brandLogoText,
    primaryColor: DEFAULT_SETTINGS.primaryColor,
    currencySymbol: DEFAULT_SETTINGS.currencySymbol,
    customReportHeader: DEFAULT_SETTINGS.customReportHeader,
    customInvoiceFooter: DEFAULT_SETTINGS.customInvoiceFooter,
    themeMode: DEFAULT_SETTINGS.themeMode,
  });

  const loadBrandAndSettings = () => {
    // 1. Fetch Global Platform CMS / Branding / Currency (propagate to all tenants)
    fetch('/api/admin/cms')
      .then(res => res.ok ? res.json() : null)
      .then(cms => {
        if (cms) {
          setSettings(prev => ({
            ...prev,
            brandName: cms.brandName || prev.brandName,
            platformName: cms.platformName || cms.brandName || prev.platformName,
            brandLogoText: cms.brandLogoText || prev.brandLogoText,
            logoUrl: cms.logoUrl !== undefined && cms.logoUrl !== '' ? cms.logoUrl : prev.logoUrl,
            primaryColor: cms.primaryColor || prev.primaryColor,
            currencySymbol: cms.currencySymbol || prev.currencySymbol,
          }));
        }
      })
      .catch(() => {});

    // 2. Fetch authoritative database settings from /api/enterprise for the current workspace
    fetch('/api/enterprise')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.cooperative) {
          const c = data.cooperative;
          setSettings(prev => ({
            ...prev,
            coopName: c.coopName || prev.coopName,
            subdomain: c.subdomain || prev.subdomain,
            logoUrl: c.logoUrl || prev.logoUrl,
            brandColor: (c.brandColor || prev.brandColor) as any,
            customReportHeader: c.customReportHeader || prev.customReportHeader,
            customInvoiceFooter: c.customInvoiceFooter || prev.customInvoiceFooter,
            themeMode: c.themeMode || prev.themeMode,
          }));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    // Purge legacy un-scoped browser localStorage white-label settings to prevent cross-account leakage
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pfms_white_label');
      }
    } catch (_e) {}

    loadBrandAndSettings();

    if (typeof window !== 'undefined') {
      window.addEventListener('pfms_brand_updated', loadBrandAndSettings);
      return () => {
        window.removeEventListener('pfms_brand_updated', loadBrandAndSettings);
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
