import { supabase as serviceRoleClient } from '@/lib/supabase';

export interface GatewaysConfig {
  stripePublicKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  resendApiKey?: string;
  fromEmail?: string;
  currencySymbol?: string;
  platformName?: string;
  aiProvider?: string;
  aiApiKey?: string;
  aiModel?: string;
  aiBaseUrl?: string;
  [key: string]: any;
}

export async function getGatewaysConfig(): Promise<GatewaysConfig> {
  let config: GatewaysConfig = {
    stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
    currencySymbol: '₦',
    platformName: 'PFMS',
    aiApiKey: process.env.GEMINI_API_KEY || '',
    aiModel: 'gemini-3.5-flash',
  };

  try {
    const { data } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'gateways_config')
      .maybeSingle();

    if (data?.adminName) {
      const parsed = typeof data.adminName === 'string' ? JSON.parse(data.adminName) : data.adminName;
      if (parsed && typeof parsed === 'object') {
        config = { ...config, ...parsed };
      }
    }
  } catch (_e) {}

  if (!config.stripeSecretKey) config.stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
  if (!config.stripePublicKey) config.stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  if (!config.stripeWebhookSecret) config.stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  return config;
}
