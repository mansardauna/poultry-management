'use strict';

import { supabase as serviceRoleClient } from '@/lib/supabase';

export const DEFAULT_PLANS = [
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
    priceMonthly: 15000,
    priceAnnual: 144000,
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
      'CCTV Live Surveillance Gateway',
      'PDF & Excel Exportable Financial Reports',
      'Shift Checklist Queue & Payroll Indicators',
      'Unlimited Staff Accounts'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise & Cooperative',
    description: 'For multi-farm operations, cooperative white-label portals, REST APIs, and vet hotlines.',
    priceMonthly: 45000,
    priceAnnual: 432000,
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

export async function getPublicPlans() {
  try {
    const { data } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'saas_plans_config')
      .single();

    if (data?.adminName) {
      const parsedPlans = typeof data.adminName === 'string'
        ? JSON.parse(data.adminName)
        : data.adminName;
      if (Array.isArray(parsedPlans) && parsedPlans.length > 0) {
        return parsedPlans;
      }
    }
    return DEFAULT_PLANS;
  } catch (_err: any) {
    return DEFAULT_PLANS;
  }
}
