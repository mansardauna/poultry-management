'use strict';

import { supabase as serviceRoleClient } from '@/lib/supabase';
import { getPublicBranding } from '@/lib/branding';
import { 
  BASE_USD_PLANS, 
  adaptPlansToCurrency, 
  getCurrencyInfo 
} from '@/lib/currency';

export const DEFAULT_PLANS = BASE_USD_PLANS;

export async function getPublicPlans(targetCurrency?: string, customRate?: number) {
  try {
    const branding = await getPublicBranding();
    const activeCurrency = targetCurrency || branding.currencySymbol || '$';
    const isBrandingCurrency = !targetCurrency || targetCurrency === branding.currencySymbol;
    const activeRate = customRate && customRate > 0
      ? customRate
      : (isBrandingCurrency ? (branding.exchangeRate || 1.0) : undefined);

    const { data } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'saas_plans_config')
      .maybeSingle();

    let rawPlans = BASE_USD_PLANS;
    if (data?.adminName) {
      try {
        const parsedPlans = typeof data.adminName === 'string'
          ? JSON.parse(data.adminName)
          : data.adminName;
        if (Array.isArray(parsedPlans) && parsedPlans.length > 0) {
          rawPlans = parsedPlans;
        }
      } catch (_e) {}
    }

    return adaptPlansToCurrency(rawPlans, activeCurrency, activeRate);
  } catch (_err: any) {
    return adaptPlansToCurrency(BASE_USD_PLANS, '$', 1.0);
  }
}
