'use strict';

import { supabase as serviceRoleClient } from './supabase';
import { SaasPlanConfig } from '@/components/features/admin/AdminCmsClient';

export interface FeatureSwitches {
  cctvEnabled: boolean;
  aiLoggerEnabled: boolean;
  exportReportsEnabled: boolean;
  enterpriseHubEnabled: boolean;
  maxBranches: number;
}

const DEFAULT_PLANS: SaasPlanConfig[] = [
  {
    id: 'free',
    name: 'Free Starter',
    description: 'Perfect for small farms getting started with digital log management.',
    priceMonthly: 0,
    priceAnnual: 0,
    maxBranches: 1,
    cctvEnabled: false,
    aiLoggerEnabled: false,
    exportReportsEnabled: false,
    enterpriseHubEnabled: false,
    features: ['1 Farm Branch Included', 'Basic Egg & Feed Logs', 'Community Forum Support', '2 Staff Accounts']
  },
  {
    id: 'pro',
    name: 'Commercial Pro',
    description: 'For growing poultry farms requiring AI telemetry and automated reports.',
    priceMonthly: 15000,
    priceAnnual: 144000,
    maxBranches: 5,
    cctvEnabled: true,
    aiLoggerEnabled: true,
    exportReportsEnabled: true,
    enterpriseHubEnabled: false,
    features: ['Up to 5 Farm Branches', 'CCTV Live Surveillance', 'AI Voice Auto-Logger', 'PDF & Excel Export Reports', 'Unlimited Staff Accounts']
  },
  {
    id: 'enterprise',
    name: 'Enterprise & Cooperative',
    description: 'For multi-farm operations, cooperative white-label portals, and API access.',
    priceMonthly: 45000,
    priceAnnual: 432000,
    maxBranches: 999,
    cctvEnabled: true,
    aiLoggerEnabled: true,
    exportReportsEnabled: true,
    enterpriseHubEnabled: true,
    features: ['Unlimited Farm Branches', 'Cooperative White-Label Portal', '24/7 Priority Consultant Hotline', 'Custom REST API Keys', 'Multi-Farm Matrix Dashboard']
  }
];

/**
 * Fetch authoritative SaaS plans configuration from Supabase systemSettings
 */
export async function getSaasPlansConfig(): Promise<SaasPlanConfig[]> {
  try {
    const { data } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'saas_plans_config')
      .single();

    if (data?.adminName) {
      const parsed = JSON.parse(data.adminName);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as SaasPlanConfig[];
      }
    }
  } catch (_e) {}

  return DEFAULT_PLANS;
}

/**
 * Evaluate dynamic feature switches for a given tier (free, pro, enterprise)
 */
export async function getFeatureSwitchesForTier(tier: string): Promise<FeatureSwitches> {
  const normTier = (tier || 'free').toLowerCase();
  const effectiveTier = (normTier === 'entrepreneur' || normTier === 'enterprise_plus') ? 'enterprise' : normTier;

  const plans = await getSaasPlansConfig();
  const matchedPlan = plans.find(p => p.id === effectiveTier) || plans.find(p => p.id === 'free') || DEFAULT_PLANS[0];

  return {
    cctvEnabled: Boolean(matchedPlan.cctvEnabled),
    aiLoggerEnabled: Boolean(matchedPlan.aiLoggerEnabled),
    exportReportsEnabled: Boolean(matchedPlan.exportReportsEnabled),
    enterpriseHubEnabled: Boolean(matchedPlan.enterpriseHubEnabled),
    maxBranches: Number(matchedPlan.maxBranches || 1),
  };
}
