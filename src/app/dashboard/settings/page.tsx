'use strict';
import { supabase } from "@/lib/supabase";
import { SettingsClient } from "@/components/features/settings/SettingsClient";
import { getWorkspaceId } from "@/lib/workspace";
import { getAuthUser } from "@/lib/auth";

/** Exported function default */
export default async function SettingsPage() {
  const workspaceId = await getWorkspaceId();
  
  const user = await getAuthUser();
  const role = user?.role || 'Staff';

  const alertSettings = (await supabase.from('alertSettings').select('*').eq('workspaceId', workspaceId).limit(1)).data?.[0] ?? {
    feedThresholdKg: 50,
    eggDropPercentage: 15,
    notifySms: true,
    notifyEmail: true,
    notifyWhatsapp: true,
  };

  const rawSystemSettings = (await supabase.from('systemSettings').select('*').eq('workspaceId', workspaceId).limit(1)).data?.[0];
  const systemSettings = rawSystemSettings ? {
    ...rawSystemSettings,
    eggCratePriceSmall: rawSystemSettings.eggCratePriceSmall ?? undefined,
    eggCratePriceLarge: rawSystemSettings.eggCratePriceLarge ?? undefined,
    adminName: rawSystemSettings.adminName ?? undefined,
    adminEmail: rawSystemSettings.adminEmail ?? undefined,
    adminPhone: rawSystemSettings.adminPhone ?? undefined,
    paystackPublicKey: rawSystemSettings.paystackPublicKey ?? undefined,
    paystackSecretKey: rawSystemSettings.paystackSecretKey ?? undefined,
  } : {
    id: 'default',
    workspaceId,
    eggCratePriceSmall: 4200,
    eggCratePriceLarge: 4400,
    adminName: 'Farm Admin',
    adminEmail: 'admin@example.com',
    adminPhone: '+2340000000000'
  };

  const workspaces = (await supabase.from('workspaces').select('*')).data || [];
  const paymentMethods = (await supabase.from('payment_methods').select('*').eq('workspaceId', workspaceId)).data || [];
  const subscriptionHistory = (await supabase.from('subscription_history').select('*').eq('workspaceId', workspaceId).order('createdAt', { ascending: false })).data || [];

  return <SettingsClient 
    initialSettings={alertSettings} 
    systemSettings={systemSettings} 
    initialPaymentMethods={paymentMethods}
    initialSubscriptionHistory={subscriptionHistory}
    workspaces={workspaces} 
    workspaceId={workspaceId} 
  />;
}
