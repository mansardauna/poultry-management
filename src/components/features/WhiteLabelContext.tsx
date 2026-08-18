'use strict';
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface WhiteLabelSettings {
  coopName: string;
  subdomain: string;
  logoUrl: string;
  brandColor: 'indigo' | 'emerald' | 'purple' | 'amber' | 'slate';
  customReportHeader: string;
  customInvoiceFooter: string;
  themeMode: string;
  updateWhiteLabel: (settings: Partial<WhiteLabelSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: WhiteLabelSettings = {
  coopName: 'My Enterprise Poultry Farm',
  subdomain: 'myfarm',
  logoUrl: '',
  brandColor: 'indigo',
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
    customReportHeader: DEFAULT_SETTINGS.customReportHeader,
    customInvoiceFooter: DEFAULT_SETTINGS.customInvoiceFooter,
    themeMode: DEFAULT_SETTINGS.themeMode,
  });

  useEffect(() => {
    // 1. Read from localStorage for immediate instant rendering
    try {
      const saved = localStorage.getItem('pfms_white_label');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (_e) {}

    // 2. Fetch authoritative database settings from /api/enterprise
    fetch('/api/enterprise')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.cooperative) {
          const c = data.cooperative;
          const newSet = {
            coopName: c.coopName || DEFAULT_SETTINGS.coopName,
            subdomain: c.subdomain || DEFAULT_SETTINGS.subdomain,
            logoUrl: c.logoUrl || DEFAULT_SETTINGS.logoUrl,
            brandColor: (c.brandColor || DEFAULT_SETTINGS.brandColor) as any,
            customReportHeader: c.customReportHeader || DEFAULT_SETTINGS.customReportHeader,
            customInvoiceFooter: c.customInvoiceFooter || DEFAULT_SETTINGS.customInvoiceFooter,
            themeMode: c.themeMode || DEFAULT_SETTINGS.themeMode,
          };
          setSettings(newSet);
          localStorage.setItem('pfms_white_label', JSON.stringify(newSet));
        }
      })
      .catch(() => {});
  }, []);

  const updateWhiteLabel = async (newSettings: Partial<WhiteLabelSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('pfms_white_label', JSON.stringify(updated));

    try {
      await fetch('/api/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_cooperative',
          ...updated
        })
      });
    } catch (e) {
      console.error('Failed to sync white-label settings to API:', e);
    }
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
