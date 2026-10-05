'use strict';

import { supabase as serviceRoleClient } from '@/lib/supabase';
import { getCurrencyInfo, getDefaultExchangeRate } from '@/lib/currency';

export const DEFAULT_CMS = {
  brandName: 'PFMS',
  brandTagline: 'Smart Poultry Operating System',
  brandLogoText: 'P',
  logoUrl: '/icon.png',
  primaryColor: '#4f46e5',
  accentColor: '#7c3aed',
  footerText: 'PFMS Inc. All rights reserved.',
  heroHeading: 'AI-Driven poultry farms with human-level precision',
  heroSubtitle: 'Empower your farm managers with AI-driven insights to help them track flock health, predict egg yields, and perform at peak efficiency.',
  announcementBanner: 'New Release: AI Voice Auto-Logger & Multi-Farm Enterprise Hub live now',
  ctaText: 'Get Started Free',
  supportPhone: '+234 800 768 5879',
  supportEmail: 'support@pfms-poultry.com',
  currencySymbol: '$',
  currencyCode: 'USD',
  exchangeRate: 1.0,
  platformName: 'PFMS'
};

export async function getPublicBranding() {
  try {
    const { data: cmsRow } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'landing_page_cms')
      .maybeSingle();

    const { data: gatewayRow } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'gateways_config')
      .maybeSingle();

    let cmsParsed: any = {};
    if (cmsRow?.adminName) {
      try {
        cmsParsed = typeof cmsRow.adminName === 'string' ? JSON.parse(cmsRow.adminName) : cmsRow.adminName;
      } catch (_e) {}
    }

    let gatewayParsed: any = {};
    if (gatewayRow?.adminName) {
      try {
        gatewayParsed = typeof gatewayRow.adminName === 'string' ? JSON.parse(gatewayRow.adminName) : gatewayRow.adminName;
      } catch (_e) {}
    }

    const brandName = cmsParsed.brandName || gatewayParsed.platformName || DEFAULT_CMS.brandName;
    const logoUrl = cmsParsed.logoUrl || gatewayParsed.logoUrl || DEFAULT_CMS.logoUrl;

    const rawCurrencySymbol = cmsParsed.currencySymbol || gatewayParsed.currencySymbol || DEFAULT_CMS.currencySymbol || '$';
    const currencyInfo = getCurrencyInfo(rawCurrencySymbol);
    const currencySymbol = currencyInfo.symbol;
    const exchangeRate = cmsParsed.exchangeRate || gatewayParsed.exchangeRate || getDefaultExchangeRate(currencySymbol);

    const sanitized = {
      brandName,
      platformName: brandName,
      brandTagline: cmsParsed.brandTagline || DEFAULT_CMS.brandTagline,
      brandLogoText: cmsParsed.brandLogoText || DEFAULT_CMS.brandLogoText,
      logoUrl: logoUrl || '/icon.png',
      primaryColor: cmsParsed.primaryColor || DEFAULT_CMS.primaryColor,
      accentColor: cmsParsed.accentColor || DEFAULT_CMS.accentColor,
      footerText: cmsParsed.footerText || DEFAULT_CMS.footerText,
      heroHeading: cmsParsed.heroHeading || DEFAULT_CMS.heroHeading,
      heroSubtitle: cmsParsed.heroSubtitle || DEFAULT_CMS.heroSubtitle,
      announcementBanner: cmsParsed.announcementBanner || DEFAULT_CMS.announcementBanner,
      ctaText: cmsParsed.ctaText || DEFAULT_CMS.ctaText,
      supportPhone: cmsParsed.supportPhone || DEFAULT_CMS.supportPhone,
      supportEmail: cmsParsed.supportEmail || DEFAULT_CMS.supportEmail,
      currencySymbol,
      currencyCode: currencyInfo.code,
      exchangeRate,
    };

    return sanitized;
  } catch (_err: any) {
    return DEFAULT_CMS;
  }
}

