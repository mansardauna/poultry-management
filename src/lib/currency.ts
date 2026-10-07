'use strict';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  defaultRatePerUsd: number; // 1 USD = X in this currency
}

export const CURRENCY_CONFIGS: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', defaultRatePerUsd: 1.0 },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', defaultRatePerUsd: 1500.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', defaultRatePerUsd: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', defaultRatePerUsd: 0.78 },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', defaultRatePerUsd: 130.0 },
  GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', defaultRatePerUsd: 15.5 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', defaultRatePerUsd: 18.0 },
  XOF: { code: 'XOF', symbol: 'CFA', name: 'West African Franc', defaultRatePerUsd: 600.0 },
  UGX: { code: 'UGX', symbol: 'UGX', name: 'Ugandan Shilling', defaultRatePerUsd: 3700.0 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', defaultRatePerUsd: 84.0 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', defaultRatePerUsd: 1.36 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', defaultRatePerUsd: 1.52 }
};

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = Object.values(CURRENCY_CONFIGS);

/**
 * Find currency info by symbol or currency code.
 */
export function getCurrencyInfo(symbolOrCode: string = '$'): CurrencyInfo {
  const trimmed = (symbolOrCode || '$').trim();
  // Check exact code match
  if (CURRENCY_CONFIGS[trimmed.toUpperCase()]) {
    return CURRENCY_CONFIGS[trimmed.toUpperCase()];
  }
  // Check exact symbol match
  const foundBySymbol = SUPPORTED_CURRENCIES.find(
    c => c.symbol.toLowerCase() === trimmed.toLowerCase()
  );
  if (foundBySymbol) return foundBySymbol;

  // Fallback match within name or symbol
  const partial = SUPPORTED_CURRENCIES.find(
    c => c.symbol.includes(trimmed) || trimmed.includes(c.symbol) || trimmed.includes(c.code)
  );
  if (partial) return partial;

  // Default to USD
  return CURRENCY_CONFIGS.USD;
}

/**
 * Get default exchange rate against USD (1 USD = rate units of target currency)
 */
export function getDefaultExchangeRate(symbolOrCode: string = '$'): number {
  return getCurrencyInfo(symbolOrCode).defaultRatePerUsd;
}

/**
 * Convert an amount from USD ($) to the target currency.
 * If target currency is USD ($), returns the amount directly.
 */
export function convertUsdToCurrency(
  usdAmount: number,
  targetSymbolOrCode: string = '$',
  customRate?: number
): number {
  if (usdAmount === 0 || !Number.isFinite(usdAmount)) return 0;
  const rate = customRate && customRate > 0 ? customRate : getDefaultExchangeRate(targetSymbolOrCode);
  const info = getCurrencyInfo(targetSymbolOrCode);

  // If rate is 1 or currency is USD, return as is
  if (info.code === 'USD' || rate === 1) {
    return Math.round(usdAmount * 100) / 100;
  }

  // Round depending on currency scale (e.g. NGN, CFA, UGX, KES round to whole numbers)
  const converted = usdAmount * rate;
  if (rate >= 10) {
    return Math.round(converted);
  }
  return Math.round(converted * 100) / 100;
}

/**
 * Convert an amount from a given currency back to USD ($).
 */
export function convertCurrencyToUsd(
  localAmount: number,
  fromSymbolOrCode: string = '$',
  customRate?: number
): number {
  if (localAmount === 0 || !Number.isFinite(localAmount)) return 0;
  const rate = customRate && customRate > 0 ? customRate : getDefaultExchangeRate(fromSymbolOrCode);
  const info = getCurrencyInfo(fromSymbolOrCode);

  if (info.code === 'USD' || rate === 1) {
    return Math.round(localAmount * 100) / 100;
  }
  return Math.round((localAmount / rate) * 100) / 100;
}

/**
 * Convert an amount from one currency to another using USD as the base.
 */
export function convertBetweenCurrencies(
  amount: number,
  fromSymbolOrCode: string,
  toSymbolOrCode: string,
  fromCustomRate?: number,
  toCustomRate?: number
): number {
  if (amount === 0 || !Number.isFinite(amount)) return 0;
  const usd = convertCurrencyToUsd(amount, fromSymbolOrCode, fromCustomRate);
  return convertUsdToCurrency(usd, toSymbolOrCode, toCustomRate);
}

/**
 * Base SaaS plan definition in USD ($)
 */
export const BASE_USD_PLANS = [
  {
    id: 'free',
    name: 'Free Starter',
    description: 'Perfect for small farms getting started with digital log management.',
    priceMonthly: 0,
    priceAnnual: 0,
    stripeMonthlyPlanId: '',
    stripeAnnualPlanId: '',
    paystackMonthlyPlanCode: '',
    paystackAnnualPlanCode: '',
    maxBranches: 1,
    chartsEnabled: false,
    cctvEnabled: false,
    aiLoggerEnabled: false,
    exportReportsEnabled: false,
    enterpriseHubEnabled: false,
    features: [
      '1 Farm Branch Included',
      'Basic Egg Collection & Feed Tracking',
      'Basic Flock Mortality & Weight Logs',
      '2 Staff Accounts',
      'Basic KPI Metrics Summary',
      'Community Forum & Documentation Support'
    ]
  },
  {
    id: 'pro',
    name: 'Commercial Pro',
    description: 'For growing poultry farms requiring AI telemetry, advanced charts, and automated reports.',
    priceMonthly: 15,
    priceAnnual: 144,
    stripeMonthlyPlanId: '',
    stripeAnnualPlanId: '',
    paystackMonthlyPlanCode: '',
    paystackAnnualPlanCode: '',
    maxBranches: 5,
    chartsEnabled: true,
    cctvEnabled: true,
    aiLoggerEnabled: true,
    exportReportsEnabled: true,
    enterpriseHubEnabled: false,
    features: [
      'Up to 5 Regional Farm Branches',
      'Production Analytics Bar & Line Charts',
      'Voice & Text AI Auto-Logger Widget',
      'CCTV Surveillance (On Roadmap)',
      'PDF & Excel Exportable Financial Reports',
      'Shift Checklist Queue & Payroll Indicators',
      'Unlimited Staff Accounts'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise & Cooperative',
    description: 'For multi-farm operations, cooperative white-label portals, REST APIs, and vet hotlines.',
    priceMonthly: 45,
    priceAnnual: 432,
    stripeMonthlyPlanId: '',
    stripeAnnualPlanId: '',
    paystackMonthlyPlanCode: '',
    paystackAnnualPlanCode: '',
    maxBranches: 999,
    chartsEnabled: true,
    cctvEnabled: true,
    aiLoggerEnabled: true,
    exportReportsEnabled: true,
    enterpriseHubEnabled: true,
    features: [
      'Unlimited Regional Farm Branches',
      'Multi-Farm Branch Matrix & Aggregated Telemetry',
      'Cross-Branch Inter-Location Stock Transfers',
      'Permanent Branch Deletion & Matrix Control',
      'Global White-Labeling & Themes (Logo, Subdomain, Invoices & PDF)',
      'Production REST API Keys & Webhooks (QuickBooks, SAP, Sage)',
      '24/7 Priority Veterinarian Inspection Ticket Hotline',
      'Wholesale Feed Procurement Pool (15% Bulk Volume Discounts)'
    ]
  }
];

export interface CurrencyAdaptablePlan {
  id?: string;
  priceMonthly?: number;
  priceAnnual?: number;
  basePriceMonthly?: number;
  basePriceAnnual?: number;
  [key: string]: unknown;
}

/**
 * Adapt plans to a target currency with rate conversion applied from base USD
 */
export function adaptPlansToCurrency(
  plans: CurrencyAdaptablePlan[],
  targetCurrencySymbol: string = '$',
  customRate?: number
) {
  const rate = customRate && customRate > 0 ? customRate : getDefaultExchangeRate(targetCurrencySymbol);
  const info = getCurrencyInfo(targetCurrencySymbol);

  return plans.map(p => {
    // If the plan has base USD prices, convert them
    const baseMonthly = Number(p.basePriceMonthly ?? p.priceMonthly) || 0;
    const baseAnnual = Number(p.basePriceAnnual ?? p.priceAnnual) || 0;

    // Guard against legacy large numbers if target currency is USD
    let effectiveUsdMonthly = baseMonthly;
    let effectiveUsdAnnual = baseAnnual;

    if (info.code === 'USD' && baseMonthly > 100) {
      // Legacy stored amount in NGN (e.g. 15000 or 17000)
      if (p.id === 'pro') {
        effectiveUsdMonthly = 15;
        effectiveUsdAnnual = 144;
      } else if (p.id === 'enterprise') {
        effectiveUsdMonthly = 45;
        effectiveUsdAnnual = 432;
      } else {
        effectiveUsdMonthly = Math.round(baseMonthly / 1500);
        effectiveUsdAnnual = Math.round(baseAnnual / 1500);
      }
    }

    const convertedMonthly = info.code === 'USD' 
      ? effectiveUsdMonthly 
      : convertUsdToCurrency(effectiveUsdMonthly, targetCurrencySymbol, rate);

    const convertedAnnual = info.code === 'USD'
      ? effectiveUsdAnnual
      : convertUsdToCurrency(effectiveUsdAnnual, targetCurrencySymbol, rate);

    return {
      ...p,
      basePriceMonthly: effectiveUsdMonthly,
      basePriceAnnual: effectiveUsdAnnual,
      priceMonthly: convertedMonthly,
      priceAnnual: convertedAnnual,
      currencySymbol: info.symbol,
      currencyCode: info.code,
      exchangeRate: rate
    };
  });
}

/**
 * Formats a number with compact notation (e.g. 1.5K, 2.3M, 4.1B) to prevent overflow in UI.
 */
export function formatCompactNumber(value: number | string, maxDecimals: number = 1): string {
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num) || !Number.isFinite(num)) return String(value ?? '');

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const formatted = (abs / 1_000_000_000).toFixed(maxDecimals).replace(/\.0+$/, '');
    return `${sign}${formatted}B`;
  }
  if (abs >= 1_000_000) {
    const formatted = (abs / 1_000_000).toFixed(maxDecimals).replace(/\.0+$/, '');
    return `${sign}${formatted}M`;
  }
  if (abs >= 1_000) {
    const formatted = (abs / 1_000).toFixed(maxDecimals).replace(/\.0+$/, '');
    return `${sign}${formatted}K`;
  }

  // Small values: keep up to maxDecimals if fractional, else whole
  return Number.isInteger(num) ? num.toString() : num.toFixed(maxDecimals).replace(/\.?0+$/, '');
}

/**
 * Formats a currency amount using compact notation (e.g. $15K, ₦1.5M, $2.4B).
 */
export function formatCompactCurrency(
  amount: number | string,
  symbol: string = '$',
  maxDecimals: number = 1
): string {
  const compact = formatCompactNumber(amount, maxDecimals);
  return `${symbol}${compact}`;
}
